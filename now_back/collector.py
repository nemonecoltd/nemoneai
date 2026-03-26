import asyncio
import os
import time
import logging
from datetime import date, timedelta
from apscheduler.schedulers.background import BackgroundScheduler
from sqlalchemy import text

from scraper import scrape_popup
from gemini_service import get_embedding
from database import engine, cleanup_expired_data

# 로깅 설정
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def run_collection_flow():
    """스크래핑 -> 정제 -> 벡터화 -> DB 적재의 전체 흐름 실행"""
    regions = ["성수", "홍대"]
    
    for region in regions:
        print(f"🚀 {region} 실시간 데이터 수집 프로세스 가동...")
        
        # 1. 네이버 스크래핑 및 Gemini 정제 (검색 시 '동' 붙여서 정확도 향상)
        search_region = f"{region}동" if region == "성수" else region
        scraped_data = await scrape_popup(search_region)
        
        if not scraped_data:
            print(f"⚠️ {region} 수집된 데이터가 없어 건너뜁니다.")
            continue

        print(f"📦 {region}: {len(scraped_data)}개의 유효 데이터를 확보했습니다. 벡터화 및 저장을 시작합니다.")

        with engine.connect() as conn:
            for item in scraped_data:
                try:
                    # 2. 필수 필드 존재 여부 확인
                    title = item.get('title')
                    content = item.get('content') or item.get('title')
                    if not title: continue

                    print(f"✨ [{region}] '{title}' 처리 중...")

                    # 3. 벡터화
                    embedding = get_embedding(content)
                    
                    # 4. DB 저장
                    insert_query = text("""
                        INSERT INTO seongsu_places (title, content, location, date_range, image_url, video_url, embedding, end_date, region)
                        VALUES (:title, :content, :location, :date_range, :image_url, :video_url, :embedding, :end_date, :region)
                    """)
                    
                    end_date = date.today() + timedelta(days=30)
                    
                    conn.execute(insert_query, {
                        "title": title,
                        "content": content,
                        "location": item.get('location'),
                        "date_range": item.get('date_range'),
                        "image_url": item.get('image_url'),
                        "video_url": item.get('video_url', ""),
                        "embedding": f"[{','.join(map(str, embedding))}]",
                        "end_date": end_date,
                        "region": region
                    })
                    conn.commit()
                except Exception as e:
                    logger.error(f"❌ {region}: '{item.get('title')}' 처리 실패: {e}")

    print("✅ 모든 지역 데이터 수집 및 적재 완료!")

# --- 스케줄러 설정 ---
def scheduled_task():
    """매일 자정에 실행될 스케줄러 작업"""
    print("⏰ [스케줄러] 데이터 정기 청소 및 수집 시작...")
    cleanup_expired_data()
    asyncio.run(run_collection_flow())

scheduler = BackgroundScheduler()
# 매일 자정(00:00)에 실행
scheduler.add_job(scheduled_task, 'cron', hour=0, minute=0)

if __name__ == "__main__":
    # 1. 초기 데이터 적재 실행
    try:
        asyncio.run(run_collection_flow())
    except Exception as e:
        print(f"🚨 초기 수집 오류: {e}")
        print("팁: 'pip install playwright' 및 'playwright install chromium'이 필요할 수 있습니다.")

    # 2. 스케줄러 가동
    print("⏰ 백그라운드 스케줄러(자정 청소 및 수집) 가동 중...")
    scheduler.start()
    
    try:
        while True:
            time.sleep(1)
    except (KeyboardInterrupt, SystemExit):
        scheduler.shutdown()
