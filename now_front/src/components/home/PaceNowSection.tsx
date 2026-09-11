"use client";

import PopupCard from '@/components/sidecards/PopupCard';
import RisingCard from '@/components/sidecards/RisingCard';
import HotplCard from '@/components/sidecards/HotplCard';

const dict = {
  ko: { title: '📍 PACE NOW', desc: '지금, 도시에서 일어나고 있는 것' },
  en: { title: '📍 PACE NOW', desc: "What's happening in the city right now" },
  zh: { title: '📍 PACE NOW', desc: '现在,城市里正在发生的事' },
  ja: { title: '📍 PACE NOW', desc: '今、街で起きていること' },
};

// 홈 메인의 '✨ 이번 주 HOT PLACE'(매거진 이미지 타일 나열)를 대체(2026-09-09) — 시안(pacenow.png)이
// 제안한 PACE NOW 4카드(NEW POP-UP/CITY PULSE/RISING/PACE PICK) 중 CITY PULSE는 헤더의
// CrowdTicker와 겹쳐 빼고, 3카드(뉴팝업/라이징/페이스픽)로 구성. 셋 다 사이드레일(sidecards/)의
// 자기 완결형 카드를 그대로 재사용 — 폭 고정 클래스가 없어 3열 그리드에서도 그대로 동작한다.
export default function PaceNowSection({ lang }: { lang: string }) {
  const t = dict[lang as keyof typeof dict] || dict.ko;

  return (
    <section className="px-6 md:px-10 max-w-6xl md:mx-auto py-8 md:py-10 bg-zinc-50/60">
      <div className="flex items-baseline gap-2 mb-4">
        <h3 className="text-lg md:text-xl font-black text-zinc-900 flex-shrink-0">{t.title}</h3>
        <p className="text-xs md:text-sm text-zinc-400 font-medium truncate">{t.desc}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <PopupCard lang={lang} />
        <RisingCard lang={lang} />
        <HotplCard lang={lang} />
      </div>
    </section>
  );
}
