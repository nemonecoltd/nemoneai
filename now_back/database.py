import os
from sqlalchemy import create_engine, text
from datetime import datetime, timedelta
from dotenv import load_dotenv

# .env 파일 로드
load_dotenv()

# GCP Cloud SQL 혹은 로컬 DB 연결 설정 (SSH 터널링 Port 5433 반영)
DB_HOST = os.getenv("DB_HOST", "127.0.0.1")
DB_PORT = os.getenv("DB_PORT", "5433")
DB_NAME = os.getenv("DB_NAME", "nemone_now")
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASS = os.getenv("DB_PASSWORD", "postgres")

DB_URL = f"postgresql://{DB_USER}:{DB_PASS}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
engine = create_engine(DB_URL)

def cleanup_expired_data():
    """[지침] 30일 경과 데이터 자동 삭제 로직"""
    with engine.connect() as conn:
        # 현재 날짜 기준 30일 이전 데이터 삭제
        limit_date = datetime.now() - timedelta(days=30)
        query = text("DELETE FROM seongsu_places WHERE created_at < :limit_date")
        conn.execute(query, {"limit_date": limit_date})
        conn.commit()
