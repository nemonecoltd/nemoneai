"use client";

const dict = {
  ko: { title: '🎯 이런 곳을 찾고 있다면', desc: '태그로 바로 골라보는 취향별 장소' },
  en: { title: '🎯 Looking for something specific?', desc: 'Jump straight to places that match your mood' },
  zh: { title: '🎯 想找这样的地方吗', desc: '按标签直接挑选符合喜好的场所' },
  ja: { title: '🎯 こんな場所を探しているなら', desc: 'タグからすぐに好みの場所へ' },
};

// mood_tags.MOOD_TAGS / category(전시·shopping·class) 고정 세트 중 데이터 볼륨과 사용자 요청(데이트/가족/혼자)을
// 반영해 고른 8개 — 전부 이미 동작하는 기존 필터(무드=/?mood=, 카테고리=/?tab=list&category=)로 바로 연결된다.
// "가족"은 정확히 일치하는 태그가 없어 기존 '아이랑가기좋은'을 라벨만 바꿔 재사용(2026-09-06).
// PC 사이드카드(ThemeChipsCard.tsx, 2026-09-08)도 같은 칩을 쓰므로 export.
export const CHIPS: { label: Record<string, string>; href: string; emoji: string }[] = [
  { emoji: '💑', label: { ko: '데이트', en: 'Date', zh: '约会', ja: 'デート' }, href: '/?mood=' + encodeURIComponent('데이트하기좋은') },
  { emoji: '🖼️', label: { ko: '전시', en: 'Exhibit', zh: '展览', ja: '展示' }, href: '/?tab=list&category=' + encodeURIComponent('전시') },
  { emoji: '🛍️', label: { ko: '쇼핑', en: 'Shopping', zh: '购物', ja: 'ショッピング' }, href: '/?tab=list&category=shopping' },
  { emoji: '📸', label: { ko: '사진', en: 'Photo Spot', zh: '拍照', ja: '写真' }, href: '/?mood=' + encodeURIComponent('인생샷/포토스팟') },
  { emoji: '🎨', label: { ko: '체험', en: 'Experience', zh: '体验', ja: '体験' }, href: '/?tab=list&category=class' },
  { emoji: '👨‍👩‍👧', label: { ko: '가족', en: 'Family', zh: '家庭', ja: 'ファミリー' }, href: '/?mood=' + encodeURIComponent('아이랑가기좋은') },
  { emoji: '🧘', label: { ko: '혼자', en: 'Solo', zh: '独自', ja: 'ひとり' }, href: '/?mood=' + encodeURIComponent('혼자가기좋은') },
  { emoji: '🌇', label: { ko: '감성', en: 'Mood', zh: '氛围', ja: 'ムード' }, href: '/?mood=' + encodeURIComponent('감성/무드있는') },
];

export default function ThemeChipsSection({ lang }: { lang: string }) {
  const t = dict[lang as keyof typeof dict] || dict.ko;

  return (
    <section className="px-6 md:px-10 max-w-6xl md:mx-auto py-8 md:py-10">
      <div className="flex items-baseline gap-2 mb-4">
        <h3 className="text-lg md:text-xl font-black text-zinc-900 flex-shrink-0">{t.title}</h3>
        <p className="text-xs md:text-sm text-zinc-400 font-medium truncate">{t.desc}</p>
      </div>

      <div className="grid grid-cols-4 md:grid-cols-8 gap-2.5 md:gap-3">
        {CHIPS.map((chip) => (
          // 일반 <a> 태그(Link 아님) — 같은 경로("/") 안에서 쿼리만 바뀌는 이동이라 Next의 클라이언트
          // 소프트내비로는 HomeClient의 마운트 1회성 URL 부트스트랩 effect가 재실행되지 않는다.
          // 풀 리로드로 강제 재마운트시켜야 무드/카테고리 필터가 실제로 걸린다(2026-09-06 프리뷰 확인).
          <a
            key={chip.href}
            href={`${chip.href}&lang=${lang}`}
            className="flex flex-col items-center gap-1.5 py-4 rounded-2xl bg-zinc-50 border border-zinc-100 hover:border-pace-300 hover:bg-pace-50/40 transition-colors"
          >
            <span className="text-2xl md:text-3xl">{chip.emoji}</span>
            <span className="text-[11px] md:text-xs font-bold text-zinc-700">
              {chip.label[lang] || chip.label.ko}
            </span>
          </a>
        ))}
      </div>
    </section>
  );
}
