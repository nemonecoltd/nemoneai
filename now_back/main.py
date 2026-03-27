from fastapi import FastAPI, HTTPException, Depends, File, UploadFile
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from datetime import date, datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import text
from database import engine, cleanup_expired_data
from gemini_service import get_embedding, generate_answer
from apscheduler.schedulers.background import BackgroundScheduler
import uvicorn
import logging
import os
import uuid

# 로깅 설정
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="오늘 성수 (Now Seongsu) API")

# --- 정적 파일 서빙 ---
os.makedirs("static/profiles", exist_ok=True)
app.mount("/static", StaticFiles(directory="static"), name="static")

# --- CORS 설정 ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Pydantic 모델 ---
class FeedbackCreate(BaseModel):
    user_email: str
    user_name: str
    content: str

class FeedbackReply(BaseModel):
    admin_email: str
    reply: str

class PlaceCollect(BaseModel):
    title: str
    content: str
    image_url: Optional[str] = None
    video_url: Optional[str] = None
    location: Optional[str] = None
    date_range: Optional[str] = None
    end_date: Optional[date] = None

class PlaceUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    image_url: Optional[str] = None
    video_url: Optional[str] = None
    location: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    date_range: Optional[str] = None

class Question(BaseModel):
    user_query: str

class TourRequest(BaseModel):
    companion: str
    user_email: Optional[str] = None

class LikeToggle(BaseModel):
    user_email: str
    place_id: int

class UserSync(BaseModel):
    email: str
    name: Optional[str] = None
    image_url: Optional[str] = None
    auth_provider: Optional[str] = 'google'

class UserSignUp(BaseModel):
    email: str
    name: str
    password: str
    gender: Optional[str] = None
    age: Optional[str] = None
    nationality: Optional[str] = None

class UserLogin(BaseModel):
    email: str
    password: str

class UserUpdate(BaseModel):
    name: Optional[str] = None
    gender: Optional[str] = None
    age: Optional[str] = None
    nationality: Optional[str] = None
    image_url: Optional[str] = None

class CourseSave(BaseModel):
    user_email: str
    title: str
    description: str
    steps: List[dict]
    region: Optional[str] = "성수"

class CourseLikeToggle(BaseModel):
    user_email: str
    course_id: int

class ThemeSave(BaseModel):
    user_email: str
    title: str
    description: str
    places: List[dict]
    region: Optional[str] = "성수"

class ThemeLikeToggle(BaseModel):
    user_email: str
    theme_id: int

# --- 비밀번호 해싱 설정 ---
import bcrypt

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
    except ValueError:
        return False

def get_password_hash(password: str) -> str:
    # bcrypt requires bytes, and the generated salt is also bytes
    pwd_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt()
    hashed_password = bcrypt.hashpw(pwd_bytes, salt)
    return hashed_password.decode('utf-8')

# --- API 엔드포인트 ---

@app.post("/auth/signup")
async def auth_signup(user: UserSignUp):
    """자체 회원가입"""
    with engine.connect() as conn:
        existing = conn.execute(text("SELECT email FROM users WHERE email = :email"), {"email": user.email}).fetchone()
        if existing:
            raise HTTPException(status_code=400, detail="Email already registered")
        
        hashed_password = get_password_hash(user.password)
        default_image = f"https://ui-avatars.com/api/?name={user.name}&background=random"
        query = text("""
            INSERT INTO users (email, name, password_hash, auth_provider, image_url, gender, age, nationality)
            VALUES (:email, :name, :password_hash, 'local', :image_url, :gender, :age, :nationality)
        """)
        conn.execute(query, {
            "email": user.email,
            "name": user.name,
            "password_hash": hashed_password,
            "image_url": default_image,
            "gender": user.gender,
            "age": user.age,
            "nationality": user.nationality
        })
        conn.commit()
    return {"status": "success", "email": user.email}

@app.post("/auth/login")
async def auth_login(user: UserLogin):
    """자체 로그인"""
    with engine.connect() as conn:
        result = conn.execute(text("SELECT email, name, image_url, password_hash, auth_provider FROM users WHERE email = :email"), {"email": user.email}).fetchone()
        if not result:
            raise HTTPException(status_code=400, detail="Invalid credentials")
        
        user_data = dict(result._mapping)
        if user_data['auth_provider'] != 'local':
            raise HTTPException(status_code=400, detail="Please login with Google")
            
        if not verify_password(user.password, user_data['password_hash']):
            raise HTTPException(status_code=400, detail="Invalid credentials")
            
        return {
            "email": user_data['email'],
            "name": user_data['name'],
            "image_url": user_data['image_url']
        }

