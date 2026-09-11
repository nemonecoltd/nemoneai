"use client";

import { Eye } from 'lucide-react';
import Link from 'next/link';
import { HomeRegion, placeHref, placeTitle, regionLabel, REGION_DOT_CLASS, placeMoodTag, placeCategoryTag } from './homeUtils';

const dict = {
  ko: { title: '🔥 지금 뜨는 곳', desc: '48시간 기준 실시간 랭킹', seeAll: '전체보기', empty: '아직 데이터가 충분하지 않아요.', views: '조회' },
  en: { title: '🔥 Trending Now', desc: 'Live ranking, last 48 hours', seeAll: 'See all', empty: 'Not enough data yet.', views: 'views' },
  zh: { title: '🔥 现在最火', desc: '48小时实时排行', seeAll: '查看全部', empty: '数据还不够。', views: '浏览' },
  ja: { title: '🔥 今人気', desc: '48時間基準リアルタイムランキング', seeAll: 'すべて見る', empty: 'まだデータが足りません。', views: '閲覧' },
};

export default function HotNowSection({
  lang,
  places,
  region,
  onSeeAll,
}: {
  lang: string;
  places: any[];
  region: HomeRegion;
  onSeeAll: () => void;
}) {
  const t = dict[lang as keyof typeof dict] || dict.ko;
  const filtered = (region === '전체' ? places : places.filter((p) => p.region === region)).slice(0, 5);
  const [first, ...rest] = filtered;

  if (!first) {
    return (
      <section className="px-6 md:px-10 max-w-6xl md:mx-auto py-10">
        <h3 className="text-lg md:text-xl font-black text-zinc-900 mb-1">{t.title}</h3>
        <p className="text-center text-sm text-zinc-400 py-10">{t.empty}</p>
      </section>
    );
  }

  // 썸네일 좌상단 배지 — 순위/지역/태그(분위기)/카테고리(패션·뷰티·캐릭터·애니웹툰·종합)를
  // 한 줄에(공간 부족하면 줄바꿈). 태그·카테고리 둘 다 값 없는 장소가 있을 수 있어 있을 때만
  // 표시(2026-09-07 요청: "없는건 빼고" — 처음엔 카테고리를 팝업/쇼핑 같은 구조적 분류로 잘못
  // 썼다가, "카테고리는 패션/캐릭터 같은 것"이라는 피드백으로 category_tag 기준으로 정정).
  const Badges = ({ rank, place }: { rank: number; place: any }) => {
    const moodTag = placeMoodTag(place);
    const categoryTag = placeCategoryTag(place);
    return (
      <div className="absolute top-2 left-2 right-2 flex flex-wrap items-center gap-1">
        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-zinc-900/90 text-white text-[10px] font-black shrink-0">
          {rank}
        </span>
        <span className="flex items-center gap-1 bg-white/90 backdrop-blur px-2 py-0.5 rounded-full shrink-0">
          <span className={`w-1.5 h-1.5 rounded-full ${REGION_DOT_CLASS[place.region as keyof typeof REGION_DOT_CLASS] || 'bg-emerald-500'}`} />
          <span className="text-[10px] font-black text-zinc-800">{regionLabel(place.region, lang)}</span>
        </span>
        {moodTag && (
          <span className="bg-white/90 backdrop-blur px-2 py-0.5 rounded-full text-[9px] font-bold text-zinc-600 shrink-0">
            {moodTag}
          </span>
        )}
        {categoryTag && (
          <span className="bg-white/90 backdrop-blur px-2 py-0.5 rounded-full text-[9px] font-bold text-zinc-600 shrink-0">
            {categoryTag}
          </span>
        )}
      </div>
    );
  };

  return (
    <section className="px-6 md:px-10 max-w-6xl md:mx-auto py-8 md:py-10">
      <div className="flex items-baseline justify-between gap-2">
        <div className="flex items-baseline gap-2 min-w-0">
          <h3 className="text-lg md:text-xl font-black text-zinc-900 flex-shrink-0">{t.title}</h3>
          <p className="text-xs md:text-sm text-zinc-400 font-medium truncate">{t.desc}</p>
        </div>
        {/* '전체보기'는 SEO용 정적 허브(/ranking/place)가 아니라 앱 안의 '랭킹' 메뉴(activeTab='rec')로
            보내야 함(2026-09-10). <Link href="/?tab=rec&...">였을 땐 pathname이 그대로 '/'라 페이지가
            다시 마운트되지 않고, URL 파싱 useEffect는 최초 마운트 때 한 번만 돌아서 눌러도 화면이
            안 바뀌었음(클릭은 되는데 이동을 못 함) — 상태를 직접 바꾸는 콜백(onSeeAll)으로 교체. */}
        <button
          onClick={onSeeAll}
          className="text-xs md:text-sm font-bold text-zinc-400 hover:text-pace-600 whitespace-nowrap flex-shrink-0 transition-colors"
        >
          {t.seeAll} →
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <Link href={placeHref(first, lang)} className="group relative rounded-2xl overflow-hidden aspect-[4/3] md:aspect-auto md:h-full min-h-[220px] bg-zinc-100 block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={first.image_url || '/nemone_banner2.jpg'}
            alt={placeTitle(first, lang)}
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
          <Badges rank={1} place={first} />
          <div className="absolute bottom-4 left-4 right-4">
            <h4 className="text-white text-lg md:text-2xl font-black leading-snug line-clamp-2">{placeTitle(first, lang)}</h4>
            {typeof first.view_count === 'number' && (
              <div className="flex items-center gap-1 text-white/80 text-xs font-bold mt-1.5">
                <Eye size={13} /> {first.view_count.toLocaleString()} {t.views}
              </div>
            )}
          </div>
        </Link>

        <div className="grid grid-cols-2 gap-3 md:gap-4">
          {rest.slice(0, 4).map((p, idx) => (
            <Link key={p.id} href={placeHref(p, lang)} className="group relative rounded-xl overflow-hidden aspect-square bg-zinc-100 block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={p.image_url || '/nemone_banner2.jpg'}
                alt={placeTitle(p, lang)}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
              <Badges rank={idx + 2} place={p} />
              <div className="absolute bottom-2 left-2 right-2">
                <p className="text-white text-[11px] font-bold leading-tight line-clamp-2">{placeTitle(p, lang)}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
