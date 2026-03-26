-- 1. 사용자 테이블
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. 장소 좋아요 테이블
CREATE TABLE IF NOT EXISTS likes (
    id SERIAL PRIMARY KEY,
    user_email TEXT NOT NULL,
    place_id INTEGER NOT NULL REFERENCES seongsu_places(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_email, place_id)
);

-- 3. AI 생성 코스 저장 테이블
CREATE TABLE IF NOT EXISTS saved_courses (
    id SERIAL PRIMARY KEY,
    user_email TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    steps JSONB NOT NULL, -- 코스 단계들을 JSON 형태로 통째로 저장
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