@app.post("/users/sync")
async def sync_user(user: UserSync):
    """구글 로그인 시 사용자 정보 동기화"""
    query = text("""
        INSERT INTO users (email, name, image_url)
        VALUES (:email, :name, :image_url)
        ON CONFLICT (email) DO UPDATE SET
            name = EXCLUDED.name,
            image_url = EXCLUDED.image_url
    """)
    with engine.connect() as conn:
        conn.execute(query, {"email": user.email, "name": user.name, "image_url": user.image_url})
        conn.commit()
    return {"status": "success", "user": user.email}

@app.get("/users/{email}/profile")
async def get_user_profile(email: str):
    with engine.connect() as conn:
        result = conn.execute(
            text("SELECT name, email, image_url, gender, age, nationality FROM users WHERE email = :email"),
            {"email": email}
        ).fetchone()
        if not result:
            raise HTTPException(status_code=404, detail="User not found")
        return dict(result._mapping)

@app.put("/users/{email}/profile")
async def update_user_profile(email: str, update_data: UserUpdate):
    updates = []
    params = {"email": email}
    if update_data.name is not None:
        updates.append("name = :name")
        params["name"] = update_data.name
    if update_data.gender is not None:
        updates.append("gender = :gender")
        params["gender"] = update_data.gender
    if update_data.age is not None:
        updates.append("age = :age")
        params["age"] = update_data.age
    if update_data.nationality is not None:
        updates.append("nationality = :nationality")
        params["nationality"] = update_data.nationality
    if update_data.image_url is not None:
        updates.append("image_url = :image_url")
        params["image_url"] = update_data.image_url

    if not updates:
        return {"status": "success", "message": "No updates provided"}

    query = text(f"UPDATE users SET {', '.join(updates)} WHERE email = :email")
    with engine.connect() as conn:
        conn.execute(query, params)
        conn.commit()
    return {"status": "success"}

@app.post("/upload/profile")
async def upload_profile_image(file: UploadFile = File(...)):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    file_extension = file.filename.split(".")[-1]
    new_filename = f"{uuid.uuid4().hex}.{file_extension}"
    file_path = f"static/profiles/{new_filename}"
    
    with open(file_path, "wb") as buffer:
        content = await file.read()
        buffer.write(content)
        
    # Return the full URL
    # Replace the host with actual backend domain if necessary
    return {"url": f"/static/profiles/{new_filename}"}

@app.post("/likes/toggle")
async def toggle_like(req: LikeToggle):
    """장소 좋아요 토글"""
    with engine.connect() as conn:
        conn.execute(
            text("INSERT INTO users (email) VALUES (:email) ON CONFLICT (email) DO NOTHING"),
            {"email": req.user_email}
        )
        existing = conn.execute(
            text("SELECT id FROM likes WHERE user_email = :email AND place_id = :place_id"),
            {"email": req.user_email, "place_id": req.place_id}
        ).fetchone()
        if existing:
            conn.execute(text("DELETE FROM likes WHERE id = :id"), {"id": existing[0]})
            liked = False
        else:
            conn.execute(
                text("INSERT INTO likes (user_email, place_id) VALUES (:email, :place_id)"),
                {"email": req.user_email, "place_id": req.place_id}
            )
            liked = True
        conn.commit()
        return {"liked": liked}

@app.get("/users/{email}/likes")
async def get_user_likes(email: str):
    query = text("""
        SELECT p.* FROM seongsu_places p
        JOIN likes l ON p.id = l.place_id
        WHERE l.user_email = :email
        ORDER BY l.created_at DESC
    """)
    with engine.connect() as conn:
        result = conn.execute(query, {"email": email})
        return [dict(row._mapping) for row in result]

