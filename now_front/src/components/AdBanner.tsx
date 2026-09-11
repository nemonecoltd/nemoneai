"use client";
import { useEffect, useRef } from "react";

// matmatch(MainAdSlot)·plants(AdBanner)와 동일 패턴 — 홈 개편(2026-09-06)에서
// "가로 배너"로 요청받은 게 StoreBanner(자체 프로모 이미지)가 아니라 이 AdSense
// 배너였음이 확인되어 이식. variant="horizontal-slim"은 구글이 반응형 광고를
// 세로로 무한정 키우는 걸 막고 리더보드 높이로 고정한다(플랜트에서 먼저 도입).
export default function AdBanner({
  dataAdSlot,
  variant = "auto",
}: {
  dataAdSlot: string;
  variant?: "auto" | "horizontal-slim";
}) {
  const insRef = useRef<HTMLModElement>(null);
  const isSlim = variant === "horizontal-slim";

  useEffect(() => {
    // 개발 모드 React StrictMode 이중 마운트로 같은 <ins>에 push()가 중복
    // 호출돼 "already have ads in them" 에러가 나던 문제 — 이미 초기화된
    // (status 속성이 붙은) ins면 다시 push하지 않도록 가드.
    if (insRef.current?.getAttribute("data-adsbygoogle-status")) return;
    try {
      // adsbygoogle 전역 타입은 AdUnit.tsx가 이미 선언해둠(declare global)
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (err) {
      console.error("AdSense error:", err);
    }
  }, []);

  return (
    <div className="w-full overflow-hidden">
      <ins
        ref={insRef}
        className={`adsbygoogle${isSlim ? " ad-banner-slim" : ""}`}
        style={{ display: "block", width: "100%" }}
        data-ad-client="ca-pub-4274957638983041"
        data-ad-slot={dataAdSlot}
        data-ad-format={isSlim ? "horizontal" : "auto"}
        data-full-width-responsive={isSlim ? "false" : "true"}
      />
    </div>
  );
}
