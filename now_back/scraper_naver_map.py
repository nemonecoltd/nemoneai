import asyncio
import os
import requests
import json
from playwright.async_api import async_playwright
from dotenv import load_dotenv

load_dotenv()

GOOGLE_API_KEY = os.getenv("GEMINI_API_KEY")

def get_lat_lng(address):
    if not address or len(address) < 5: return None, None
    try:
        url = f"https://maps.googleapis.com/maps/api/geocode/json?address={address}&key={GOOGLE_API_KEY}"
        response = requests.get(url).json()
        if response['status'] == 'OK':
            loc = response['results'][0]['geometry']['location']
            return loc['lat'], loc['lng']
    except Exception as e:
        print(f"⚠️ Geocoding 실패: {e}")
    return None, None

async def scrape_naver_map_popups():
    """페이지의 모든 텍스트를 긁어서 Gemini에게 분석을 맡기는 무적의 방식"""
    results = []
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
        )
        page = await context.new_page()

        # 타겟 URL: 성수동 팝업, 공연, 전시 통합 검색
        search_url = "https://search.naver.com/search.naver?query=성수동+팝업스토어+공연+전시+일정&where=news"
        print(f"🌐 성수동 복합 데이터 발굴 중: {search_url}")
        
        await page.goto(search_url)
        await page.wait_for_timeout(3000)

        # 핵심: 특정 클래스가 아닌 body 전체의 텍스트를 가져옴
        raw_text = await page.inner_text("body")
        
        await browser.close()
        
        if len(raw_text.strip()) < 200:
            print("⚠️ 텍스트 확보 실패")
            return []

        # Gemini 1 Pro를 사용하여 데이터 정제
        import google.generativeai as genai
        genai.configure(api_key=GOOGLE_API_KEY)
        model = genai.GenerativeModel("models/gemini-pro-latest")
        
        prompt = f"""
        아래 지저분한 텍스트 뭉치에서 '성수동' 지역의 [팝업스토어, 공연, 콘서트, 전시회] 정보만 찾아내줘.
        
        필드명: title, title_en, location, content, content_en
        
        [데이터 뭉치]
        {raw_text[:5000]}
        
        *명령:
        1. 행사(팝업/공연/전시)의 정확한 이름(title)을 찾으세요.
        2. title_en에는 행사의 영어 이름을 넣으세요 (없으면 자연스러운 번역).
        3. 주소(location)가 있다면 넣고, 없다면 장소명만 넣으세요.
        4. content에는 행사의 특징과 일정을 한글로 요약하세요.
        5. content_en에는 행사의 특징과 일정을 영어로 요약하세요.
        6. 최대 20개를 JSON 리스트로 응답하세요. 오직 JSON만 응답하세요.
        """
        
        print("🧠 Gemini가 지저분한 텍스트에서 장소 정보를 정제 중입니다...")
        response = model.generate_content(prompt)
        
        try:
            content = response.text
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0]
            elif "```" in content:
                content = content.split("```")[1].split("```")[0]
            
            clean_data = json.loads(content.strip())
            
            for item in clean_data:
                # 주소가 부족할 경우 보정
                addr = item.get('location', '')
                if not addr or "성동구" not in addr:
                    addr = f"서울 성동구 성수동 {item['title']}"

                lat, lng = get_lat_lng(addr)
                results.append({
                    "naver_place_id": f"raw_{hash(item['title']) % 10000}",
                    "title": item['title'],
                    "title_en": item.get('title_en', item['title']),
                    "location": addr,
                    "latitude": lat,
                    "longitude": lng,
                    "content": item['content'],
                    "content_en": item.get('content_en', ""),
                    "video_url": ""
                })
                print(f"✅ 발견: {item['title']}")
                
        except Exception as e:
            print(f"❌ 데이터 정제 실패: {e}")

    return results

if __name__ == "__main__":
    res = asyncio.run(scrape_naver_map_popups())
    print(f"🚀 최종 {len(res)}개 수집 성공")