@app.post("/courses/save")
async def save_course(course: CourseSave):
    import json
    try:
        with engine.connect() as conn:
            conn.execute(
                text("INSERT INTO users (email) VALUES (:email) ON CONFLICT (email) DO NOTHING"),
                {"email": course.user_email}
            )
            query = text("""
                INSERT INTO saved_courses (user_email, title, description, steps, region)
                VALUES (:email, :title, :description, :steps, :region)
            """)
            conn.execute(query, {
                "email": course.user_email, "title": course.title,
                "description": course.description, "steps": json.dumps(course.steps),
                "region": course.region or "성수"
            })
            conn.commit()
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/users/{email}/courses")
async def get_user_courses(email: str):
    query = text("SELECT * FROM saved_courses WHERE user_email = :email ORDER BY created_at DESC LIMIT 10")
    with engine.connect() as conn:
        result = conn.execute(query, {"email": email})
        return [dict(row._mapping) for row in result]

@app.get("/courses")
async def get_all_courses():
    """[랭킹] 모든 코스 조회 (좋아요 높은 순 -> 최신순, 퍼간 코스 제외)"""
    query = text("""
        SELECT c.*, u.name as user_name, u.image_url as user_image, COUNT(cl.id) as like_count
        FROM saved_courses c
        JOIN users u ON c.user_email = u.email
        LEFT JOIN course_likes cl ON c.id = cl.course_id
        WHERE c.title NOT LIKE '[퍼감]%'
        GROUP BY c.id, u.name, u.image_url
        ORDER BY like_count DESC, c.created_at DESC
    """)
    with engine.connect() as conn:
        result = conn.execute(query)
        return [dict(row._mapping) for row in result]

@app.post("/courses/like/toggle")
async def toggle_course_like(req: CourseLikeToggle):
    """코스 좋아요 토글"""
    with engine.connect() as conn:
        conn.execute(
            text("INSERT INTO users (email) VALUES (:email) ON CONFLICT (email) DO NOTHING"),
            {"email": req.user_email}
        )
        existing = conn.execute(
            text("SELECT id FROM course_likes WHERE user_email = :email AND course_id = :course_id"),
            {"email": req.user_email, "course_id": req.course_id}
        ).fetchone()
        if existing:
            conn.execute(text("DELETE FROM course_likes WHERE id = :id"), {"id": existing[0]})
            liked = False
        else:
            conn.execute(
                text("INSERT INTO course_likes (user_email, course_id) VALUES (:email, :course_id)"),
                {"email": req.user_email, "course_id": req.course_id}
            )
            liked = True
        conn.commit()
        return {"liked": liked}

@app.post("/themes/save")
async def save_theme(theme: ThemeSave):
    import json
    try:
        with engine.connect() as conn:
            conn.execute(
                text("INSERT INTO users (email) VALUES (:email) ON CONFLICT (email) DO NOTHING"),
                {"email": theme.user_email}
            )
            query = text("""
                INSERT INTO themes (user_email, title, description, places)
                VALUES (:email, :title, :description, :places)
            """)
            conn.execute(query, {
                "email": theme.user_email, "title": theme.title,
                "description": theme.description, "places": json.dumps(theme.places)
            })
            conn.commit()
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/themes")
async def get_all_themes():
    """테마 랭킹 (최신순 또는 좋아요순)"""
    query = text("""
        SELECT t.*, u.name as user_name, u.image_url as user_image, COUNT(tl.id) as computed_like_count
        FROM themes t
        JOIN users u ON t.user_email = u.email
        LEFT JOIN theme_likes tl ON t.id = tl.theme_id
        WHERE t.title NOT LIKE '[퍼감]%'
        GROUP BY t.id, u.name, u.image_url
        ORDER BY computed_like_count DESC, t.created_at DESC
    """)
    with engine.connect() as conn:
        result = conn.execute(query)
        # Rename computed_like_count to like_count for frontend
        themes = []
        for row in result:
            theme_dict = dict(row._mapping)
            theme_dict['like_count'] = theme_dict.pop('computed_like_count')
            themes.append(theme_dict)
        return themes

@app.get("/users/{email}/themes")
async def get_user_themes(email: str):
    query = text("SELECT * FROM themes WHERE user_email = :email ORDER BY created_at DESC")
    with engine.connect() as conn:
        result = conn.execute(query, {"email": email})
        return [dict(row._mapping) for row in result]

