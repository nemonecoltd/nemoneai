import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()

DB_URL = f"postgresql://postgres:Looa2002!!@34.64.236.78:5432/nemone_now"

def upgrade_user_table():
    engine = create_engine(DB_URL)
    with engine.connect() as conn:
        print("🛠 users 테이블에 관리자 권한(is_admin) 컬럼을 추가합니다...")
        try:
            # 1. is_admin 컬럼 추가
            conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE"))
            
            # 2. 대표님 계정을 관리자로 강제 승격
            conn.execute(text("""
                UPDATE users SET is_admin = TRUE WHERE email = 'nemonecoltd@gmail.com'
            """))
            
            conn.commit()
            print("✅ 관리자 권한 설정 완료!")
        except Exception as e:
            conn.rollback()
            print(f"❌ 수정 실패: {e}")

if __name__ == "__main__":
    upgrade_user_table()
