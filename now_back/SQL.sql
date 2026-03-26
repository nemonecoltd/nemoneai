-- 1. 벡터 확장 기능 활성화
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. 오늘 성수 장소 정보 및 벡터 테이블
CREATE TABLE IF NOT EXISTS seongsu_places (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,          -- 팝업/장소 명칭
    content TEXT,                 -- 상세 설명 (RAG용)
    image_url TEXT,               -- 이미지 경로
    video_url TEXT,               -- [지침] 필드명 고정
    location TEXT,                -- 주소/위치
    date_range TEXT,              -- 운영 기간 (텍스트)
    end_date DATE,                -- 자동 삭제 판단 기준일
    embedding VECTOR(768),        -- Google Vertex AI 임베딩 값 (차원 확인 필요)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. 검색 성능 향상을 위한 인덱스
CREATE INDEX ON seongsu_places USING ivfflat (embedding vector_l2_ops);