@app.put("/themes/{theme_id}")
async def update_theme(theme_id: int, theme: ThemeSave):
    import json
    try:
        with engine.connect() as conn:
            # Check authority
            existing = conn.execute(text("SELECT user_email FROM themes WHERE id = :id"), {"id": theme_id}).fetchone()
            if not existing:
                raise HTTPException(status_code=404, detail="Theme not found")
            if theme.user_email != 'nemonecoltd@gmail.com' and existing[0] != theme.user_email:
                raise HTTPException(status_code=403, detail="Not authorized")

            query = text("""
                UPDATE themes 
                SET title = :title, description = :description, places = :places
                WHERE id = :id
            """)
            conn.execute(query, {
                "id": theme_id, "title": theme.title,
                "description": theme.description, "places": json.dumps(theme.places)
            })
            conn.commit()
        return {"status": "success"}
    except Exception as e:
        if isinstance(e, HTTPException): raise e
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/themes/{theme_id}")
async def delete_theme(theme_id: int, user_email: str):
    """테마 삭제 (작성자 또는 관리자)"""
    with engine.connect() as conn:
        theme = conn.execute(text("SELECT user_email FROM themes WHERE id = :id"), {"id": theme_id}).fetchone()
        if not theme:
            raise HTTPException(status_code=404, detail="Theme not found")
        
        # 관리자 이메일 확인 또는 작성자 본인
        if user_email != 'nemonecoltd@gmail.com' and theme[0] != user_email:
            raise HTTPException(status_code=403, detail="Not authorized")
            
        conn.execute(text("DELETE FROM themes WHERE id = :id"), {"id": theme_id})
        conn.commit()
        return {"status": "success"}

@app.post("/themes/like/toggle")
async def toggle_theme_like(req: ThemeLikeToggle):
    """테마 좋아요 토글"""
    with engine.connect() as conn:
        conn.execute(
            text("INSERT INTO users (email) VALUES (:email) ON CONFLICT (email) DO NOTHING"),
            {"email": req.user_email}
        )
        existing = conn.execute(
            text("SELECT id FROM theme_likes WHERE user_email = :email AND theme_id = :theme_id"),
            {"email": req.user_email, "theme_id": req.theme_id}
        ).fetchone()
        if existing:
            conn.execute(text("DELETE FROM theme_likes WHERE id = :id"), {"id": existing[0]})
            liked = False
        else:
            conn.execute(
                text("INSERT INTO theme_likes (user_email, theme_id) VALUES (:email, :theme_id)"),
                {"email": req.user_email, "theme_id": req.theme_id}
            )
            liked = True
        conn.commit()
        return {"liked": liked}

@app.post("/ask")
async def ask_question(question: Question, region: str = "성수", lang: str = "ko"):
    """[핵심] RAG 기반 다국어 질문 답변"""
    try:
        # 1. 질문 벡터화
        query_embedding = get_embedding(question.user_query)
        embedding_str = f"[{','.join(map(str, query_embedding))}]"

        # 2. 벡터 유사도 검색 (상위 5개)
        # 언어에 따라 검색 대상 필드를 다르게 하되, 영문이 비어있으면 한글로 Fallback
        title_field = "COALESCE(title_en, title)" if lang == "en" else "title"
        content_field = "COALESCE(content_en, content)" if lang == "en" else "content"

        search_query = text(f"""
            SELECT {title_field}, {content_field}, location
            FROM seongsu_places
            WHERE region = :region
            ORDER BY embedding <-> :embedding
            LIMIT 5
        """)
        
        with engine.connect() as conn:
            result = conn.execute(search_query, {"region": region, "embedding": embedding_str})
            context_list = []
            for row in result:
                context_list.append(f"[{row[0]}] {row[1]} (위치: {row[2]})")
            
            context_text = "\n".join(context_list)
            
        logger.info(f"🧠 [AskAI Context] Region: {region}, Lang: {lang}, Found: {len(context_list)} places")
        logger.info(f"Context Text Preview: {context_text[:200]}")

        if not context_text.strip():
            logger.warning("⚠️ 벡터 검색 결과가 비어있습니다. Gemini가 답변을 거부할 가능성이 높습니다.")

        # 3. Gemini 답변 생성
        answer = generate_answer(question.user_query, context_text, region=region, lang=lang)
        
        return {"answer": answer, "context": context_list}
    except Exception as e:
        logger.error(f"❌ Ask failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/search")
