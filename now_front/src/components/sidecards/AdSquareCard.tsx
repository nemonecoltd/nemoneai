"use client";

import AdBanner from '@/components/AdBanner';

// PC 좌측 카드라인 전용 정사각형 배너(2026-09-10) — CITY PULSE(CongestionCard)에서 서브타이틀/
// 하단 안내문구를 지워 확보한 공간에 CourseCtaCard 위로 삽입. 슬롯은 이 자리 전용으로 새로 발급
// 받은 것(pace_pc_card_banner, slot 1646381826) — 다른 카드가 쓰는 슬롯과 겹치지 않게 구분.
export default function AdSquareCard() {
  return (
    <div className="bg-white border border-zinc-200/70 rounded-2xl p-3 shrink-0">
      <p className="text-[9px] font-black text-zinc-300 uppercase tracking-widest mb-2">Sponsored</p>
      {/* auto+반응형 포맷은 구글이 실제 노출 시점에 세로로 긴 스카이스크래퍼를 고를 수도 있어
          (정사각형을 강제하는 옵션이 아님, 애드센스에서 확인 필요) — 사이드레일이 그것 때문에
          한없이 늘어나 아래 카드(AI코스)를 밀어내는 사고를 막기 위해 높이를 캡핑. */}
      <div className="max-h-[300px] overflow-hidden">
        <AdBanner dataAdSlot="1646381826" />
      </div>
    </div>
  );
}
