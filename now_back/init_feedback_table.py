from database import engine
from sqlalchemy import text

def init_feedback_table():
    print("🚀 [지금여기] 피드백 게시판 테이블 생성 중...")
    with engine.connect() as conn:
        try:
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS feedbacks (
                    id SERIAL PRIMARY KEY,
                    user_email VARCHAR(255) NOT NULL,
                    user_name VARCHAR(255),
                    content TEXT NOT NULL,
                    admin_reply TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """))
            conn.commit()
            print("✅ 'feedbacks' 테이블 생성 완료!")
        except Exception as e:
            conn.rollback()
            print(f"❌ 테이블 생성 실패: {e}")

if __name__ == "__main__":
    init_feedback_table()
