"""NOL(world.nol.com) 서울 팝업/이벤트 목록 스크래퍼 — 정기 수집원이 아니라 주 1회
'우리가 놓친 팝업이 있는지' 갭 체크용(collector_nol_compare.py 전용, 2026-09-09).

이 페이지는 클라이언트 렌더링이라(curl로는 빈 셸만 나옴) Playwright로 렌더링 후 DOM에서
카드 링크(/en/content/festas/{uuid})의 innerText를 그대로 파싱한다. 카드 텍스트는 항상
1줄 제목 / 1줄 부제 / 1줄 "동네·기간" (또는 기간만, 또는 'Open') 순서로 고정돼 있고,
그 뒤로 Comments/Likes 줄이 이어진다 — 순서 기반 파싱이라 뒤쪽 줄 개수 변화엔 영향 없음.
"""
import re

from playwright.sync_api import sync_playwright

NOL_URL = "https://world.nol.com/en/regions/seoul/festas"


def scrape_nol_festas() -> list[dict]:
    """반환 항목: title, subtitle, neighborhood(Optional), date_text, has_date_range(bool), url"""
    items: list[dict] = []
    with sync_playwright() as p:
        browser = p.chromium.launch()
        try:
            page = browser.new_page()
            page.goto(NOL_URL, wait_until="networkidle", timeout=30000)
            page.wait_for_timeout(1500)
            cards = page.eval_on_selector_all(
                "a[href^='/en/content/festas/']",
                "els => els.map(e => ({href: e.getAttribute('href'), text: e.innerText}))",
            )
        finally:
            browser.close()

    seen_urls = set()
    for card in cards:
        href = card.get("href") or ""
        if not href or href in seen_urls:
            continue
        seen_urls.add(href)

        lines = [l.strip() for l in (card.get("text") or "").split("\n") if l.strip()]
        if len(lines) < 3:
            continue

        title, subtitle, loc_date = lines[0], lines[1], lines[2]
        if "·" in loc_date:
            neighborhood, date_text = loc_date.split("·", 1)
        else:
            neighborhood, date_text = None, loc_date

        items.append({
            "title": title,
            "subtitle": subtitle,
            "neighborhood": neighborhood,
            "date_text": date_text,
            "has_date_range": bool(re.search(r"\d+\.\d+\s*[–-]\s*\d+\.\d+", date_text)),
            "url": f"https://world.nol.com{href}",
        })

    print(f"✅ [NOL] 서울 팝업/이벤트 {len(items)}개 수집 완료")
    return items


if __name__ == "__main__":
    for it in scrape_nol_festas():
        print(f"  - {it['title']} / {it['neighborhood']} / {it['date_text']}")
