"use client";

import { ReactNode } from 'react';
import Link from 'next/link';

// PACE Editorial Side Rail 공통 셸(2026-09-08) — 카드마다 검정/빨강/파랑/초록/보라로 칠한
// 전체 헤더 박스를 쓰고 있어 "브랜드 하나에 여러 사이트가 붙어있는" 느낌이 났다는 피드백으로
// 색 배경 헤더를 없애고 하나의 구조(라벨 → 서브타이틀 → 콘텐츠 → 더보기)로 통일했다.
// 색은 pace 브랜드 블루 하나만 포인트로 쓰고, 카드 배경/테두리는 항상 흰색+옅은 중립색.
export default function SideCardShell({
  label,
  subtitle,
  subtitleInline = false,
  moreHref,
  onMoreClick,
  moreLabel = '전체보기',
  children,
}: {
  label: string;
  subtitle?: string;
  /** true면 subtitle을 라벨 아래 별도 줄이 아니라 라벨 옆에 나란히 표시(2026-09-10, RISING 카드용). */
  subtitleInline?: boolean;
  moreHref?: string;
  /** HomeClient 안(같은 '/')에서 쓸 때 넘긴다 — moreHref(Link)는 쿼리만 바뀌는 같은 경로
   * 이동이라 Next.js가 리마운트를 안 해서 클릭해도 탭이 안 바뀌는 버그가 있었다(2026-09-10,
   * HotNowSection '전체보기'에서 처음 발견). 넘기면 Link 대신 버튼으로 렌더링해 상태를 직접 바꾼다.
   * moreHref는 HomeClient 밖(다른 라우트)에서 이 카드를 쓸 때를 위한 폴백으로 계속 둔다. */
  onMoreClick?: () => void;
  moreLabel?: string;
  children: ReactNode;
}) {
  const hasBelowSubtitle = !!subtitle && !subtitleInline;
  return (
    <div className="bg-white border border-zinc-200/70 rounded-2xl p-5">
      <div className="flex items-baseline justify-between gap-2 mb-1">
        <div className="flex items-baseline gap-2 min-w-0">
          <p className="text-[11px] font-bold tracking-[0.08em] text-pace-700 uppercase flex-shrink-0">{label}</p>
          {subtitleInline && subtitle && <p className="text-[11px] text-zinc-400 truncate">{subtitle}</p>}
        </div>
        {onMoreClick ? (
          <button onClick={onMoreClick} className="text-[11px] font-bold text-zinc-400 hover:text-pace-600 whitespace-nowrap flex-shrink-0 transition-colors">
            {moreLabel} →
          </button>
        ) : moreHref && (
          <Link href={moreHref} className="text-[11px] font-bold text-zinc-400 hover:text-pace-600 whitespace-nowrap flex-shrink-0 transition-colors">
            {moreLabel} →
          </Link>
        )}
      </div>
      {hasBelowSubtitle && <p className="text-[11px] text-zinc-400 mb-3">{subtitle}</p>}
      <div className={hasBelowSubtitle ? '' : 'mt-3'}>{children}</div>
    </div>
  );
}
