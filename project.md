📄 Project Specs: 오늘 성수 (Now Seongsu)
1. 프로젝트 개요 (Overview)
서비스명: 오늘 성수 (Now Seongsu)
도메인: now.nemoneai.com (기존 nemoneai.com과 물리적/논리적 분리 운영)
핵심 가치: 성수동 로컬 팝업/이벤트 데이터를 실시간 수집(RAG)하여, AI 가이드가 최적의 관광 여정을 설계해 주는 고성능 웹 서비스.
기술 철학: 구글 에코시스템(GCP, Gemini, Vertex AI) 기반의 기술 통일 및 서버 내부(Internal) 로직 중심의 데이터 보안.

2. 기술 스택 명세 (Tech Stack)
Language: Python 3.10+ (Backend), TypeScript (Frontend)
Framework: FastAPI (Backend), Next.js 14+ App Router (Frontend)
AI/LLM: Google Gemini 1.5 Pro (Reasoning), Vertex AI Text-Embedding-004 (Vectorizing)
Database: PostgreSQL + pgvector (Vector similarity search)
Infrastructure: GCP VM Instance, Nginx (Reverse Proxy)

3. 개발 및 데이터 원칙 (Critical Guidelines)
데이터 무결성: 모든 데이터 호출은 서버 내부망 주소(http://127.0.0.1:8080)를 사용하며, 외부 SaaS(n8n 등) 사용을 금지하고 내부 로직으로 구현한다.
휘발성 관리: 성수동 데이터는 신선도가 핵심이므로, 생성일 기준 30일이 경과한 데이터는 DB에서 자동 삭제하는 TTL 로직을 반드시 포함한다.


보존 원칙: '더 나은 제안'이라는 명목으로 원본 로직을 임의로 삭제하거나 설계를 훼손하지 않는다. 필드명 video_url은 반드시 고정한다.

🛠️ CLI 작업 지시 가이드 (Prompt for CLI)
CLI에게 첫 작업을 시킬 때 아래 내용을 입력하십시오.

"너는 이제 네모네 주식회사의 CTO 정환석님의 스타일로 코딩하는 AI 개발자야. 현재 프로젝트 Now Seongsu는 로컬 환경에서 서버 DB에 SSH 터널링(Port 5433)으로 연결되어 있어. 아래 미션을 수행해줘."

기반 파일 인식: 제공된 database.py, gemini_service.py, models.py를 분석해서 프로젝트 구조를 파악해.
Main 로직 구현: main.py를 완성해. 성수동 팝업 정보를 입력받아 벡터화 후 저장하는 /collect와, 질문에 답하는 /ask API가 핵심이야.
데이터 삭제: APScheduler 등을 사용하여 매일 자정에 30일 지난 데이터를 지우는 백그라운드 태스크를 추가해.
연결: 프론트엔드 시안(파일)을 분석해서, 이 API들과 연동되는 실시간 리스트 및 채팅 화면을 Next.js로 이식해.

4. 디렉토리 설명
- now/now_front/ 프론트엔드 UI파일이 들어있음
- now/now_back/ 백엔드 디렉토리

5. 맛매치와 차이점
'오늘 성수'는 맛매치(MatMatch)와 달리 SSG(Static Site Generation) 비중이 매우 낮거나 거의 없는 '다이나믹 앱'
  구조이기 때문에 빌드가 훨씬 쉽고 빠릅니다.

  그 이유를 세 가지로 정리해 드릴게요.


  1. 빌드 시점에 데이터를 가져오지 않음
   * 맛매치: SEO(검색 최적화)를 위해 수백 개의 게시글을 빌드할 때 미리 구워서 정적 HTML로 만듭니다. 그래서 빌드 중에 백엔드가 꺼져 있으면
     바로 에러가 났던 것입니다.
   * 오늘 성수: 리스트나 지도의 데이터를 브라우저가 뜬 다음에 useEffect로 가져오는 CSR(Client-Side Rendering) 방식입니다. 빌드 시점에는 "텅
     빈 껍데기"만 만들기 때문에 백엔드가 켜져 있든 말든 빌드는 아주 쉽게 성공합니다.


  2. generateStaticParams를 쓰지 않음
   * 맛매치 배포의 주범이었던 generateStaticParams 로직이 현재 오늘 성수에는 들어가 있지 않습니다. 이 함수는 빌드 시점에 모든 가능 경로를
     체크하며 DB를 훑는데, 오늘 성수는 실시간성이 중요해서 사용자가 들어올 때 데이터를 가져오도록 설계했습니다.


  3. 실시간 AI와 개인화 기능 위주
   * AI 코스 생성이나 마이페이지, 채팅 같은 기능들은 사용자마다 내용이 다른 '개인화 데이터'입니다. 이런 데이터는 미리 정적으로 만들 수가
     없기 때문에 100% 다이나믹하게 작동해야 합니다.


  요약하자면:
  맛매치는 "도서관의 책(정적인 정보)" 같은 서비스라 미리 다 인쇄(SSG)해두느라 고생하는 것이고, 오늘 성수는 "실시간 가이드(동적인 정보)" 같은
  서비스라 그때그때 대답하는 방식이라 빌드 과정이 매우 가볍습니다.


  그래서 오늘 성수는 나중에 서버에 올릴 때도 맛매치처럼 복잡한 과정을 거치지 않고 훨씬 수월하게 배포될 것입니다!

  4. 타이틀 변경 및 스팟 확대
  '오늘 성수'에서 '지금 여기'로 확대 개편. 성수, 홍대 등 지속 스팟 확보 예정

  5. 다국어 서비스 도입
  영어 서비스 추가하여 이후 다양한 언어로 확대 예정

  6. 기타
  검색 대응 완료 후 검색 유입 대응
  