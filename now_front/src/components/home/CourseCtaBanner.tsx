"use client";

import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';

const dict = {
  ko: { title: '당신의 3시간을\n만들어보세요', desc: 'AI가 취향과 지역에 맞춰 팝업·맛집·카페 코스를 짜드려요', cta: 'AI 코스 만들기' },
  en: { title: 'Design your\nnext 3 hours', desc: 'AI builds a pop-up, food & café course tailored to you', cta: 'Create AI Course' },
  zh: { title: '打造属于你的\n3小时', desc: 'AI根据喜好和地区为你安排快闪店·美食·咖啡路线', cta: '创建AI路线' },
  ja: { title: 'あなたの3時間を\nデザインする', desc: 'AIが好みとエリアに合わせてコースを作成', cta: 'AIコースを作る' },
};

export default function CourseCtaBanner({ lang }: { lang: string }) {
  const t = dict[lang as keyof typeof dict] || dict.ko;

  return (
    <section className="px-6 md:px-10 max-w-6xl md:mx-auto py-8 md:py-12">
      {/* course 탭의 'AI코스' 버튼·하단 네비 '코스' 버튼과 동일하게 /course로 직접 이동 —
          HomeClient의 courseSub 상태엔 'ai' 렌더 분기가 없어(항상 /course로 리다이렉트하는 구조)
          ?tab=course&sub=ai로 보내면 빈 화면만 뜬다(2026-09-06 구현 중 확인). */}
      <Link
        href={`/course?lang=${lang}`}
        className="group relative flex flex-col md:flex-row items-center gap-6 overflow-hidden rounded-3xl bg-zinc-900 px-6 py-8 md:px-12 md:py-10"
      >
        <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-pace-500/20 blur-2xl" />
        <div className="absolute -right-16 bottom-0 w-56 h-56 rounded-full bg-pace-400/10 blur-3xl" />

        <div className="relative z-10 flex-1 text-center md:text-left">
          <div className="inline-flex items-center gap-1.5 text-pace-300 text-[11px] font-black uppercase tracking-widest mb-2">
            <Sparkles size={13} /> AI Course
          </div>
          <h3 className="text-white text-xl md:text-3xl font-black leading-tight whitespace-pre-line">{t.title}</h3>
          <p className="text-zinc-400 text-sm md:text-base font-medium mt-2">{t.desc}</p>
        </div>

        <div className="relative z-10 shrink-0 flex items-center gap-2 bg-white text-zinc-900 font-black text-sm px-6 py-3 rounded-full group-hover:bg-pace-500 group-hover:text-white transition-colors">
          {t.cta} <ArrowRight size={16} />
        </div>
      </Link>
    </section>
  );
}
