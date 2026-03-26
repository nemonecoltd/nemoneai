import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()

DB_URL = f"postgresql://postgres:Looa2002!!@34.64.236.78:5432/nemone_now"

def init_v2_tables():
    engine = create_engine(DB_URL)
    with engine.connect() as conn:
        print("🛠 유저 및 저장 기능을 위한 테이블을 생성합니다...")
        try:
            # 1. 사용자 테이블
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS users (
                    id SERIAL PRIMARY KEY,
                    email TEXT UNIQUE NOT NULL,
                    name TEXT,
                    image_url TEXT,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                )
            """))
            # 2. 좋아요 테이블
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS likes (
                    id SERIAL PRIMARY KEY,
                    user_email TEXT NOT NULL,
                    place_id INTEGER NOT NULL REFERENCES seongsu_places(id) ON DELETE CASCADE,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(user_email, place_id)
                )
            """))
            # 3. 코스 저장 테이블
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS saved_courses (
                    id SERIAL PRIMARY KEY,
                    user_email TEXT NOT NULL,
                    title TEXT NOT NULL,
                    description TEXT,
                    steps JSONB NOT NULL,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                )
            """))
            conn.commit()
            print("✅ 테이블 생성 완료!")
        except Exception as e:
            conn.rollback()
            print(f"❌ 생성 실패: {e}")

if __name__ == "__main__":
    init_v2_tables()
