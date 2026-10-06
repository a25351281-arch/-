import React from 'react';
import { Crown, Volume2, VolumeX, Shield, User, LogOut, Award, Sparkles } from 'lucide-react';
import { Student } from '../types';

interface NavbarProps {
  currentStudent: Student | null;
  onOpenAuth: () => void;
  onLogout: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  currentView: 'missions' | 'summary' | 'teacher';
  onChangeView: (view: 'missions' | 'summary' | 'teacher') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentStudent,
  onOpenAuth,
  onLogout,
  soundEnabled,
  onToggleSound,
  currentView,
  onChangeView,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b-2 border-sky-100 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        {/* 로고 및 앱 타이틀 */}
        <button
          onClick={() => onChangeView('missions')}
          className="flex items-center gap-2.5 text-left group cursor-pointer transition hover:opacity-90"
        >
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-sky-400 via-sky-500 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-sky-200 group-hover:scale-105 transition-transform">
            <Crown className="w-6 h-6 text-yellow-300 fill-yellow-300 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xl md:text-2xl font-black text-sky-900 tracking-tight font-['Jua',sans-serif]">
                4학년 국어 타자 왕
              </span>
              <span className="px-2 py-0.5 text-xs font-bold bg-amber-100 text-amber-800 rounded-full border border-amber-200">
                2026 국어
              </span>
            </div>
            <p className="text-xs text-sky-600 font-medium">초등 4학년 어휘 · 속담 · 맞춤법 미션</p>
          </div>
        </button>

        {/* 네비게이션 탭 */}
        <div className="flex items-center gap-1.5 bg-sky-50/80 p-1 rounded-2xl border border-sky-100">
          <button
            onClick={() => onChangeView('missions')}
            className={`px-3.5 py-1.5 rounded-xl font-bold text-sm transition flex items-center gap-1.5 cursor-pointer ${
              currentView === 'missions'
                ? 'bg-sky-500 text-white shadow-sm'
                : 'text-sky-800 hover:bg-sky-100/60'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            타자 미션
          </button>
          <button
            onClick={() => onChangeView('summary')}
            className={`px-3.5 py-1.5 rounded-xl font-bold text-sm transition flex items-center gap-1.5 cursor-pointer ${
              currentView === 'summary'
                ? 'bg-sky-500 text-white shadow-sm'
                : 'text-sky-800 hover:bg-sky-100/60'
            }`}
          >
            <Award className="w-4 h-4" />
            나의 성취도
          </button>
          <button
            onClick={() => onChangeView('teacher')}
            className={`px-3.5 py-1.5 rounded-xl font-bold text-sm transition flex items-center gap-1.5 cursor-pointer ${
              currentView === 'teacher'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-indigo-800 hover:bg-indigo-50'
            }`}
          >
            <Shield className="w-4 h-4" />
            선생님 방
          </button>
        </div>

        {/* 유저 상태 및 사운드 토글 */}
        <div className="flex items-center gap-2">
          {/* 소리 ON/OFF 버튼 */}
          <button
            onClick={onToggleSound}
            title={soundEnabled ? '소리 끄기' : '소리 켜기'}
            className="p-2.5 rounded-xl border border-sky-200 bg-sky-50/60 text-sky-700 hover:bg-sky-100 transition cursor-pointer"
          >
            {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5 text-slate-400" />}
          </button>

          {currentStudent ? (
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 pl-3 pr-1.5 py-1 rounded-2xl shadow-sm">
              <div className="flex items-center gap-1.5 text-sm">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                <span className="font-extrabold text-amber-950 font-['Jua',sans-serif]">
                  4-{currentStudent.classNum}반 {currentStudent.studentNum}번
                </span>
                <span className="font-bold text-slate-700">{currentStudent.name}</span>
              </div>
              <button
                onClick={onLogout}
                title="로그아웃"
                className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="px-4 py-2 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-amber-950 font-black rounded-2xl shadow-sm shadow-amber-200 flex items-center gap-1.5 text-sm cursor-pointer transition hover:scale-102"
            >
              <User className="w-4 h-4" />
              학생 로그인
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
