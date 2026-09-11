"use client";

import { useEffect } from 'react';

interface AdUnitProps {
  slotId: string;
  layoutKey?: string;
  format?: string;
}

declare global {
  interface Window {
    adsbygoogle: any[];
  }
}

export default function AdUnit({ slotId, layoutKey = "-f8+65+2h-ct+dn", format = "fluid" }: AdUnitProps) {
  useEffect(() => {
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {
      console.error("AdSense rendering error:", e);
    }
  }, []);

  return (
    <div className="ad-sponsored-card w-full bg-zinc-900/5 rounded-3xl border border-zinc-100 p-4 my-4 overflow-hidden relative">
      <span className="absolute top-2 right-4 text-[8px] font-black text-zinc-300 uppercase tracking-widest">Sponsored</span>

      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-format={format}
        data-ad-layout-key={layoutKey}
        data-ad-client="ca-pub-4274957638983041"
        data-ad-slot={slotId}
      />
    </div>
  );
}

export function InArticleAd() {
  useEffect(() => {
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {
      console.error("AdSense error:", e);
    }
  }, []);

  // fluid(자동 in-article)는 컨테이너 폭에 따라 구글이 높이를 그때그때 정해 어떤 글에서는
  // 꽉 차고 어떤 글에서는 크게 비어 보이는 문제가 있었음(2026-09-03) — 표준 성능이 좋은
  // 300x250(medium rectangle) 고정 크기로 바꿔 크기를 예측 가능하게 만든다.
  return (
    <div className="ad-in-article flex justify-center" style={{ width: '100%' }}>
      <ins
        className="adsbygoogle"
        style={{ display: 'inline-block', width: '300px', height: '250px' }}
        data-ad-client="ca-pub-4274957638983041"
        data-ad-slot="7053776315"
      />
    </div>
  );
}
