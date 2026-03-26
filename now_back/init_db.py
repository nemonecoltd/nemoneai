import os
from sqlalchemy import create_engine, text
from sqlalchemy.exc import ProgrammingError
from dotenv import load_dotenv

load_dotenv()

# 1. 관리용 연결 (기본 postgres DB 접속)
ADMIN_DB_URL = f"postgresql://{os.getenv('DB_USER')}:{os.getenv('DB_PASSWORD')}@{os.getenv('DB_HOST')}:{os.getenv('DB_PORT')}/postgres"
# 2. 성수 프로젝트 전용 연결
TARGET_DB_NAME = os.getenv('DB_NAME', 'nemone_now')
TARGET_DB_URL = f"postgresql://{os.getenv('DB_USER')}:{os.getenv('DB_PASSWORD')}@{os.getenv('DB_HOST')}:{os.getenv('DB_PORT')}/{TARGET_DB_NAME}"

def init_database():
    # 단계 1: 전용 데이터베이스 생성 확인
    admin_engine = create_engine(ADMIN_DB_URL, isolation_level="AUTOCOMMIT")
    with admin_engine.connect() as conn:
        exists = conn.execute(text(f"SELECT 1 FROM pg_database WHERE datname='{TARGET_DB_NAME}'")).fetchone()
        if not exists:
            print(f"🚀 '{TARGET_DB_NAME}' 데이터베이스를 새로 생성합니다...")
            conn.execute(text(f"CREATE DATABASE {TARGET_DB_NAME}"))
        else:
            print(f"✅ '{TARGET_DB_NAME}' 데이터베이스가 이미 존재합니다. 맛매치 데이터와 분리되어 있습니다.")

    # 단계 2: 전용 DB에 pgvector 및 테이블 생성
    target_engine = create_engine(TARGET_DB_URL)
    sql_file_path = os.path.join(os.path.dirname(__file__), "SQL.sql")
    
    with open(sql_file_path, "r", encoding="utf-8") as f:
        sql_commands = f.read()

    with target_engine.connect() as conn:
        print(f"🛠 '{TARGET_DB_NAME}' 내부에 테이블 및 벡터 확장을 설정합니다...")
        try:
            # SQL.sql 실행 (pgvector 설치 및 테이블 생성)
            # 명령어를 개별적으로 실행하기 위해 분리
            for command in sql_commands.split(';'):
                if command.strip():
                    conn.execute(text(command))
            conn.commit()
            print("✨ 모든 설정이 완료되었습니다! (맛매치 데이터 영향 없음)")
        except Exception as e:
            conn.rollback()
            print(f"❌ 설정 중 오류 발생: {e}")

if __name__ == "__main__":
    init_database()
