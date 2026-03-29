"use client";

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Camera, Loader2, Save, User, Globe } from 'lucide-react';

export default function EditProfilePage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  
  const [name, setName] = useState('');
  const [gender, setGender] = useState('');
  const [age, setAge] = useState('');
  const [nationality, setNationality] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (session?.user?.email) {
      fetchProfile();
    }
  }, [session, status]);

  const fetchProfile = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api-now/users/${session?.user?.email}/profile`);
      if (res.ok) {
        const data = await res.json();
        setName(data.name || '');
        setGender(data.gender || '');
        setAge(data.age || '');
        setNationality(data.nationality || '');
        setImageUrl(data.image_url || session?.user?.image || '');
        setPreviewUrl(data.image_url || session?.user?.image || '');
      }
    } catch (e) {
      console.error('Failed to fetch profile', e);
    } finally {
      setIsLoading(false);
    }
  };

  const compressImage = (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 400;
          const MAX_HEIGHT = 400;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          canvas.toBlob((blob) => {
            if (blob) resolve(blob);
            else reject(new Error('Canvas to Blob failed'));
          }, 'image/jpeg', 0.8);
        };
      };
      reader.onerror = error => reject(error);
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError('');
    let finalImageUrl = imageUrl;

    try {
      // 1. Upload new image if selected
      if (selectedFile) {
        const compressedBlob = await compressImage(selectedFile);
        const formData = new FormData();
        formData.append('file', compressedBlob, selectedFile.name);

        const uploadRes = await fetch('/api-now/upload/profile', {
          method: 'POST',
          body: formData,
        });

        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          // Use /api-now prefix to leverage Next.js rewrites for image display
          finalImageUrl = `/api-now${uploadData.url}`;
        } else {
          throw new Error('Failed to upload image');
        }
      }

      // 2. Update user profile
      const updateRes = await fetch(`/api-now/users/${session?.user?.email}/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          gender: gender || null,
          age: age || null,
          nationality: nationality || null,
          image_url: finalImageUrl
        }),
      });

      if (!updateRes.ok) throw new Error('Failed to update profile');

      // 3. Update NextAuth session if needed
      if (update) {
        await update({ name, image: finalImageUrl });
      }
      
      router.push('/my');
      router.refresh();
      
    } catch (e: any) {
      setError(e.message || '저장 중 오류가 발생했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading || status === 'loading') {
    return <div className="min-h-screen flex items-center justify-center bg-zinc-50"><Loader2 className="animate-spin text-emerald-500 w-8 h-8" /></div>;
  }

  return (
    <div className="min-h-screen bg-zinc-50 max-w-md mx-auto shadow-2xl border-x border-zinc-200 pb-20">
      <header className="sticky top-0 bg-white/80 backdrop-blur-md z-50 border-b border-zinc-100 px-6 py-4 flex items-center gap-4">
        <button onClick={() => router.back()} className="p-2 -ml-2 hover:bg-zinc-100 rounded-full transition-colors text-zinc-600">
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-lg font-bold font-display tracking-tight text-zinc-900">프로필 수정</h1>
      </header>

      <main className="p-6 space-y-8">
        {error && (
          <div className="p-4 bg-rose-50 text-rose-600 text-sm font-bold rounded-2xl text-center">
            {error}
          </div>
        )}

        {/* Profile Image */}
        <div className="flex flex-col items-center">
          <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
            <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-emerald-50 shadow-lg bg-zinc-100">
              <img src={previewUrl || "https://picsum.photos/200"} alt="Profile" className="w-full h-full object-cover" />
            </div>
            <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera className="text-white w-8 h-8" />
            </div>
            <div className="absolute bottom-0 right-0 p-2 bg-emerald-500 rounded-full border-2 border-white shadow-sm text-white">
              <Camera size={14} />
            </div>
          </div>
          <p className="text-[10px] font-bold text-zinc-400 mt-4 uppercase tracking-widest">사진 변경 (최적화 적용)</p>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept="image/*" 
            className="hidden" 
          />
        </div>

        {/* Form Fields */}
        <div className="bg-white p-6 rounded-[32px] border border-zinc-100 shadow-sm space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest pl-2">이름</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl pl-12 pr-4 py-4 text-sm font-medium text-zinc-900 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                placeholder="홍길동"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest pl-2">성별</label>
              <select
                value={gender}
                onChange={e => setGender(e.target.value)}
                className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-4 py-4 text-sm font-medium text-zinc-900 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
              >
                <option value="">선택 안함</option>
                <option value="male">남성</option>
                <option value="female">여성</option>
                <option value="other">기타</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest pl-2">연령대</label>
              <select
                value={age}
                onChange={e => setAge(e.target.value)}
                className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-4 py-4 text-sm font-medium text-zinc-900 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
              >
                <option value="">선택 안함</option>
                <option value="10s">10대</option>
                <option value="20s">20대</option>
                <option value="30s">30대</option>
                <option value="40s">40대 이상</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest pl-2">국적</label>
            <div className="relative">
              <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
              <input
                type="text"
                value={nationality}
                onChange={e => setNationality(e.target.value)}
                className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl pl-12 pr-4 py-4 text-sm font-medium text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                placeholder="예: Korea, USA..."
              />
            </div>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full bg-zinc-900 text-white rounded-2xl py-4 font-bold flex items-center justify-center gap-2 hover:bg-emerald-600 transition-all shadow-xl disabled:opacity-50 disabled:hover:bg-zinc-900 mt-8"
        >
          {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : (
            <>저장하기 <Save size={18} /></>
          )}
        </button>

        <div className="mt-12 text-center">
          <button 
            onClick={async () => {
              if (confirm("정말 탈퇴하시겠습니까? 찜한 장소 및 코스 데이터가 모두 삭제되며 복구할 수 없습니다.")) {
                try {
                  const res = await fetch(`/api-now/users/${session?.user?.email}`, { method: 'DELETE' });
                  if (res.ok) {
                    alert("그동안 이용해주셔서 감사합니다.");
                    // next-auth session kill and redirect
                    const { signOut } = await import('next-auth/react');
                    signOut({ callbackUrl: '/' });
                  } else {
                    alert("탈퇴 처리 중 오류가 발생했습니다.");
                  }
                } catch (e) {
                  alert("오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
                }
              }
            }}
            className="text-xs font-bold text-zinc-400 hover:text-rose-500 hover:underline transition-colors"
          >
            회원 탈퇴하기
          </button>
        </div>
      </main>
    </div>
  );
}
