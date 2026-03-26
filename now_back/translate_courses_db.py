from database import engine
from sqlalchemy import text
from gemini_service import model
import json

def translate_courses():
    print("🚀 [지금여기] 기존 코스 데이터 영문 자동 번역 마이그레이션 시작...")
    
    with engine.connect() as conn:
        # 1. 컬럼 추가 (만약 없다면)
        conn.execute(text("ALTER TABLE saved_courses ADD COLUMN IF NOT EXISTS title_en VARCHAR(255)"))
        conn.execute(text("ALTER TABLE saved_courses ADD COLUMN IF NOT EXISTS description_en TEXT"))
        conn.commit()
        
        # 2. 번역 대상 추출
        courses = conn.execute(text("SELECT id, title, description FROM saved_courses WHERE title_en IS NULL OR title_en = ''")).fetchall()
        print(f"📦 번역 대상 코스: 총 {len(courses)}건")
        
        for c in courses:
            course_id, title, description = c
            print(f"🔄 번역 중: [{course_id}] {title}")
            
            prompt = f"""
            Translate this Seoul travel course title and description into natural English.
            Ensure it sounds like a professional local guide.
            Output ONLY valid JSON:
            {{
                "title_en": "English Title",
                "description_en": "English Description"
            }}
            
            Korean Data:
            Title: {title}
            Description: {description}
            """
            
            try:
                response = model.generate_content(prompt)
                clean_json = response.text.replace("```json", "").replace("```", "").strip()
                translated = json.loads(clean_json)
                
                conn.execute(
                    text("UPDATE saved_courses SET title_en = :title_en, description_en = :description_en WHERE id = :id"),
                    {
                        "title_en": translated["title_en"],
                        "description_en": translated["description_en"],
                        "id": course_id
                    }
                )
                conn.commit()
                print(f"  ✅ 완료: {translated['title_en']}")
                
            except Exception as e:
                conn.rollback()
                print(f"  ❌ 에러 발생 (ID {course_id}): {e}")

    print("✨ 전체 코스 번역 마이그레이션 완료!")

if __name__ == "__main__":
    translate_courses()
