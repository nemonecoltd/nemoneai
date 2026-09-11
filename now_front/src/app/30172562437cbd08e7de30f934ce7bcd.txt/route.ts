// IndexNow 키 소유 증명 파일(2026-09-11) — now_back/indexnow_service.py가 이 키로 핑을
// 보내고, Bing 등이 https://now.nemoneai.com/{key}.txt에서 같은 값을 확인해 소유를 검증한다.
// 키 값을 바꾸면 이 파일명과 now_back의 INDEXNOW_KEY를 반드시 같이 바꿀 것.
export async function GET() {
  return new Response("30172562437cbd08e7de30f934ce7bcd", {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  })
}
