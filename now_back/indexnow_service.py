"""IndexNow — 새 페이지가 생기는 즉시 Bing 등 참여 검색엔진에 알려 색인을 앞당긴다
(2026-09-11, fire-your-seo-agency 스킬 권고). 사이트맵/크롤링은 발견까지 시간이 걸리는데,
IndexNow는 "이 URL이 새로 생겼다"고 직접 핑을 보내는 방식이라 훨씬 빠르다.
키 파일은 now_front가 /{key}.txt로 서빙(키 소유 증명용, 도메인에 실제로 떠 있어야 함) —
now_front/src/app/{key}.txt/route.ts 참고. 실패해도 조용히 무시(색인 자체엔 지장 없음,
사이트맵이 항상 백업 경로로 남아있음)."""
import logging

import requests

logger = logging.getLogger(__name__)

INDEXNOW_KEY = "30172562437cbd08e7de30f934ce7bcd"
INDEXNOW_HOST = "now.nemoneai.com"


def ping_indexnow(urls: list) -> None:
    if not urls:
        return
    try:
        requests.post(
            "https://api.indexnow.org/indexnow",
            json={
                "host": INDEXNOW_HOST,
                "key": INDEXNOW_KEY,
                "keyLocation": f"https://{INDEXNOW_HOST}/{INDEXNOW_KEY}.txt",
                "urlList": urls,
            },
            timeout=5,
        )
        logger.info("[indexnow] %d개 URL 핑 전송", len(urls))
    except Exception as e:
        logger.warning("[indexnow] 핑 실패(무시): %s", e)
