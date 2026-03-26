import os
from database import engine
from sqlalchemy import text
from gemini_service import model
import json

def translate_places():
    print("🚀 [지금여기] 기존 데이터 영문 자동 번역 마이그레이션 시작...")
    
    with engine.connect() as conn:
        # 번역이 안 된(NULL이거나 비어있는) 데이터만 추출
        places = conn.execute(text("SELECT id, title, content FROM seongsu_places WHERE title_en IS NULL OR title_en = ''")).fetchall()
        print(f"📦 번역 대상: 총 {len(places)}건")
        
        for p in places:
            place_id, title, content = p
            print(f"🔄 번역 중: [{place_id}] {title}")
            
            prompt = f"""
            Translate the following Korean pop-up/hotplace information into natural English.
            Ensure the title is catchy and the content is descriptive.
            Output ONLY valid JSON like this:
            {{
                "title_en": "English Title",
                "content_en": "English Content"
            }}
            
            Korean Data:
            Title: {title}
            Content: {content}
            """
            
            try:
                # Gemini 1.5-flash 모델 호출
                response = model.generate_content(prompt)
                clean_json = response.text.replace("```json", "").replace("```", "").strip()
                translated = json.loads(clean_json)
                
                # DB 업데이트
                conn.execute(
                    text("UPDATE seongsu_places SET title_en = :title_en, content_en = :content_en WHERE id = :id"),
                    {
                        "title_en": translated["title_en"],
                        "content_en": translated["content_en"],
                        "id": place_id
                    }
                )
                conn.commit()
                print(f"  ✅ 완료: {translated['title_en']}")
                
            except Exception as e:
                conn.rollback()
                print(f"  ❌ 에러 발생 (ID {place_id}): {e}")

    print("✨ 전체 번역 마이그레이션 완료!")

if __name__ == "__main__":
    translate_places()
