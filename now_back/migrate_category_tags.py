"""seongsu_places에 category_tag 컬럼 추가 (2026-09-04).

mood_tags(배열, NULL vs [] 구분)와 달리 category_tag는 단일값 분류라
NULL(=아직 생성 전)만 있으면 된다 — 애매한 경우는 "종합"으로 채워지므로
"생성은 했지만 값 없음"이라는 중간 상태가 존재하지 않는다.
"""
from sqlalchemy import text

from database import engine

ALTER = """
ALTER TABLE seongsu_places
    ADD COLUMN IF NOT EXISTS category_tag TEXT DEFAULT NULL;
"""

# 카테고리 필터(WHERE category_tag = '...') 및 목록 노출용 일반 인덱스
INDEX = """
CREATE INDEX IF NOT EXISTS idx_seongsu_places_category_tag
    ON seongsu_places (category_tag);
"""


def migrate() -> None:
    with engine.begin() as conn:
        conn.execute(text(ALTER))
        conn.execute(text(INDEX))
    print("완료: seongsu_places.category_tag 컬럼 + 인덱스 추가됨")


if __name__ == "__main__":
    migrate()
