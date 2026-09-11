"use client";

import { useRef, useState } from 'react';
import { cn } from '@/lib/utils';

// 홈/랭킹 탭 전용 당겨서 새로고침(2026-09-10) — iOS 사파리·카카오톡 인앱 브라우저는 네이티브
// pull-to-refresh가 없어서 직접 구현. window.scrollY===0일 때만 드래그를 시작해 지도 탭의
// 팬/줌이나 랭킹 탭의 지역 스와이프(Recommendation.tsx의 handlePlaceSwipe, 가로 방향이라 원래도
// 안 겹침)와 충돌하지 않게 한다.
const THRESHOLD = 70;
const MAX_PULL = 100;

export default function PullToRefresh({
  enabled,
  onRefresh,
  children,
}: {
  enabled: boolean;
  onRefresh: () => void | Promise<void>;
  children: React.ReactNode;
}) {
  const [pullY, setPullY] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef<number | null>(null);
  const dragging = useRef(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!enabled || refreshing || window.scrollY > 0) {
      startY.current = null;
      dragging.current = false;
      return;
    }
    startY.current = e.touches[0].clientY;
    dragging.current = true;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!dragging.current || startY.current == null) return;
    if (window.scrollY > 0) { dragging.current = false; setPullY(0); return; }
    const delta = e.touches[0].clientY - startY.current;
    if (delta <= 0) { setPullY(0); return; }
    setPullY(Math.min(delta * 0.5, MAX_PULL)); // 실제 드래그 거리의 절반만 반영해 저항감을 줌
  };

  const handleTouchEnd = () => {
    if (!dragging.current) return;
    dragging.current = false;
    startY.current = null;
    if (pullY >= THRESHOLD) {
      setRefreshing(true);
      setPullY(THRESHOLD);
      Promise.resolve(onRefresh()).finally(() => {
        setRefreshing(false);
        setPullY(0);
      });
    } else {
      setPullY(0);
    }
  };

  return (
    <div onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
      <div
        className="flex items-center justify-center overflow-hidden transition-[height] duration-200 ease-out"
        style={{ height: pullY }}
      >
        <div
          className={cn(
            "w-6 h-6 border-2 border-zinc-300 border-t-pace-600 rounded-full",
            (refreshing || pullY >= THRESHOLD) && "animate-spin"
          )}
        />
      </div>
      {children}
    </div>
  );
}
