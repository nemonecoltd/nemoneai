import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()

# 직접 접속 정보 고정
DB_HOST = "34.64.236.78"
DB_PORT = "5432"
DB_USER = "postgres"
DB_PASS = "Looa2002!!"
DB_NAME = "nemone_now"

DB_URL = f"postgresql://{DB_USER}:{DB_PASS}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

def fix_db_dimension():
    engine = create_engine(DB_URL)
    with engine.connect() as conn:
        print(f"🛠 DB '{DB_NAME}'의 벡터 차원을 3072로 수정합니다 (인덱스 미사용)...")
        try:
            # 1. 기존 테이블 삭제
            conn.execute(text("DROP TABLE IF EXISTS seongsu_places CASCADE"))
            
            # 2. 3072차원으로 테이블 재생성
            sql = """
            CREATE TABLE seongsu_places (
                id SERIAL PRIMARY KEY,
                title TEXT NOT NULL,
                content TEXT,
                image_url TEXT,
                video_url TEXT,
                location TEXT,
                date_range TEXT,
                end_date DATE,
                embedding VECTOR(3072),
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
            """
            conn.execute(text(sql))
            conn.commit()
            print("✅ DB 수정 완료! (3072차원 데이터 저장 준비 끝)")
        except Exception as e:
            conn.rollback()
            print(f"❌ 수정 실패: {e}")

if __name__ == "__main__":
    fix_db_dimension()
