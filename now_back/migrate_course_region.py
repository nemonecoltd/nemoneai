from database import engine
from sqlalchemy import text

def migrate_course_region():
    print("🚀 [지금여기] 코스 지역 데이터 마이그레이션 시작...")
    with engine.connect() as conn:
        try:
            # 1. 컬럼 추가
            conn.execute(text("ALTER TABLE saved_courses ADD COLUMN IF NOT EXISTS region VARCHAR(50) DEFAULT '성수'"))
            conn.commit()
            print("✅ 'region' 컬럼 추가 성공")
            
            # 2. 기존 코스 중 홍대 키워드가 포함된 경우 홍대로 업데이트 (지능형 업데이트)
            conn.execute(text("UPDATE saved_courses SET region = '홍대' WHERE title LIKE '%홍대%' OR description LIKE '%홍대%'"))
            conn.commit()
            print("✅ 기존 데이터 지역성 보정 완료 (홍대 매칭)")
            
        except Exception as e:
            conn.rollback()
            print(f"❌ 마이그레이션 실패: {e}")

if __name__ == "__main__":
    migrate_course_region()
