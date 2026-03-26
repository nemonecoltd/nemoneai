import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

print("🔍 사용 가능한 모델 리스트를 조회 중입니다...")
try:
    for m in genai.list_models():
        if 'embedContent' in m.supported_generation_methods:
            print(f"✅ 모델명: {m.name}")
            print(f"   - 설명: {m.description}")
except Exception as e:
    print(f"❌ 조회 실패: {e}")
