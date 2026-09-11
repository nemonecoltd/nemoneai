"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin } from 'lucide-react';
import { congestLabel, CONGEST_LEVELS, CONGEST_RING_COLOR } from '@/components/CongestionRing';
import SideCardShell from './SideCardShell';

interface CrowdData {
  area: string;
  congest_lvl: string;
  ppltn_min: number;
  ppltn_max: number;
  age_gender_summary?: {
    male_rate?: string;
    female_rate?: string;
    age_rates?: Record<string, string>;
  };
  ppltn_delta_pct?: number;
}

// CrowdTicker.tsx와 동일 지점(now_back deps.py CROWD_AREA_MAP과 일치) — 표시 방식만 다르다:
// 여긴 세로 탭으로 5개를 늘어놓고 클릭한 지점만 자세히 보여주며, 자동 회전 타이머가 없다
// (2026-09-07 요청: "자동 갱신이 아니라 첫 호출 시 정보로"). 실제로 CrowdTicker도 최초 마운트
// 때 5개를 한 번에 fetch해두고 "어느 걸 보여줄지"만 자동 회전시키는 구조라, 데이터 패칭
// 로직은 그대로 재사용하고 회전 타이머만 뺐다.
const AREAS = ['성수', '홍대', '강남역', '이태원', '광화문'];

const AREA_LABEL: Record<string, Record<string, string>> = {
  '성수': { en: 'Seongsu', zh: '圣水', ja: 'ソンス' },
  '홍대': { en: 'Hongdae', zh: '弘大', ja: 'ホンデ' },
  '강남역': { en: 'Gangnam Stn', zh: '江南站', ja: 'カンナム駅' },
  '이태원': { en: 'Itaewon', zh: '梨泰院', ja: 'イテウォン' },
  '광화문': { en: 'Gwanghwamun', zh: '光化门', ja: 'グァンファムン' },
};

// 카드 클릭 시 지도 탭으로 이동할 지역 — CrowdTicker.tsx AREA_TO_REGION과 동일(2026-09-07 요청).
const AREA_TO_REGION: Record<string, string> = {
  '성수': '성수',
  '홍대': '홍대',
  '강남역': '강남',
  '이태원': '강북',
  '광화문': '강북',
};

// 서브타이틀/하단 안내문구(2026-09-10 삭제) — PC 좌측 카드라인 높이를 아껴 바로 아래
// 정사각형 배너를 넣기 위해 제거. 카드 자체 의미는 title/방문인원/혼잡도만으로 충분히 전달됨.
const dict = {
  ko: { title: 'CITY PULSE', visitors: '현재 예상 방문 인원', congestion: '혼잡도' },
  en: { title: 'CITY PULSE', visitors: 'Estimated visitors now', congestion: 'Congestion' },
  zh: { title: 'CITY PULSE', visitors: '当前预计访客数', congestion: '拥挤度' },
  ja: { title: 'CITY PULSE', visitors: '現在の推定訪問者数', congestion: '混雑度' },
};

function areaLabel(area: string, lang: string): string {
  return AREA_LABEL[area]?.[lang] ?? area;
}

function formatNum(n: number): string {
  return n.toLocaleString('ko-KR');
}

function ppltnUnit(lang: string): string {
  return lang === 'en' ? '' : lang === 'zh' || lang === 'ja' ? '人' : '명';
}

function topAgeGroup(ageGender: CrowdData['age_gender_summary'] | undefined, lang: string): string | null {
  if (!ageGender?.age_rates) return null;
  const entries = Object.entries(ageGender.age_rates)
    .map(([age, rate]) => [age, parseFloat(rate)] as [string, number])
    .filter(([, rate]) => !Number.isNaN(rate));
  if (entries.length === 0) return null;
  const [topAge] = entries.reduce((a, b) => (b[1] > a[1] ? b : a));
  if (lang === 'en') return `${topAge}s`;
  if (lang === 'zh') return `${topAge}多岁`;
  if (lang === 'ja') return `${topAge}代`;
  return `${topAge}대`;
}

function dominantGender(ageGender: CrowdData['age_gender_summary'] | undefined, lang: string): { label: string; className: string } | null {
  const male = parseFloat(ageGender?.male_rate || '');
  const female = parseFloat(ageGender?.female_rate || '');
  if (Number.isNaN(male) || Number.isNaN(female)) return null;
  const evenLabel = lang === 'en' ? 'Even' : lang === 'zh' ? '均衡' : lang === 'ja' ? '同数' : '남녀';
  const maleLabel = lang === 'en' ? 'Male' : lang === 'zh' ? '男性' : lang === 'ja' ? '男性' : '남성';
  const femaleLabel = lang === 'en' ? 'Female' : lang === 'zh' ? '女性' : lang === 'ja' ? '女性' : '여성';
  if (Math.abs(male - female) < 5) return { label: evenLabel, className: 'text-rose-500' };
  return male > female
    ? { label: maleLabel, className: 'text-blue-500' }
    : { label: femaleLabel, className: 'text-pink-500' };
}

