"use client";

import { ReactNode, useEffect, useRef, useState } from 'react';
import { HomeRegion } from '@/components/home/homeUtils';
import { BOTTOM_NAV_H } from './frame';
import PopupCard from './PopupCard';
import CongestionCard from './CongestionCard';
import AdSquareCard from './AdSquareCard';
import CourseCtaCard from './CourseCtaCard';
import RankingCard from './RankingCard';
import HotplCard from './HotplCard';
import ThemeChipsCard from './ThemeChipsCard';

// PC 사이드카드가 붙는 페이지들의 '공통 규격'을 이 파일 하나로 모았다(2026-09-08 정리).
// 이전에는 ThreeColumnShell(레이아웃) + SideCardSlots(카드 묶음)로 나뉘어 있었는데, 셸의
// left/right props에 항상 같은 카드 묶음만 넘기고 topOffset/bottomOffset 계산까지 매 호출부에서
// 똑같이 반복(HomeClient에서만 5번)하고 있었다. 실제로 다르게 쓸 일이 없는 추상화라 하나로 합쳐
// 호출부가 <SideCardLayout headerH={...} lang={...}> 한 줄로 끝나게 했다.

// 프레임 상수는 frame.ts('use client' 없음)에 둔다 — 서버 컴포넌트가 이 파일에서 직접 import하면
// 문자열이 아니라 클라이언트 참조가 넘어와 조용히 깨진다. 기존 호출부 호환을 위해 여기서 재수출.
export { WIDE_FRAME, WIDE_FRAME_BORDER, BOTTOM_NAV_H } from './frame';

// 카드 영역과 헤더/하단바 사이 여백
const GAP = 16;

// 헤더는 지역 탭 노출 여부에 따라 높이가 바뀌어(AnimatePresence) 하드코딩할 수 없다 — 실측해서
// 카드 시작 위치를 잡는다. 같은 ResizeObserver 코드가 페이지마다 복제돼 있던 걸 훅으로 통일.
export function useElementHeight<T extends HTMLElement = HTMLElement>(fallback: number) {
  const ref = useRef<T>(null);
  const [height, setHeight] = useState(fallback);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => {
      const h = Math.round(el.getBoundingClientRect().height);
      setHeight((prev) => (prev === h ? prev : h));
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return [ref, height] as const;
}

// 기존 중앙 콘텐츠 양옆에 실시간 카드를 붙이는 레이아웃. xl(1280px) 미만에서는 카드를 아예
// 렌더링하지 않아 모바일·태블릿에는 영향이 전혀 없고, children(기존 페이지 JSX)의 마크업도
// 한 줄도 건드리지 않는다.
//
// 카드는 sticky로 "헤더 밑 ~ 하단바 위" 프레임 안에만 머문다 — 단순 sticky top으로는 행 맨 위,
// 즉 헤더보다도 위에서 카드가 시작돼 타이틀바를 뚫고 올라갔었다(2026-09-07). 내용이 넘치면
// 카드 영역 자체가 내부 스크롤된다.
// headerH 기본값 96 — 서버 컴포넌트(랭킹/코스 상세 등)는 훅을 못 써서 useElementHeight로
// 실측할 수 없다. 그런 페이지들은 헤더 높이가 고정(로고/타이틀 한 줄)이라 실측이 필요 없어
// 기본값을 그대로 쓰고, 헤더 높이가 동적으로 변하는 클라이언트 페이지만 실측값을 넘긴다.
export default function SideCardLayout({
  headerH = 96,
  bottomH = BOTTOM_NAV_H,
  lang = 'ko',
  children,
  onSeeAllPopup,
  onSeeAllCongestion,
  onSeeAllRanking,
}: {
  headerH?: number;
  bottomH?: number;
  lang?: string;
  children: ReactNode;
  /** HomeClient(같은 '/') 안에서 쓸 때만 넘긴다 — 안 넘기면 카드는 기존처럼 /?tab=...
   * Link로 폴백한다(다른 라우트에서 SideCardLayout을 쓰는 페이지들, 예: /posts/[id], /course). */
  onSeeAllPopup?: () => void;
  onSeeAllCongestion?: (region: string) => void;
  onSeeAllRanking?: (region: Exclude<HomeRegion, '전체'>) => void;
}) {
  const asideStyle = {
    top: headerH + GAP,
    maxHeight: `calc(100vh - ${headerH + bottomH + GAP * 2}px)`,
  };
  const asideClass =
    'hidden xl:flex xl:flex-col gap-5 w-[280px] flex-shrink-0 sticky overflow-y-auto no-scrollbar';

  return (
    <div className="xl:flex xl:justify-center xl:items-start xl:gap-6 xl:px-6">
      <aside className={asideClass} style={asideStyle}>
        <PopupCard lang={lang} onSeeAll={onSeeAllPopup} />
        <CongestionCard lang={lang} onNavigateToMap={onSeeAllCongestion} />
        <HotplCard lang={lang} />
        <CourseCtaCard lang={lang} />
      </aside>

      {/* 중앙은 xl에서도 정확히 모바일 프레임 폭(max-w-md = 28rem)을 유지 — 예전엔 w-auto라
          페이지마다 남는 폭만큼 제각각으로 늘어나 홈 탭과 미묘하게 어긋났다(2026-09-08). */}
      <div className="w-full xl:w-[28rem] xl:flex-shrink-0">{children}</div>

      <aside className={asideClass} style={asideStyle}>
        <RankingCard lang={lang} onSeeAll={onSeeAllRanking} />
        <AdSquareCard />
        <ThemeChipsCard lang={lang} />
      </aside>
    </div>
  );
}
