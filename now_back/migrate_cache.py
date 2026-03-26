from sqlalchemy import create_engine, text

# DB 접속 정보
DB_CONFIG = {
    "host": "34.64.236.78",
    "database": "postgres",
    "user": "postgres",
    "password": "Looa2002!!",
    "port": "5432"
}

SQLALCHEMY_DATABASE_URL = f"postgresql://{DB_CONFIG['user']}:{DB_CONFIG['password']}@{DB_CONFIG['host']}:{DB_CONFIG['port']}/{DB_CONFIG['database']}"
engine = create_engine(SQLALCHEMY_DATABASE_URL)

def migrate():
    with engine.begin() as conn:
        print("🚀 AI 코스 캐시 테이블 생성 중...")
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS ai_itinerary_cache (
                id SERIAL PRIMARY KEY,
                companion VARCHAR(50) NOT NULL,
                itinerary_json JSONB NOT NULL,
                created_at DATE DEFAULT CURRENT_DATE,
                UNIQUE(companion, created_at)
            )
        """))
        print("✅ ai_itinerary_cache 테이블이 준비되었습니다.")

if __name__ == "__main__":
    migrate()
