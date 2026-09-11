// 프레임 관련 상수만 따로 뺀 이유(2026-09-10): 이 값들이 SideCardLayout.tsx('use client')에
// 있었는데, 서버 컴포넌트(랭킹/개인정보 등)가 거기서 import하면 Next.js가 문자열이 아니라
// 클라이언트 참조 프록시를 넘겨준다 — cn()이 그걸 조용히 무시해서 서버 컴포넌트 페이지만
// PC 폭 확장이 안 먹었다(빌드/타입체크는 통과하고 화면에서만 티가 안 나는 버그였음).
// 'use client'가 없는 이 파일에 두면 서버·클라이언트 양쪽에서 진짜 값으로 들어온다.

// 카드(280px)*2 + 갭(24px)*2 + 중앙 콘텐츠(448px) + 좌우 여백(24px)*2 = 1104px — max-w-6xl(1152px)
// 안에 정확히 들어간다. 카드가 있는 페이지는 상/하단바까지 이 폭으로 넓어져야 홈 탭과 어긋나지
// 않는다(2026-09-07 피드백).
export const WIDE_FRAME = 'max-w-md xl:max-w-6xl mx-auto';

// 모바일 프레임의 그림자/좌우 테두리는 xl에서 프레임이 넓어지면 오히려 어색해서 걷어낸다.
// (홈 탭은 원래 테두리가 없어 이 클래스를 쓰지 않는다 — 그래서 WIDE_FRAME과 분리)
export const WIDE_FRAME_BORDER = 'shadow-2xl border-x border-zinc-200 xl:shadow-none xl:border-0';

// BottomNav는 fixed 포지션이라 부모에서 실측할 수 없어(부모 flow 높이에 안 잡힘) 고정 레이아웃
// (px-4 pt-2 pb-4 + 아이콘22 + 라벨) 기준 실측값을 상수로 둔다.
export const BOTTOM_NAV_H = 84;
