"""기존 팝업 장소에 카테고리 태그 일괄 생성 (2026-09-04).

무드 태그(backfill_mood_tags.py)가 이미 처리한 492건은 content가 실제 근거(블로그 후기)를
반영해 다시 쓰여 있으므로, 이번엔 이미지 다운로드도 블로그 후기 재조회도 없이 제목+content
텍스트만으로 분류한다 — 건당 입력이 짧고 출력은 카테고리 한 단어뿐이라 무드 태그 백필보다
훨씬 저렴하다.

대상: mood_tags IS NOT NULL(무드 백필을 이미 거친 곳) AND category_tag IS NULL.

사용법:
  python backfill_category_tags.py [건수]   # 생략 시 전체
"""
import os
import sys
import time
from typing import Optional

from dotenv import load_dotenv
from sqlalchemy import text

from database import engine
from category_tags import prompt_block, validate_category_tag

load_dotenv()

TARGET_SQL = """
    SELECT id, title, content
    FROM seongsu_places
    WHERE mood_tags IS NOT NULL
      AND category_tag IS NULL
    ORDER BY id
"""


def generate_category_tag(row) -> str:
    from google import genai
    from google.genai import types

    client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

    prompt = (
        f"다음 팝업스토어를 분류해줘.\n"
        f"장소명: {row.title}\n"
        f"소개: {(row.content or '')[:400]}"
        f"{prompt_block()}\n\n"
        f'다음 JSON 형식으로만 응답: {{"category_tag": "카테고리"}}'
    )

    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=[prompt],
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            thinking_config=types.ThinkingConfig(thinking_budget=0),
        ),
    )
    raw = (response.text or "").strip().replace("```json", "").replace("```", "").strip()
    import json
    return validate_category_tag(json.loads(raw).get("category_tag"))


def run(limit: Optional[int]) -> None:
    with engine.connect() as conn:
        rows = conn.execute(text(TARGET_SQL)).fetchall()

    if limit:
        rows = rows[:limit]
    print(f"대상: {len(rows)}건\n")

    done = 0
    failed = 0
    for row in rows:
        try:
            tag = generate_category_tag(row)
        except Exception as e:
            print(f"  [{row.id}] {row.title} — ❌ {e}")
            failed += 1
            time.sleep(0.5)
            continue

        with engine.connect() as conn:
            conn.execute(
                text("UPDATE seongsu_places SET category_tag = :tag WHERE id = :id"),
                {"tag": tag, "id": row.id},
            )
            conn.commit()

        done += 1
        print(f"  [{row.id}] {row.title} — {tag}")
        time.sleep(0.3)

    print(f"\n완료: {done}건, 실패 {failed}건")


if __name__ == "__main__":
    run(int(sys.argv[1]) if len(sys.argv) > 1 else None)
