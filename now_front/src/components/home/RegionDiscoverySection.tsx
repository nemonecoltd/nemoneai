"use client";

import { regionLabel } from './homeUtils';

const dict = {
  ko: { title: '📍 지역별로 발견하기', desc: '지금 가장 붐비는 6개 지역' },
  en: { title: '📍 Explore by Area', desc: 'The 6 busiest areas right now' },
  zh: { title: '📍 按地区探索', desc: '当下最热门的6个地区' },
  ja: { title: '📍 エリアで探す', desc: '今最も賑わう6エリア' },
};

export default function RegionDiscoverySection({
  lang,
  regionTopPlaces,
}: {
  lang: string;
  regionTopPlaces: { region: string; place: any }[];
}) {
  const t = dict[lang as keyof typeof dict] || dict.ko;

  if (regionTopPlaces.length === 0) return null;

  return (
    <section className="px-6 md:px-10 max-w-6xl md:mx-auto py-8 md:py-10">
      <div className="flex items-baseline gap-2 mb-4">
        <h3 className="text-lg md:text-xl font-black text-zinc-900 flex-shrink-0">{t.title}</h3>
        <p className="text-xs md:text-sm text-zinc-400 font-medium truncate">{t.desc}</p>
      </div>

      <div className="grid grid-cols-3 md:grid-cols-6 gap-2.5 md:gap-3">
        {regionTopPlaces.map(({ region, place }) => (
          // 일반 <a> 태그(Link 아님) — 홈(/)은 SPA라 같은 경로("/") 안에서 쿼리만 바뀌면
          // HomeClient의 URL→상태 부트스트랩 effect(마운트 1회성)가 다시 실행되지 않아 지역이
          // 안 바뀐다. 풀 리로드로 강제 재마운트시켜야 실제로 동작(2026-09-06 프리뷰에서 확인).
          <a
            key={region}
            href={`/?tab=list&region=${encodeURIComponent(region)}&lang=${lang}`}
            className="group relative rounded-2xl overflow-hidden aspect-[3/4] bg-zinc-100 block"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={place?.image_url || '/nemone_banner2.jpg'}
              alt={region}
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
            <div className="absolute bottom-2.5 left-2.5 right-2.5">
              <span className="text-white text-xs md:text-sm font-black tracking-tight">{regionLabel(region, lang)}</span>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
