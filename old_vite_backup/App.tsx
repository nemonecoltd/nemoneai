import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Map as MapIcon, 
  List as ListIcon, 
  Route as RouteIcon, 
  Filter, 
  Clock, 
  Users, 
  ChevronRight,
  MapPin,
  Search,
  Sparkles,
  Calendar,
  Ticket
} from 'lucide-react';
import { MOCK_STORES } from './constants';
import { PopupStore, Category, Companion, AITour } from './types';
import { generateWalkingTour } from './services/geminiService';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type Tab = 'map' | 'list' | 'tour';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('map');
  const [selectedCategories, setSelectedCategories] = useState<Category[]>([]);
  const [selectedCompanion, setSelectedCompanion] = useState<Companion>('Solo');
  const [generatedTour, setGeneratedTour] = useState<AITour | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const filteredStores = useMemo(() => {
    return MOCK_STORES.filter(store => {
      if (selectedCategories.length === 0) return true;
      return selectedCategories.includes(store.category);
    });
  }, [selectedCategories]);

  const handleGenerateTour = async () => {
    setIsGenerating(true);
    try {
      const tour = await generateWalkingTour(selectedCategories, selectedCompanion, MOCK_STORES);
      setGeneratedTour(tour);
      setActiveTab('tour');
    } catch (error) {
      console.error('Failed to generate tour:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-zinc-50 max-w-md mx-auto relative overflow-hidden shadow-2xl">
      {/* Header */}
      <header className="px-6 pt-8 pb-4 bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-zinc-100">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-bold font-display tracking-tight text-zinc-900">
            오늘 성수 <span className="text-emerald-500">.</span>
          </h1>
          <div className="flex gap-2">
            <button className="p-2 rounded-full bg-zinc-100 text-zinc-600 hover:bg-zinc-200 transition-colors">
              <Search size={20} />
            </button>
            <button className="p-2 rounded-full bg-zinc-100 text-zinc-600 hover:bg-zinc-200 transition-colors">
              <Users size={20} />
            </button>
          </div>
        </div>
        <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider">
          {new Date().toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })} • 실시간 성수동 가이드
        </p>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-24">
        <AnimatePresence mode="wait">
          {activeTab === 'map' && (
            <motion.div
              key="map"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="h-full relative"
            >
              <MapView stores={filteredStores} />
            </motion.div>
          )}

          {activeTab === 'list' && (
            <motion.div
              key="list"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-6 space-y-6"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold font-display">핫플레이스 리스트</h2>
                <button className="flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full">
                  <Filter size={14} /> 필터
                </button>
              </div>

              <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                {['Fashion', 'Beauty', 'Food', 'Life', 'Art'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategories(prev => 
                      prev.includes(cat as Category) ? prev.filter(c => c !== cat) : [...prev, cat as Category]
                    )}
                    className={cn(
                      "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all",
                      selectedCategories.includes(cat as Category)
                        ? "bg-zinc-900 text-white"
                        : "bg-white border border-zinc-200 text-zinc-600"
                    )}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div className="space-y-4">
                {filteredStores.map(store => (
                  <StoreCard key={store.id} store={store} />
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'tour' && (
            <motion.div
              key="tour"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-6 space-y-8"
            >
              {!generatedTour ? (
                <div className="space-y-8 py-10">
                  <div className="text-center space-y-4">
                    <div className="w-20 h-20 bg-emerald-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
                      <Sparkles className="text-emerald-500" size={40} />
                    </div>
                    <h2 className="text-2xl font-bold font-display">AI 맞춤형 도보 코스</h2>
                    <p className="text-zinc-500 text-sm leading-relaxed">
                      취향과 현재 위치, 대기 시간을 분석하여<br />
                      가장 효율적인 3시간 코스를 짜드려요.
                    </p>
                  </div>

                  <div className="space-y-6 bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm">
                    <div className="space-y-3">
                      <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">누구와 함께인가요?</label>
                      <div className="grid grid-cols-3 gap-2">
                        {(['Solo', 'Couple', 'Friends'] as Companion[]).map(comp => (
                          <button
                            key={comp}
                            onClick={() => setSelectedCompanion(comp)}
                            className={cn(
                              "py-3 rounded-2xl text-sm font-medium transition-all border",
                              selectedCompanion === comp
                                ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                                : "bg-zinc-50 border-transparent text-zinc-500"
                            )}
                          >
                            {comp === 'Solo' ? '혼자' : comp === 'Couple' ? '연인' : '친구'}
                          </button>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={handleGenerateTour}
                      disabled={isGenerating}
                      className="w-full py-4 bg-zinc-900 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-zinc-800 transition-all disabled:opacity-50"
                    >
                      {isGenerating ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          코스 설계 중...
                        </>
                      ) : (
                        <>
                          <Sparkles size={20} />
                          3시간 코스 만들기
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-8">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm">
                      <Sparkles size={16} /> AI 추천 코스
                    </div>
                    <h2 className="text-2xl font-bold font-display leading-tight">{generatedTour.title}</h2>
                    <p className="text-zinc-500 text-sm">{generatedTour.description}</p>
                  </div>

                  <div className="relative space-y-10 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-zinc-100">
                    {generatedTour.steps.map((step, idx) => {
                      const store = MOCK_STORES.find(s => s.id === step.storeId);
                      return (
                        <div key={idx} className="relative pl-10">
                          <div className="absolute left-0 top-1.5 w-6 h-6 rounded-full bg-white border-4 border-emerald-500 z-10" />
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-zinc-400 font-mono">{step.time}</span>
                              <span className="text-xs font-medium text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded-md">{step.duration}분 체류</span>
                            </div>
                            <div className="bg-white p-4 rounded-2xl border border-zinc-100 shadow-sm space-y-3">
                              <div className="flex gap-3">
                                <img 
                                  src={store?.imageUrl} 
                                  className="w-16 h-16 rounded-xl object-cover" 
                                  alt={store?.name}
                                  referrerPolicy="no-referrer"
                                />
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-bold text-zinc-900 truncate">{store?.name}</h4>
                                  <p className="text-xs text-zinc-500 line-clamp-1">{step.activity}</p>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <button className="flex-1 py-2 bg-zinc-900 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1">
                                  <Ticket size={14} /> 예약하기
                                </button>
                                <button className="flex-1 py-2 bg-zinc-100 text-zinc-600 text-xs font-bold rounded-lg flex items-center justify-center gap-1">
                                  <MapPin size={14} /> 길찾기
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <button 
                    onClick={() => setGeneratedTour(null)}
                    className="w-full py-4 text-zinc-400 text-sm font-medium"
                  >
                    코스 다시 만들기
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/90 backdrop-blur-xl border-t border-zinc-100 px-8 pt-4 pb-8 flex justify-between items-center z-50">
        <NavButton 
          active={activeTab === 'map'} 
          onClick={() => setActiveTab('map')} 
          icon={<MapIcon size={24} />} 
          label="지도" 
        />
        <NavButton 
          active={activeTab === 'list'} 
          onClick={() => setActiveTab('list')} 
          icon={<ListIcon size={24} />} 
          label="리스트" 
        />
        <NavButton 
          active={activeTab === 'tour'} 
          onClick={() => setActiveTab('tour')} 
          icon={<RouteIcon size={24} />} 
          label="AI 코스" 
        />
      </nav>
    </div>
  );
}

function NavButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-1 transition-all",
        active ? "text-emerald-600" : "text-zinc-400"
      )}
    >
      <div className={cn(
        "p-1 rounded-xl transition-all",
        active && "bg-emerald-50"
      )}>
        {icon}
      </div>
      <span className="text-[10px] font-bold uppercase tracking-widest">{label}</span>
    </button>
  );
}

function StoreCard({ store }: { store: PopupStore }) {
  const statusColor = {
    available: 'bg-emerald-500',
    waiting: 'bg-amber-500',
    closed: 'bg-rose-500'
  }[store.status];

  const statusText = {
    available: '입장 가능',
    waiting: '대기 필요',
    closed: '마감'
  }[store.status];

  return (
    <div className="bg-white rounded-3xl border border-zinc-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow group">
      <div className="relative h-48 overflow-hidden">
        <img 
          src={store.imageUrl} 
          alt={store.name} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          referrerPolicy="no-referrer"
        />
        <div className="absolute top-4 left-4 flex gap-2">
          <span className={cn("px-3 py-1 rounded-full text-[10px] font-bold text-white flex items-center gap-1.5", statusColor)}>
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            {statusText}
          </span>
          {store.waitTime > 0 && (
            <span className="px-3 py-1 rounded-full bg-black/50 backdrop-blur-md text-[10px] font-bold text-white flex items-center gap-1">
              <Clock size={12} /> {store.waitTime}분 대기
            </span>
          )}
        </div>
      </div>
      <div className="p-5 space-y-3">
        <div className="flex items-start justify-between">
          <div>
            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1 block">{store.category}</span>
            <h3 className="text-lg font-bold text-zinc-900">{store.name}</h3>
          </div>
          <button className="p-2 rounded-full bg-zinc-50 text-zinc-400">
            <ChevronRight size={20} />
          </button>
        </div>
        <p className="text-sm text-zinc-500 line-clamp-2 leading-relaxed">{store.description}</p>
        <div className="flex flex-wrap gap-1.5 pt-1">
          {store.tags.map(tag => (
            <span key={tag} className="text-[10px] font-medium text-zinc-400 bg-zinc-100 px-2 py-1 rounded-md">#{tag}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

function MapView({ stores }: { stores: PopupStore[] }) {
  return (
    <div className="w-full h-full bg-zinc-200 relative overflow-hidden">
      {/* Fake Map Background */}
      <div className="absolute inset-0 opacity-40 grayscale pointer-events-none">
        <img 
          src="https://picsum.photos/seed/seongsu-map/800/1200" 
          className="w-full h-full object-cover" 
          alt="Map Background"
          referrerPolicy="no-referrer"
        />
      </div>

      {/* Map Grid Lines */}
      <div className="absolute inset-0 grid grid-cols-6 grid-rows-10 pointer-events-none">
        {Array.from({ length: 60 }).map((_, i) => (
          <div key={i} className="border-[0.5px] border-zinc-300/30" />
        ))}
      </div>

      {/* Floating Markers */}
      {stores.map((store, idx) => {
        // Randomish positions for mock map
        const left = 20 + (idx * 15) % 60;
        const top = 20 + (idx * 12) % 60;
        
        const statusColor = {
          available: 'bg-emerald-500',
          waiting: 'bg-amber-500',
          closed: 'bg-rose-500'
        }[store.status];

        return (
          <motion.div
            key={store.id}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: idx * 0.1 }}
            className="absolute cursor-pointer group"
            style={{ left: `${left}%`, top: `${top}%` }}
          >
            <div className="relative">
              <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg transform group-hover:-translate-y-1 transition-all", statusColor)}>
                <MapPin className="text-white" size={20} />
              </div>
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 bg-inherit" />
              
              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                <div className="bg-zinc-900 text-white px-3 py-1.5 rounded-xl text-[10px] font-bold whitespace-nowrap shadow-xl">
                  {store.name}
                  {store.waitTime > 0 && <span className="ml-2 text-zinc-400">• {store.waitTime}분</span>}
                </div>
              </div>
            </div>
          </motion.div>
        );
      })}

      {/* Current Location Marker */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="w-6 h-6 bg-blue-500 rounded-full border-4 border-white shadow-lg relative">
          <div className="absolute inset-0 rounded-full bg-blue-400 animate-ping opacity-75" />
        </div>
      </div>

      {/* Map Controls */}
      <div className="absolute bottom-10 right-6 flex flex-col gap-2">
        <button className="w-12 h-12 bg-white rounded-2xl shadow-lg flex items-center justify-center text-zinc-600">
          <MapPin size={24} />
        </button>
        <button className="w-12 h-12 bg-white rounded-2xl shadow-lg flex items-center justify-center text-zinc-600">
          <Filter size={24} />
        </button>
      </div>

      {/* Floating Info Card */}
      <div className="absolute top-6 left-6 right-6">
        <div className="bg-white/80 backdrop-blur-md p-4 rounded-2xl border border-white/20 shadow-lg flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
            <Calendar size={24} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-zinc-900">지금 성수는 팝업 열풍!</h4>
            <p className="text-[10px] text-zinc-500 font-medium">현재 12개의 팝업스토어가 운영 중입니다.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