// 혼잡도 단계(여유/보통/약간 붐빔/붐빔)를 %로 환산해 막대 하나로 표시(2026-09-08) — API에
// "인기도" 같은 별도 퍼센트 지표가 없어, 이미 CongestionRing.tsx가 쓰는 4단계 순서를 그대로
// 재사용(여유=25%~붐빔=100%). 상태 pill 색도 같은 팔레트로 통일.
const STATUS_PILL: Record<string, string> = {
  '여유': 'bg-emerald-50 text-emerald-600',
  '보통': 'bg-amber-50 text-amber-600',
  '약간 붐빔': 'bg-orange-50 text-orange-600',
  '붐빔': 'bg-rose-50 text-rose-600',
};

export default function CongestionCard({ lang = 'ko', onNavigateToMap }: { lang?: string; onNavigateToMap?: (region: string) => void }) {
  const t = dict[lang as keyof typeof dict] || dict.ko;
  const router = useRouter();
  const [dataByArea, setDataByArea] = useState<Record<string, CrowdData>>({});
  const [selected, setSelected] = useState(AREAS[0]);

  useEffect(() => {
    let cancelled = false;
    Promise.all(
      AREAS.map((area) =>
        fetch(`/api-now/crowd?area=${encodeURIComponent(area)}`)
          .then((res) => (res.ok ? res.json() : null))
          .catch(() => null)
      )
    ).then((results) => {
      if (cancelled) return;
      const next: Record<string, CrowdData> = {};
      results.forEach((r, i) => { if (r) next[AREAS[i]] = r; });
      setDataByArea(next);
    });
    return () => { cancelled = true; };
  }, []);

  const data = dataByArea[selected];
  const age = data ? topAgeGroup(data.age_gender_summary, lang) : null;
  const gender = data ? dominantGender(data.age_gender_summary, lang) : null;
  const delta = data?.ppltn_delta_pct;
  const isFlat = typeof delta === 'number' && Math.abs(delta) < 1;
  const deltaText = typeof delta === 'number' ? (isFlat ? '0%' : `${delta > 0 ? '+' : ''}${delta}%`) : null;
  const levelIdx = data ? CONGEST_LEVELS.indexOf(data.congest_lvl) : -1;
  const pct = levelIdx >= 0 ? ((levelIdx + 1) / CONGEST_LEVELS.length) * 100 : 25;
  const barColor = data ? (CONGEST_RING_COLOR[data.congest_lvl] || '#a1a1aa') : '#e4e4e7';

  return (
    <SideCardShell
      label={t.title}
      moreHref={`/?tab=map&lang=${lang}`}
      onMoreClick={onNavigateToMap ? () => onNavigateToMap(AREA_TO_REGION[selected] || selected) : undefined}
    >
      {data ? (
        <button
          onClick={() =>
            onNavigateToMap
              ? onNavigateToMap(AREA_TO_REGION[selected] || selected)
              : router.push(`/?region=${encodeURIComponent(AREA_TO_REGION[selected] || selected)}&tab=map&lang=${lang}`)
          }
          className="w-full text-left group"
        >
          <div className="flex items-center gap-1.5 mb-2.5">
            <MapPin size={13} className="text-pace-600 flex-shrink-0" />
            <span className="text-sm font-bold text-zinc-900 group-hover:text-pace-700">{areaLabel(selected, lang)}</span>
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${STATUS_PILL[data.congest_lvl] || 'bg-zinc-100 text-zinc-500'}`}>
              {congestLabel(data.congest_lvl, lang)}
            </span>
          </div>

          <p className="text-xl font-black text-zinc-900 font-mono tracking-tight">
            {formatNum(data.ppltn_min)}~{formatNum(data.ppltn_max)}{ppltnUnit(lang)}
          </p>
          <p className="text-[11px] text-zinc-400 mb-3">{t.visitors}</p>

          <div className="h-1.5 bg-zinc-100 rounded-full overflow-hidden mb-1.5">
            <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: barColor }} />
          </div>
          <div className="flex items-center justify-between text-[10px] font-bold text-zinc-400 mb-3">
            <span>{t.congestion}</span>
            <span>{Math.round(pct)}%</span>
          </div>

          {(deltaText || age || gender) && (
            <div className="flex items-center gap-2 text-[11px] font-bold text-zinc-400 mb-4">
              {deltaText && <span>{deltaText}</span>}
              {age && <span>· {age}</span>}
              {gender && <span className={gender.className}>· {gender.label}</span>}
            </div>
          )}
        </button>
      ) : (
        <div className="py-6 text-center text-[11px] text-zinc-400 mb-3">···</div>
      )}

      <div className="flex flex-wrap gap-1.5 mb-3">
        {AREAS.map((area) => (
          <button
            key={area}
            onClick={() => setSelected(area)}
            className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-colors ${
              selected === area ? 'bg-pace-600 text-white' : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200'
            }`}
          >
            {areaLabel(area, lang)}
          </button>
        ))}
      </div>
    </SideCardShell>
  );
}