async def search_places(q: str, region: str = "성수", lang: str = "ko"):
    """[핵심] 다국어 검색 (벡터 기반)"""
    try:
        query_embedding = get_embedding(q)
        embedding_str = f"[{','.join(map(str, query_embedding))}]"

        title_field = "title_en" if lang == "en" else "title"
        content_field = "content_en" if lang == "en" else "content"

        query = text(f"""
            SELECT id, {title_field} as title, {content_field} as content, image_url, video_url, location, date_range, latitude, longitude, region
            FROM seongsu_places
            WHERE region = :region
            ORDER BY embedding <-> :embedding
            LIMIT 10
        """)
        
        with engine.connect() as conn:
            result = conn.execute(query, {"region": region, "embedding": embedding_str})
            return [dict(row._mapping) for row in result]
    except Exception as e:
        logger.error(f"❌ Search failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/places/popular")
async def get_popular_places(region: Optional[str] = None):
    where_clause = "WHERE region = :region" if region else ""
    query = text(f"""
        SELECT p.id, p.title, p.title_en, p.content, p.content_en, p.image_url, p.location, p.region, COUNT(l.id) as like_count 
        FROM seongsu_places p
        LEFT JOIN likes l ON p.id = l.place_id
        {where_clause}
        GROUP BY p.id
        ORDER BY like_count DESC, p.created_at DESC
    """)
    with engine.connect() as conn:
        params = {"region": region} if region else {}
        result = conn.execute(query, params)
        return [dict(row._mapping) for row in result]

@app.post("/itinerary")
async def create_itinerary(req: TourRequest, region: str = "성수", lang: str = "ko"):
    import json
    from datetime import date
    try:
        today = date.today()
        # 1. 캐시 확인 (지역 및 언어 정보 포함)
        with engine.connect() as conn:
            # 캐시 키에 언어 추가 (현재는 단순 companion/date 기반이나 확장이 필요할 수 있음)
            cache_query = text("SELECT itinerary_json FROM ai_itinerary_cache WHERE companion = :companion AND created_at = :today")
            cached_result = conn.execute(cache_query, {"companion": req.companion, "today": today}).fetchone()
            
            if cached_result:
                logger.info(f"✨ [Cache Hit] Returning cached itinerary for {req.companion}")
                return cached_result[0]

        # 2. 캐시 없으면 Gemini 호출 (언어에 맞는 필드 가져옴)
        title_field = "title_en" if lang == "en" else "title"
        content_field = "content_en" if lang == "en" else "content"
        
        search_query = text(f"SELECT {title_field}, {content_field}, location FROM seongsu_places WHERE region = :region LIMIT 15")
        with engine.connect() as conn:
            result = conn.execute(search_query, {"region": region})
            context_text = "\n".join([f"[{row[0]}] {row[1]}" for row in result])
        
        from gemini_service import generate_walking_tour
        # 프롬프트에 지역 및 언어 정보 전달
        itinerary = generate_walking_tour(req.companion, context_text, region=region, lang=lang)

        # 3. 결과 캐싱
        try:
            with engine.connect() as conn:
                insert_cache = text("""
                    INSERT INTO ai_itinerary_cache (companion, itinerary_json, created_at)
                    VALUES (:companion, :json, :today)
                    ON CONFLICT (companion, created_at) DO UPDATE SET itinerary_json = EXCLUDED.itinerary_json
                """)
                conn.execute(insert_cache, {
                    "companion": req.companion,
                    "json": json.dumps(itinerary),
                    "today": today
                })
                conn.commit()
                logger.info(f"💾 [Cache Save] Itinerary for {req.companion} saved to cache")
        except Exception as cache_err:
            logger.error(f"❌ Cache save failed: {cache_err}")

        return itinerary
    except Exception as e:
        logger.error(f"❌ Itinerary creation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/places")
async def list_places(region: Optional[str] = None):
    where_clause = "WHERE region = :region" if region else ""
    query = text(f"SELECT id, title, title_en, content, content_en, image_url, video_url, location, date_range, latitude, longitude, region FROM seongsu_places {where_clause} ORDER BY created_at DESC")
    with engine.connect() as conn:
        params = {"region": region} if region else {}
        result = conn.execute(query, params)
        return [dict(row._mapping) for row in result]

