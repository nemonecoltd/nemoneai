from database import engine
from sqlalchemy import text

def check_course_schema():
    print("🔎 [지금여기] 코스 데이터 스키마 점검...")
    with engine.connect() as conn:
        # 1. 컬럼 목록 확인
        cols = conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name = 'saved_courses'")).fetchall()
        col_names = [c[0] for c in cols]
        print(f"📦 현재 saved_courses 컬럼: {col_names}")
        
        # 2. 데이터 샘플 확인 (region 값이 있는지)
        if 'region' in col_names:
            sample = conn.execute(text("SELECT region, COUNT(*) FROM saved_courses GROUP BY region")).fetchall()
            print(f"📊 코스별 지역 데이터 분포: {sample}")
        else:
            print("❌ 'region' 컬럼이 누락되었습니다! (코스 랭킹 뱃지가 안 뜨는 결정적 원인)")

if __name__ == "__main__":
    check_course_schema()
