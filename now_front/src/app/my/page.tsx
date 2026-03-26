"use client";

import { useState, useEffect } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, MapPin, Route, Heart, ChevronRight, LogOut, Loader2, 
  Sparkles, Trash2, ChevronLeft, Map as MapIcon, List as ListIcon, X, Ticket, TrendingUp,
  MessageSquare, Settings
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type Tab = 'course' | 'place';
type Region = '성수' | '홍대';

export default function MyPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('course');
  const [region, setRegion] = useState<Region>('성수');
  const [likedPlaces, setLikedPlaces] = useState([]);
  const [savedCourses, setSavedCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (session?.user?.email) {
      fetchUserData();
    }
  }, [session]);

  const fetchUserData = async () => {
    setIsLoading(true);
    try {
      const [likesRes, coursesRes] = await Promise.all([
        fetch(`/api-now/users/${session?.user?.email}/likes`),
        fetch(`/api-now/users/${session?.user?.email}/courses`)
      ]);
      if (likesRes.ok) setLikedPlaces(await likesRes.json());
      if (coursesRes.ok) setSavedCourses(await coursesRes.json());
    } finally {
      setIsLoading(false);
    }
  };

  // 장소 필터링: 현재 선택된 지역만 표시
  const filteredLikedPlaces = likedPlaces.filter((p: any) => p.region === region);

  const handleDeleteLike = async (placeId: number) => {
    if (!confirm('관심 장소에서 삭제하시겠습니까?')) return;
    try {
      const res = await fetch('/api-now/likes/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_email: session?.user?.email, place_id: placeId }),
      });
      if (res.ok) {
        setLikedPlaces(prev => prev.filter((p: any) => p.id !== placeId));
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (status === "loading") return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-emerald-500" /></div>;
  
  if (!session) return (
    <div className="h-screen flex flex-col items-center justify-center p-8 text-center space-y-6 max-w-md mx-auto bg-white shadow-2xl">
      <div className="w-20 h-20 bg-emerald-50 rounded-3xl flex items-center justify-center text-emerald-500 mb-4">
        <User size={40} />
      </div>
      <h2 className="text-2xl font-bold font-display">로그인이 필요합니다</h2>
      <p className="text-zinc-500 text-sm">마이페이지를 확인하시려면 로그인해 주세요.</p>
      <button onClick={() => signIn()} className="w-full max-w-xs py-4 bg-zinc-900 text-white rounded-2xl font-bold shadow-xl">로그인하기</button>
      <button onClick={() => router.push('/')} className="text-zinc-400 text-sm font-bold">홈으로 돌아가기</button>
    </div>
  );

  return (
    <div className="min-h-screen bg-zinc-50 max-w-md mx-auto relative shadow-2xl pb-32 border-x border-zinc-200">
      {/* Top Navigation Bar */}
      <header className="fixed top-0 left-0 right-0 max-w-md mx-auto bg-white/80 backdrop-blur-md z-50 border-b border-zinc-100 px-6 py-4 flex items-center gap-4">
        <button onClick={() => router.push('/')} className="p-2 hover:bg-zinc-100 rounded-full transition-colors">
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-lg font-bold font-display tracking-tight text-zinc-900">MY PAGE</h1>
        <div className="ml-auto flex items-center gap-2">
          {session.user?.email === 'nemonecoltd@gmail.com' && (
            <Link href="/admin" className="px-3 py-1.5 bg-emerald-50 text-emerald-600 text-[10px] font-black rounded-lg border border-emerald-100 hover:bg-emerald-100 transition-all">
              ADMIN
            </Link>
          )}
          <button onClick={() => signOut()} className="p-2 bg-zinc-50 rounded-xl text-zinc-400 hover:text-rose-500 transition-colors">
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {/* Profile Section */}
      <div className="bg-white px-8 pt-24 pb-10 rounded-b-[40px] shadow-sm">
        <div className="flex items-center gap-6 mb-8">
          <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-emerald-50 shadow-lg flex-shrink-0">
            <img src={session.user?.image || ""} alt={session.user?.name || ""} className="w-full h-full object-cover" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-2xl font-black tracking-tight truncate">{session.user?.name}</h2>
            <p className="text-zinc-400 text-xs font-medium truncate">{session.user?.email}</p>
          </div>
          <Link href="/my/edit" className="p-3 bg-zinc-100 text-zinc-500 rounded-2xl hover:bg-emerald-50 hover:text-emerald-500 transition-all shadow-sm">
            <Settings size={20} />
          </Link>
        </div>

        {/* Custom Tabs */}
        <div className="flex bg-zinc-100 p-1.5 rounded-2xl">
          <button 
            onClick={() => setActiveTab('course')}
            className={cn("flex-1 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2", 
              activeTab === 'course' ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-400")}
          >
            <Route size={16} /> 코스
          </button>
          <button 
            onClick={() => setActiveTab('place')}
            className={cn("flex-1 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2", 
              activeTab === 'place' ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-400")}
          >
            <Heart size={16} /> 플레이스
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <main className="p-6">
        <AnimatePresence mode="wait">
          {activeTab === 'course' && (
            <motion.div key="course" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              {savedCourses.length > 0 ? (
                savedCourses.map((course: any) => {
                  const steps = Array.isArray(course.steps) ? course.steps : JSON.parse(course.steps);
                  return (
                    <div 
                      key={course.id} 
                      onClick={() => setSelectedCourse(course)}
                      className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm space-y-3 relative group cursor-pointer hover:border-emerald-200 transition-all"
                    >
                      <h4 className="font-bold text-zinc-900 pr-8 tracking-tight">{course.title}</h4>
                      <p className="text-xs text-zinc-500 line-clamp-1">{course.description}</p>
                      <div className="flex items-center gap-3 pt-2">
                        <span className={cn(
                          "text-[10px] font-black px-2 py-1 rounded-md uppercase border",
                          (course.region && course.region.includes('홍대'))
                            ? "bg-orange-50 text-orange-600 border-orange-100" 
                            : "bg-emerald-50 text-emerald-600 border-emerald-100"
                        )}>
                          {(course.region && course.region.includes('홍대')) ? '홍대' : '성수'}
                        </span>
                        <span className="text-[10px] font-bold text-zinc-500 bg-zinc-100 px-2 py-1 rounded-md">
                          {steps.length}개 경유
                        </span>
                        <span className="text-[10px] font-medium text-zinc-300 ml-auto">
                          {new Date(course.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <ChevronRight className="absolute right-6 top-1/2 -translate-y-1/2 text-zinc-300 group-hover:text-emerald-500 transition-colors" />
                    </div>
                  );
                })
              ) : (
                <div className="py-20 text-center space-y-6">
                  <div className="w-16 h-16 bg-zinc-100 rounded-2xl flex items-center justify-center mx-auto text-zinc-300">
                    <Sparkles size={32} />
                  </div>
                  <p className="text-zinc-400 text-sm font-medium">아직 생성된 코스가 없습니다.</p>
                  <Link href="/?tab=tour" className="inline-block px-8 py-3 bg-zinc-900 text-white rounded-2xl font-bold text-sm">AI 코스 만들러 가기</Link>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'place' && (
            <motion.div key="place" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              {likedPlaces.length > 0 ? (
                likedPlaces.map((place: any) => (
                  <div key={place.id} className="bg-white p-5 rounded-3xl border border-zinc-100 shadow-sm flex gap-4 items-center group relative">
                    <div className="relative flex-shrink-0">
                      <img src={place.image_url || "https://picsum.photos/200"} className="w-16 h-16 rounded-2xl object-cover" alt="" />
                      <div className="absolute -bottom-1 -right-1 shadow-lg">
                        <span className={cn(
                          "text-[8px] font-black px-1.5 py-0.5 rounded-md border",
                          (place.region && place.region.includes('홍대'))
                            ? "bg-orange-500 text-white border-orange-400 shadow-[0_0_10px_rgba(249,115,22,0.5)]" 
                            : "bg-emerald-500 text-white border-emerald-400"
                        )}>
                          {(place.region && place.region.includes('홍대')) ? '홍대' : '성수'}
                        </span>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-zinc-900 truncate tracking-tight">{place.title}</h4>
                      <p className="text-xs text-zinc-400 truncate">{place.location}</p>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleDeleteLike(place.id)}
                        className="p-2 text-rose-500 bg-rose-50 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 size={16} />
                      </button>
                      <Link href={`/posts/${place.id}`}>
                        <div className="p-2 bg-zinc-50 rounded-xl text-zinc-300 group-hover:text-zinc-900">
                          <ChevronRight size={20} />
                        </div>
                      </Link>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-20 text-center text-zinc-400 text-sm font-medium">좋아요한 장소가 없습니다.</div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Global Footer */}
        <footer className="mt-20 mb-32 px-2 flex items-center justify-between border-t border-zinc-100 pt-8">
          <span className="text-[10px] font-bold text-zinc-400 tracking-tight">© 네모네 주식회사, 당신 시간의 알찬 소비</span>
          <Link href="/feedback" className="flex items-center gap-1.5 text-[11px] font-black text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full hover:bg-emerald-100 transition-colors shadow-sm">
            피드백 <MessageSquare size={14} className="fill-emerald-100" />
          </Link>
        </footer>
      </main>

      {/* Course Detail Modal */}
      <AnimatePresence>
        {selectedCourse && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-end justify-center"
            onClick={() => setSelectedCourse(null)}
          >
            <motion.div 
              initial={{ y: "100%" }} 
              animate={{ y: 0 }} 
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="w-full max-w-md bg-zinc-50 rounded-t-[40px] p-8 max-h-[85vh] overflow-y-auto no-scrollbar shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-2xl font-black text-zinc-900 tracking-tight">{selectedCourse.title}</h3>
                  <p className="text-zinc-500 text-sm mt-1">{selectedCourse.description}</p>
                </div>
                <button onClick={() => setSelectedCourse(null)} className="p-2 bg-zinc-200 rounded-full">
                  <X size={20} />
                </button>
              </div>

              <div className="relative space-y-8 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-zinc-200">
                {(Array.isArray(selectedCourse.steps) ? selectedCourse.steps : JSON.parse(selectedCourse.steps)).map((step: any, idx: number) => (
                  <div key={idx} className="relative pl-10">
                    <div className="absolute left-0 top-1.5 w-6 h-6 rounded-full bg-white border-4 border-emerald-500 z-10" />
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-zinc-400 font-mono tracking-tighter">{step.time}</span>
                        <span className="text-[10px] font-bold text-zinc-500 bg-zinc-200 px-2 py-0.5 rounded-md uppercase">{step.duration}분</span>
                      </div>
                      <div className="bg-white p-4 rounded-2xl border border-zinc-100 shadow-sm">
                        <h4 className="font-bold text-zinc-900 text-sm tracking-tight">{step.place_name}</h4>
                        <p className="text-[11px] text-zinc-500 leading-relaxed mt-1">{step.activity}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <button onClick={() => setSelectedCourse(null)} className="w-full py-4 bg-zinc-900 text-white rounded-2xl font-bold mt-10 shadow-lg">닫기</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/90 backdrop-blur-xl border-t border-zinc-100 px-6 pt-4 pb-8 flex justify-between items-center z-50 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
        <NavButton active={false} onClick={() => router.push('/')} icon={<TrendingUp size={22} />} label="랭킹" />
        <NavButton active={false} onClick={() => router.push('/')} icon={<MapIcon size={22} />} label="지도" />
        <NavButton active={false} onClick={() => router.push('/')} icon={<ListIcon size={22} />} label="리스트" />
        <NavButton active={false} onClick={() => router.push('/')} icon={<Route size={22} />} label="AI 코스" />
      </nav>
    </div>
  );
}

function NavButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button onClick={onClick} className={cn("flex flex-col items-center gap-1 transition-all", active ? "text-emerald-600" : "text-zinc-400")}>
      <div className={cn("p-1 rounded-xl transition-all", active && "bg-emerald-50")}>{icon}</div>
      <span className="text-[10px] font-bold uppercase tracking-widest">{label}</span>
    </button>
  );
}
