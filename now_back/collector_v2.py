import asyncio
from sqlalchemy import text
from database import engine
from scraper_naver_map import scrape_naver_map_popups
from gemini_service import get_embedding
from datetime import date, timedelta

async def run_hybrid_collection():
    print("🚀 안정화된 하이브리드 데이터 수집 시작...")
    
    map_data = await scrape_naver_map_popups()
    
    if not map_data:
        print("⚠️ 데이터 없음")
        return

    for item in map_data:
        # 각 항목마다 독립적으로 DB 세션 연결하여 처리 (트랜잭션 분리)
        with engine.connect() as conn:
            try:
                title = item['title'].strip()
                if not title: continue

                print(f"✨ '{title}' 처리 중...")
                embedding = get_embedding(item['content'])
                
                # title 혹은 naver_place_id 중복 시 업데이트하도록 로직 강화
                # 여기서는 title 기준으로 우선 처리
                upsert_query = text("""
                    INSERT INTO seongsu_places 
                    (title, content, location, latitude, longitude, naver_place_id, video_url, embedding, end_date)
                    VALUES (:title, :content, :location, :latitude, :longitude, :naver_place_id, :video_url, :embedding, :end_date)
                    ON CONFLICT (title) 
                    DO UPDATE SET 
                        location = EXCLUDED.location,
                        latitude = EXCLUDED.latitude,
                        longitude = EXCLUDED.longitude,
                        naver_place_id = EXCLUDED.naver_place_id,
                        content = EXCLUDED.content,
                        end_date = EXCLUDED.end_date
                """)
                
                conn.execute(upsert_query, {
                    "title": title,
                    "content": item['content'],
                    "location": item['location'],
                    "latitude": item['latitude'],
                    "longitude": item['longitude'],
                    "naver_place_id": item['naver_place_id'],
                    "video_url": "",
                    "embedding": f"[{','.join(map(str, embedding))}]",
                    "end_date": date.today() + timedelta(days=30)
                })
                conn.commit()
                print(f"   ㄴ DB 반영 완료")
            except Exception as e:
                conn.rollback() # 에러 시 롤백하여 트랜잭션 복구
                print(f"❌ '{item.get('title')}' 반영 실패: {e}")

    print("✅ 데이터 동기화 프로세스 종료.")

if __name__ == "__main__":
    asyncio.run(run_hybrid_collection())
