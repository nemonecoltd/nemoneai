"use client";

import { useState } from 'react';
import HeroSection from './HeroSection';
import HotNowSection from './HotNowSection';
import PaceNowSection from './PaceNowSection';
import RegionDiscoverySection from './RegionDiscoverySection';
import ThemeChipsSection from './ThemeChipsSection';
import CourseCtaBanner from './CourseCtaBanner';
import AdBanner from '@/components/AdBanner';
import { HomeRegion } from './homeUtils';

// PACE 메인(홈) 개편 — 기존 <Recommendation>을 대체하는 6개 섹션 조립부(2026-09-06).
// 히어로의 지역 칩은 앱 전체 region 상태(HomeClient의 지도/장소 탭용)와는 별개로, 이 홈 섹션들만
// 필터링하는 로컬 상태다 — 다른 탭 상태를 여기서 건드리면 탭을 이동했을 때 예상 못 한 지역으로
// 남아있게 되므로 의도적으로 분리했다.
export default function HomeSections({
  lang,
  allPlaces,
  regionTopPlaces,
  onSeeAllRanking,
}: {
  lang: string;
  allPlaces: any[];
  regionTopPlaces: { region: string; place: any }[];
  onSeeAllRanking: (region: HomeRegion) => void;
}) {
  const [region, setRegion] = useState<HomeRegion>('전체');

  return (
    <div>
      <HeroSection lang={lang} region={region} onRegionChange={setRegion} />
      <HotNowSection lang={lang} places={allPlaces} region={region} onSeeAll={() => onSeeAllRanking(region)} />
      {/* 가로 배너 — StoreBanner(자체 프로모 이미지)가 아니라 맛매치 메인 페이지가 쓰는 것과
          동일한 AdSense 배너였음(2026-09-06 사용자 피드백으로 정정). 원래 variant="horizontal-slim"으로
          리더보드(90px) 높이에 고정했는데, 높이 제한을 없애고 더 키워도 된다는 요청(2026-09-11)으로
          기본 반응형(auto)으로 전환 — 구글이 컨테이너 폭에 맞춰 더 큰 크기를 자유롭게 고른다. */}
      <div className="px-6 md:px-10 max-w-6xl md:mx-auto">
        <AdBanner dataAdSlot="7051929128" />
      </div>
      <PaceNowSection lang={lang} />
      <RegionDiscoverySection lang={lang} regionTopPlaces={regionTopPlaces} />
      <ThemeChipsSection lang={lang} />
      <CourseCtaBanner lang={lang} />
    </div>
  );
}
