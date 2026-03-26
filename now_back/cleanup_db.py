import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()

DB_URL = f"postgresql://postgres:Looa2002!!@34.64.236.78:5432/nemone_now"

def cleanup_and_strengthen():
    engine = create_engine(DB_URL)
    with engine.connect() as conn:
        print("🧹 DB를 초기화하고 제약 조건을 강화합니다...")
        try:
            # 1. 기존 데이터 삭제
            conn.execute(text("TRUNCATE TABLE seongsu_places"))
            # 2. 제목(title) 기준 유니크 제약 조건 추가 (중복 방지 핵심)
            conn.execute(text("ALTER TABLE seongsu_places DROP CONSTRAINT IF EXISTS unique_title"))
            conn.execute(text("ALTER TABLE seongsu_places ADD CONSTRAINT unique_title UNIQUE (title)"))
            conn.commit()
            print("✅ DB 청소 및 중복 방지 설정 완료!")
        except Exception as e:
            conn.rollback()
            print(f"❌ 작업 실패: {e}")

if __name__ == "__main__":
    cleanup_and_strengthen()
