// 홈 신규 섹션(HeroSection 등) 공용 지역 표시 로직 — Recommendation.tsx의 computePlaceMeta와
// 같은 지역 색상 매핑을 그대로 재사용(2026-09-06, 페이스 메인 개편).
export type HomeRegion = '전체' | '성수' | '홍대' | '강북' | '강남' | '부산' | '제주';

export const DISCOVERY_REGIONS: Exclude<HomeRegion, '전체'>[] = ['성수', '홍대', '강북', '강남', '부산', '제주'];

// 홈 '지금 뜨는 곳' 전체보기 등 — 선택된 지역 칩 그대로 /ranking/place/{slug}로 보내기 위한
// 역매핑(src/lib/regionPopularHub.tsx의 SLUG_TO_REGION_KO와 반대 방향, 2026-09-10).
export const REGION_TO_SLUG: Record<Exclude<HomeRegion, '전체'>, string> = {
  '성수': 'seongsu',
  '홍대': 'hongdae',
  '강북': 'gangbuk',
  '강남': 'gangnam',
  '부산': 'busan',
  '제주': 'jeju',
};

export const REGION_DOT_CLASS: Record<Exclude<HomeRegion, '전체'>, string> = {
  '성수': 'bg-emerald-500',
  '홍대': 'bg-orange-500',
  '강북': 'bg-yellow-500',
  '강남': 'bg-pink-500',
  '부산': 'bg-sky-400',
  '제주': 'bg-[#0369a1]',
};

export const REGION_CHIP_ACTIVE: Record<HomeRegion, string> = {
  '전체': 'bg-zinc-900 text-white border-zinc-900',
  '성수': 'bg-emerald-500 text-white border-emerald-500',
  '홍대': 'bg-orange-500 text-white border-orange-500',
  '강북': 'bg-yellow-500 text-white border-yellow-500',
  '강남': 'bg-pink-500 text-white border-pink-500',
  '부산': 'bg-sky-400 text-white border-sky-400',
  '제주': 'bg-[#0369a1] text-white border-[#0369a1]',
};

const REGION_LABEL: Record<string, { en: string; zh: string; ja: string }> = {
  '성수': { en: 'Seongsu', zh: '圣水洞', ja: 'ソンス' },
  '홍대': { en: 'Hongdae', zh: '弘大', ja: 'ホンデ' },
  '강북': { en: 'Gangbuk', zh: '江北', ja: 'カンブク' },
  '강남': { en: 'Gangnam', zh: '江南', ja: 'カンナム' },
  '부산': { en: 'Busan', zh: '釜山', ja: '釜山' },
  '제주': { en: 'Jeju', zh: '济州', ja: '済州' },
};

export function regionLabel(region: string | undefined, lang: string): string {
  if (!region) return '';
  const l = REGION_LABEL[region];
  if (!l) return region;
  return lang === 'en' ? l.en : lang === 'zh' ? l.zh : lang === 'ja' ? l.ja : region;
}

export function placeTitle(place: any, lang: string): string {
  return (lang === 'en' && place.title_en) ? place.title_en
    : (lang === 'zh' && place.title_zh) ? place.title_zh
    : (lang === 'ja' && place.title_ja) ? place.title_ja
    : place.title;
}

// 상세페이지 canonical과 정확히 같은 형태로 링크한다(2026-09-10 SEO 점검) — posts/[id]는
// searchParams에서 lang만 읽고 region은 아예 안 쓴다(지역은 DB의 place.region으로 결정). 그런데도
// 모든 목록/카드가 ?region=...&lang=ko를 붙여 링크해서, 같은 문서에 대한 중복 URL이 대량으로
// 크롤링되고 있었다(구글 "적절한 표준 태그가 포함된 대체 페이지" 다수 발생 원인).
// canonical(postUrl)과 동일하게: 한국어는 쿼리 없음, 나머지 언어만 ?lang= 부착.
export function placeHref(place: any, lang: string): string {
  return lang === 'ko' ? `/posts/${place.id}` : `/posts/${place.id}?lang=${lang}`;
}

// 홈 "지금 뜨는 곳" 썸네일 배지용(2026-09-07) — "태그"(분위기, mood_tags)와 "카테고리"
// (장르 성격: 패션/뷰티/캐릭터/애니웹툰/종합, category_tag)는 서로 다른 고정 어휘라 분리해서
// 노출한다(처음엔 category_tag를 "태그"에 합쳐 넣었는데, "카테고리"는 패션/캐릭터 같은
// category_tag를 뜻하는 거라는 피드백으로 정정). 둘 다 값이 없으면 배지 자체를 생략.
export function placeMoodTag(place: any): string | undefined {
  return place.mood_tags?.[0] || undefined;
}

export function placeCategoryTag(place: any): string | undefined {
  return place.category_tag || undefined;
}
