from database import engine
from sqlalchemy import text

def check_all_tables():
    print("📋 [지금여기] DB 스키마 점검 시작...")
    with engine.connect() as conn:
        # 1. 테이블 목록 조회
        tables = conn.execute(text("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'")).fetchall()
        print(f"📦 현재 테이블 목록: {[t[0] for t in tables]}")
        
        # 2. ai_itinerary_cache 상세 점검
        if 'ai_itinerary_cache' in [t[0] for t in tables]:
            cols = conn.execute(text("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'ai_itinerary_cache'")).fetchall()
            print(f"✅ 'ai_itinerary_cache' 컬럼 정보: {cols}")
        else:
            print("❌ 'ai_itinerary_cache' 테이블이 없습니다! (에러 원인 후보 1)")
            
        # 3. seongsu_places region 데이터 점검
        regions = conn.execute(text("SELECT region, COUNT(*) FROM seongsu_places GROUP BY region")).fetchall()
        print(f"📊 지역별 데이터 분포: {regions}")

if __name__ == "__main__":
    check_all_tables()
