"use client";

import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';

const dict = {
  ko: { cta: 'AI 코스 만들기' },
  en: { cta: 'Create AI Course' },
  zh: { cta: '创建AI路线' },
  ja: { cta: 'AIコースを作る' },
};

// 홈의 'AI COURSE' 가로 배너(CourseCtaBanner.tsx)를 사이드레일용 세로 카드로 재구성(2026-09-10) —
// 왼쪽 줄이 오른쪽 줄보다 카드 1개 적어(2장 vs 3장) 높이가 안 맞는다는 피드백으로 왼쪽 3번째
// 카드로 추가. 다른 카드들과 달리 정보 열람용이 아니라 행동 유도(CTA)라 흰 배경 카드 시스템을
// 그대로 따르지 않고 원본 배너의 짙은 배경+글로우를 유지 — 사이드레일 안에서도 "눌러야 할 것"으로
// 눈에 띄게 한다.
// 정사각형 배너 광고를 넣을 공간을 확보하려고 제목/설명 문단을 없애고 한 줄 CTA로 축소(2026-09-10,
// 기존 대비 약 1/3 높이).
export default function CourseCtaCard({ lang = 'ko' }: { lang?: string }) {
  const t = dict[lang as keyof typeof dict] || dict.ko;

  // shrink-0 필수: 부모 aside가 column flex + overflow-y-auto + 고정 maxHeight라, 다른 카드들
  // (overflow 기본값 visible → 자동 min-height가 콘텐츠 크기로 잡힘)과 달리 이 카드는 글로우
  // 효과 때문에 overflow-hidden을 쓴다 — overflow가 visible이 아니면 flex의 자동 min-height가
  // 0이 돼버려, 컨테이너가 넘칠 때 이 카드만 74px로 짜부라지는 버그가 있었다(2026-09-10 발견).
  return (
    <Link
      href={`/course?lang=${lang}`}
      className="group relative flex items-center justify-between gap-2 overflow-hidden rounded-2xl bg-zinc-900 px-4 py-3 shrink-0"
    >
      <div className="absolute -right-6 -top-6 w-16 h-16 rounded-full bg-pace-500/20 blur-2xl" />
      <span className="relative z-10 flex items-center gap-1.5 text-white text-xs font-black">
        <Sparkles size={13} className="text-pace-300 flex-shrink-0" /> {t.cta}
      </span>
      <ArrowRight size={14} className="relative z-10 text-white flex-shrink-0 group-hover:translate-x-0.5 transition-transform" />
    </Link>
  );
}
