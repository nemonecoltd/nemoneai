import type { Metadata } from 'next';
import HomeClient from './HomeClient';

const BACKEND = process.env.BACKEND_URL || 'http://127.0.0.1:8081';

// 홈은 자기참조 canonical만 명시(root layout에서 alternates를 제거해, 이게 없으면 canonical이
// 아예 안 붙음). 홈의 ?lang= 다국어는 root 경로+쿼리라 Next가 hreflang URL에서 쿼리를 정규화로
// 떨궈 신호가 깨지고, 원래 홈(앱 셸)의 다국어 SEO 가치도 약함 — 실제 다국어 색인 무게는 상세페이지
// (posts/[id], hreflang 정상)와 전용 /en·/zh·/ja/ranking 페이지가 담당하므로 홈엔 hreflang 생략.
const BASE_URL = 'https://now.nemoneai.com';

interface Props {
  searchParams: Promise<{ mood?: string; tab?: string; sub?: string }>;
}

// 무드/매거진 쿼리 변형이 전부 홈과 같은 <title>을 써서 네이버 서치어드바이저가 "title 요소에
// 동일한 제목인 웹문서 다수 발견"으로 진단한 문제(2026-09-05, 실제 진단 CSV로 확인) — canonical은
// hreflang 문제 때문에 계속 홈을 가리키게 그대로 두되(변경 안 함), title만이라도 실제 노출되는
// 내용과 맞게 구분해 "완전히 동일한 문서"라는 신호를 줄인다.
export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { mood, tab, sub } = await searchParams;
  if (mood) {
    return { title: `${mood} 분위기 팝업 모음 | NEMONE PACE`, alternates: { canonical: BASE_URL } };
  }
  if (tab === 'magazine' && sub === 'mood') {
    return { title: '무드별 팝업 모음 | NEMONE PACE', alternates: { canonical: BASE_URL } };
  }
  return { alternates: { canonical: BASE_URL } };
}

// 홈의 기본(핫플/종합) 랭킹 데이터를 서버에서 미리 fetch — 예전엔 이 페이지 전체가
// 'use client'라 크롤러가 받는 초기 HTML에 카드/링크가 하나도 없었음(2026-08-10 확인).
// 인터랙션(탭 전환/지역 필터 등)은 그대로 HomeClient(클라이언트 컴포넌트)에 넘기고,
// 여기서는 첫 렌더에 실제 콘텐츠가 보이도록 초기 데이터만 서버에서 채운다.
async function getInitialPlaces() {
  try {
    const res = await fetch(`${BACKEND}/places/popular`, { next: { revalidate: 300 } });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

// 홈 "지역별로 발견하기" — 지역 대표 사진 에셋이 없어 각 지역 인기 1위 장소의 실제 사진을 재사용.
const DISCOVERY_REGIONS = ['성수', '홍대', '강북', '강남', '부산', '제주'] as const;

async function getRegionTopPlaces() {
  const results = await Promise.all(
    DISCOVERY_REGIONS.map(async (region) => {
      try {
        const res = await fetch(`${BACKEND}/places/popular?region=${encodeURIComponent(region)}&limit=1`, {
          next: { revalidate: 300 },
        });
        if (!res.ok) return null;
        const data = await res.json();
        return data?.[0] ? { region, place: data[0] } : null;
      } catch {
        return null;
      }
    })
  );
  return results.filter((r) => r !== null) as { region: string; place: any }[];
}

export default async function HomePage() {
  const [initialAllPlaces, regionTopPlaces] = await Promise.all([
    getInitialPlaces(),
    getRegionTopPlaces(),
  ]);
  return (
    <HomeClient
      initialAllPlaces={initialAllPlaces}
      regionTopPlaces={regionTopPlaces}
    />
  );
}
