"use client";

import { Heart, ImageIcon, ShoppingBag, Camera, Palette, Users, User, Sunset } from 'lucide-react';
import { CHIPS } from '@/components/home/ThemeChipsSection';
import SideCardShell from './SideCardShell';

const dict = {
  ko: { title: 'FIND YOUR PACE', subtitle: '어떤 곳을 찾고 있나요?' },
  en: { title: 'FIND YOUR PACE', subtitle: 'What are you looking for?' },
  zh: { title: 'FIND YOUR PACE', subtitle: '想找什么样的地方?' },
  ja: { title: 'FIND YOUR PACE', subtitle: 'どんな場所をお探しですか?' },
};

// 이모지 대신 라인 아이콘 + 파스텔 원형 배지로 통일(2026-09-08, Editorial Side Rail 개편) —
// 칩 목록/링크(CHIPS)는 이미 데이터 볼륨으로 검증된 8개라 그대로 재사용, 비주얼만 교체.
const CHIP_STYLE: Record<string, { icon: typeof Heart; className: string }> = {
  '데이트': { icon: Heart, className: 'bg-rose-50 text-rose-500' },
  '전시': { icon: ImageIcon, className: 'bg-blue-50 text-blue-500' },
  '쇼핑': { icon: ShoppingBag, className: 'bg-emerald-50 text-emerald-500' },
  '사진': { icon: Camera, className: 'bg-amber-50 text-amber-500' },
  '체험': { icon: Palette, className: 'bg-violet-50 text-violet-500' },
  '가족': { icon: Users, className: 'bg-sky-50 text-sky-500' },
  '혼자': { icon: User, className: 'bg-zinc-100 text-zinc-500' },
  '감성': { icon: Sunset, className: 'bg-pink-50 text-pink-500' },
};

export default function ThemeChipsCard({ lang = 'ko' }: { lang?: string }) {
  const t = dict[lang as keyof typeof dict] || dict.ko;

  return (
    <SideCardShell label={t.title} subtitle={t.subtitle}>
      <div className="grid grid-cols-4 gap-y-3">
        {CHIPS.map((chip) => {
          const style = CHIP_STYLE[chip.label.ko] || { icon: Heart, className: 'bg-zinc-100 text-zinc-500' };
          const Icon = style.icon;
          return (
            <a key={chip.href} href={`${chip.href}&lang=${lang}`} className="flex flex-col items-center gap-1.5 group">
              <span className={`w-9 h-9 rounded-full flex items-center justify-center transition-transform group-hover:scale-105 ${style.className}`}>
                <Icon size={16} strokeWidth={2} />
              </span>
              <span className="text-[10px] font-bold text-zinc-600 leading-none">
                {chip.label[lang] || chip.label.ko}
              </span>
            </a>
          );
        })}
      </div>
    </SideCardShell>
  );
}