@app.put("/places/{place_id}")
async def update_place(place_id: int, place: PlaceUpdate):
    try:
        update_data = place.dict(exclude_unset=True)
        if "content" in update_data:
            update_data["embedding"] = f"[{','.join(map(str, get_embedding(update_data['content'])))}]"
        set_clause = ", ".join([f"{k} = :{k}" for k in update_data.keys()])
        query = text(f"UPDATE seongsu_places SET {set_clause} WHERE id = :place_id")
        with engine.connect() as conn:
            conn.execute(query, {**update_data, "place_id": place_id})
            conn.commit()
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/places/{place_id}")
async def delete_place(place_id: int):
    with engine.connect() as conn:
        conn.execute(text("DELETE FROM seongsu_places WHERE id = :place_id"), {"place_id": place_id})
        conn.commit()
    return {"status": "success"}

@app.get("/feedbacks")
async def get_feedbacks():
    query = text("SELECT * FROM feedbacks ORDER BY created_at DESC")
    with engine.connect() as conn:
        result = conn.execute(query)
        return [dict(row._mapping) for row in result]

@app.post("/feedbacks")
async def create_feedback(req: FeedbackCreate):
    query = text("INSERT INTO feedbacks (user_email, user_name, content) VALUES (:email, :name, :content)")
    with engine.connect() as conn:
        conn.execute(query, {"email": req.user_email, "name": req.user_name, "content": req.content})
        conn.commit()
    return {"status": "success"}

@app.delete("/feedbacks/{feedback_id}")
async def delete_feedback(feedback_id: int, user_email: str):
    with engine.connect() as conn:
        feedback = conn.execute(text("SELECT user_email FROM feedbacks WHERE id = :id"), {"id": feedback_id}).fetchone()
        if not feedback:
            raise HTTPException(status_code=404, detail="Not Found")
        if feedback[0] != user_email and user_email != 'nemonecoltd@gmail.com':
            raise HTTPException(status_code=403, detail="Unauthorized")
        
        conn.execute(text("DELETE FROM feedbacks WHERE id = :id"), {"id": feedback_id})
        conn.commit()
    return {"status": "success"}

@app.post("/feedbacks/{feedback_id}/reply")
async def reply_feedback(feedback_id: int, req: FeedbackReply):
    if req.admin_email != 'nemonecoltd@gmail.com':
        raise HTTPException(status_code=403, detail="Admin only")
    with engine.connect() as conn:
        conn.execute(text("UPDATE feedbacks SET admin_reply = :reply WHERE id = :id"), {"reply": req.reply, "id": feedback_id})
        conn.commit()
    return {"status": "success"}

@app.get("/admin/stats")
async def get_admin_stats():
    """관리자용 통계 (총 유저수, 총 코스수, 총 스팟수)"""
    with engine.connect() as conn:
        user_count = conn.execute(text("SELECT COUNT(*) FROM users")).scalar()
        course_count = conn.execute(text("SELECT COUNT(*) FROM saved_courses")).scalar()
        place_count = conn.execute(text("SELECT COUNT(*) FROM seongsu_places")).scalar()
        return {
            "total_users": user_count or 0,
            "total_courses": course_count or 0,
            "total_places": place_count or 0
        }

@app.get("/admin/users")
async def get_admin_users(page: int = 1, limit: int = 25):
    """관리자용 유저 리스트 (페이지네이션)"""
    offset = (page - 1) * limit
    with engine.connect() as conn:
        users = conn.execute(
            text("SELECT email, name, image_url, gender, age, nationality, created_at FROM users ORDER BY created_at DESC LIMIT :limit OFFSET :offset"),
            {"limit": limit, "offset": offset}
        )
        return [dict(row._mapping) for row in users]

@app.delete("/admin/users/{email}")
async def delete_admin_user(email: str):
    """관리자용 유저 삭제"""
    with engine.connect() as conn:
        conn.execute(text("DELETE FROM users WHERE email = :email"), {"email": email})
        conn.commit()
    return {"status": "success"}

scheduler = BackgroundScheduler()
scheduler.add_job(cleanup_expired_data, 'cron', hour=0, minute=0)
scheduler.start()

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8081)
