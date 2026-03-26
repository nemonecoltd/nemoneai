from database import engine
from sqlalchemy import text

def init_cache_table():
    print("🚀 [지금여기] 캐시 테이블 초기화 시작...")
    with engine.connect() as conn:
        try:
            # 1. 테이블 생성
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS ai_itinerary_cache (
                    id SERIAL PRIMARY KEY,
                    companion VARCHAR(50),
                    itinerary_json JSONB,
                    created_at DATE DEFAULT CURRENT_DATE,
                    UNIQUE(companion, created_at)
                )
            """))
            conn.commit()
            print("✅ 'ai_itinerary_cache' 테이블 생성 성공")
            
            # 2. 제약 조건 추가 (이미 있다면 무시)
            # UNIQUE 제약 조건은 이미 CREATE TABLE 단계에 포함됨
            
        except Exception as e:
            conn.rollback()
            print(f"❌ 테이블 생성 실패: {e}")

if __name__ == "__main__":
    init_cache_table()
