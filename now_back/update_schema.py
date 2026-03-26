import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()

DB_HOST = "34.64.236.78"
DB_PORT = "5432"
DB_USER = "postgres"
DB_PASS = "Looa2002!!"
DB_NAME = "nemone_now"

DB_URL = f"postgresql://{DB_USER}:{DB_PASS}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

def update_table_schema():
    engine = create_engine(DB_URL)
    with engine.connect() as conn:
        print("🛠 위치 정보(위경도) 컬럼을 추가합니다...")
        try:
            # latitude, longitude 컬럼 추가
            conn.execute(text("ALTER TABLE seongsu_places ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION"))
            conn.execute(text("ALTER TABLE seongsu_places ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION"))
            # 네이버 지도 고유 ID (중복 방지용) 컬럼 추가
            conn.execute(text("ALTER TABLE seongsu_places ADD COLUMN IF NOT EXISTS naver_place_id TEXT UNIQUE"))
            conn.commit()
            print("✅ 컬럼 추가 완료!")
        except Exception as e:
            conn.rollback()
            print(f"❌ 수정 실패: {e}")

if __name__ == "__main__":
    update_table_schema()
