import os
import psycopg2
from dotenv import load_dotenv

# .env 파일 로드
load_dotenv()

# DB 연결 정보 (환경 변수 또는 직접 입력)
DB_CONFIG = {
    "host": os.getenv("DB_HOST", "34.64.236.78"),
    "database": os.getenv("DB_NAME", "postgres"),
    "user": os.getenv("DB_USER", "postgres"),
    "password": os.getenv("DB_PASS", "Looa2002!!"),
    "port": os.getenv("DB_PORT", "5432")
}

def migrate():
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor()

        print("--- 마이그레이션 시작 ---")

        # 1. region 컬럼 추가 및 기본값 설정
        print("1. 'region' 컬럼 추가 중...")
        cur.execute("""
            ALTER TABLE seongsu_places 
            ADD COLUMN IF NOT EXISTS region TEXT DEFAULT '성수';
        """)

        # 2. 기존 데이터 region 업데이트 (혹시 모르니 다시 확인)
        print("2. 기존 데이터 region 업데이트 중...")
        cur.execute("UPDATE seongsu_places SET region = '성수' WHERE region IS NULL;")

        # 3. 랭킹/인기도 시스템을 위한 view_count, like_count 필드 확인 및 추가 (통합 랭킹용)
        # 이미 있을 수도 있지만, 안전하게 체크
        print("3. 통계용 필드 체크 중...")
        cur.execute("ALTER TABLE seongsu_places ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;")
        cur.execute("ALTER TABLE seongsu_places ADD COLUMN IF NOT EXISTS like_count INTEGER DEFAULT 0;")

        conn.commit()
        print("✅ 마이그레이션 완료!")

    except Exception as e:
        print(f"❌ 에러 발생: {e}")
        if conn: conn.rollback()
    finally:
        if cur: cur.close()
        if conn: conn.close()

if __name__ == "__main__":
    migrate()
