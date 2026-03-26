import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()

DB_URL = f"postgresql://postgres:Looa2002!!@34.64.236.78:5432/nemone_now"

def add_course_likes_table():
    engine = create_engine(DB_URL)
    with engine.connect() as conn:
        print("🛠 코스 좋아요 기능을 위한 테이블을 생성합니다...")
        try:
            # 코스 전용 좋아요 테이블
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS course_likes (
                    id SERIAL PRIMARY KEY,
                    user_email TEXT NOT NULL,
                    course_id INTEGER NOT NULL REFERENCES saved_courses(id) ON DELETE CASCADE,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(user_email, course_id)
                )
            """))
            conn.commit()
            print("✅ 코스 좋아요 테이블 생성 완료!")
        except Exception as e:
            conn.rollback()
            print(f"❌ 생성 실패: {e}")

if __name__ == "__main__":
    add_course_likes_table()
