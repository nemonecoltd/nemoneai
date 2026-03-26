import os
import json
from database import engine
from sqlalchemy import text
from gemini_service import generate_walking_tour
from datetime import date

def test_itinerary_reproduction(region='홍대', lang='ko'):
    print(f"🔍 [{region}] ({lang}) 코스 생성 재현 테스트 시작...")
    
    # 1. DB 데이터 확인
    with engine.connect() as conn:
        res = conn.execute(text("SELECT COUNT(*) FROM seongsu_places WHERE region = :region"), {"region": region}).fetchone()
        count = res[0]
        print(f"📊 {region} 데이터 개수: {count}")
        
        if count == 0:
            print("❌ 에러 원인 발견: 해당 지역에 데이터가 하나도 없습니다.")
            context_text = ""
        else:
            result = conn.execute(text("SELECT title, content, location FROM seongsu_places WHERE region = :region LIMIT 15"), {"region": region})
            context_text = "\n".join([f"[{row[0]}] {row[1]}" for row in result])
            print("✅ 컨텍스트 생성 완료 (일부 발췌):", context_text[:100] + "...")

    # 2. Gemini 호출 테스트
    try:
        print("🤖 Gemini 호출 중 (현재 설정 유지)...")
        # generate_walking_tour를 바로 호출하여 로직 오류가 없는지 확인
        from gemini_service import generate_walking_tour
        itinerary = generate_walking_tour("Solo", context_text, region=region, lang=lang)
        print("✨ 결과 성공:")
        print(json.dumps(itinerary, indent=2, ensure_ascii=False))
    except Exception as e:
        print(f"💥 Gemini 호출 실패: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_itinerary_reproduction('홍대', 'ko')
