from gemini_service import get_embedding
from database import engine
from sqlalchemy import text
import numpy as np

def test_embedding_and_storage():
    test_text = "성수동 팝업스토어"
    print(f"🔍 '{test_text}' 문장을 벡터로 변환 시도 중...")
    
    try:
        # 1. Gemini API 호출하여 벡터(embedding) 획득
        embedding = get_embedding(test_text)
        
        # 결과 확인 (768차원인지 체크)
        print(f"✅ 벡터 변환 성공! (차원: {len(embedding)})")
        print(f"📊 벡터 샘플 (처음 5개): {embedding[:5]}")

        # 2. DB 저장 테스트
        print("💾 DB에 저장 시도 중...")
        insert_query = text("""
            INSERT INTO seongsu_places (title, content, embedding)
            VALUES (:title, :content, :embedding)
        """)
        
        with engine.connect() as conn:
            conn.execute(insert_query, {
                "title": "테스트 장소",
                "content": test_text,
                "embedding": str(embedding) # pgvector는 문자열 형식의 리스트를 수용함
            })
            conn.commit()
            print("✨ DB 저장 완료!")

        # 3. 저장된 데이터 확인
        with engine.connect() as conn:
            result = conn.execute(text("SELECT title, content FROM seongsu_places WHERE title='테스트 장소'"))
            row = result.fetchone()
            if row:
                print(f"📦 DB 검증 성공: {row[0]} - {row[1]}")

    except Exception as e:
        print(f"❌ 테스트 실패: {e}")

if __name__ == "__main__":
    test_embedding_and_storage()
