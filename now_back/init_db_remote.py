import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

# .env 파일 로드 (DB_HOST=34.64.236.78로 가정)
load_dotenv()

# GCP DB 직접 접속 정보
DB_HOST = "34.64.236.78"
DB_PORT = "5432"
DB_USER = "postgres"
DB_PASS = "Looa2002!!"

# 1. 관리용 연결 (기본 postgres DB 접속)
ADMIN_DB_URL = f"postgresql://{DB_USER}:{DB_PASS}@{DB_HOST}:{DB_PORT}/postgres"
# 2. 성수 프로젝트 전용 연결
TARGET_DB_NAME = "nemone_now"
TARGET_DB_URL = f"postgresql://{DB_USER}:{DB_PASS}@{DB_HOST}:{DB_PORT}/{TARGET_DB_NAME}"

def init_database():
    # 단계 1: 데이터베이스 생성 시도
    # postgres는 DB 생성 시 AUTOCOMMIT 모드가 필요함
    admin_engine = create_engine(ADMIN_DB_URL, isolation_level="AUTOCOMMIT")
    with admin_engine.connect() as conn:
        print(f"🚀 원격 DB 서버({DB_HOST})에 접속 시도 중...")
        try:
            exists = conn.execute(text(f"SELECT 1 FROM pg_database WHERE datname='{TARGET_DB_NAME}'")).fetchone()
            if not exists:
                print(f"'{TARGET_DB_NAME}' 데이터베이스를 생성합니다...")
                conn.execute(text(f"CREATE DATABASE {TARGET_DB_NAME}"))
            else:
                print(f"✅ '{TARGET_DB_NAME}' 데이터베이스가 이미 존재합니다.")
        except Exception as e:
            print(f"❌ DB 접속 혹은 생성 실패: {e}")
            print("팁: GCP 방화벽에서 현재 IP가 5432 포트로 허용되어 있는지 확인해 주세요.")
            return

    # 단계 2: 테이블 및 벡터 확장 설정
    target_engine = create_engine(TARGET_DB_URL)
    with target_engine.connect() as conn:
        print(f"🛠 '{TARGET_DB_NAME}' 내부에 테이블 및 pgvector 설정을 시작합니다...")
        try:
            # SQL 명령어들
            sql_commands = [
                "CREATE EXTENSION IF NOT EXISTS vector",
                """
                CREATE TABLE IF NOT EXISTS seongsu_places (
                    id SERIAL PRIMARY KEY,
                    title TEXT NOT NULL,
                    content TEXT,
                    image_url TEXT,
                    video_url TEXT,
                    location TEXT,
                    date_range TEXT,
                    end_date DATE,
                    embedding VECTOR(768),
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                )
                """,
                "CREATE INDEX ON seongsu_places USING ivfflat (embedding vector_l2_ops)"
            ]
            
            for cmd in sql_commands:
                conn.execute(text(cmd))
            conn.commit()
            print("✨ 모든 설정이 완료되었습니다! (맛매치 영향 없음)")
        except Exception as e:
            conn.rollback()
            print(f"❌ 설정 중 오류 발생: {e}")

if __name__ == "__main__":
    init_database()
