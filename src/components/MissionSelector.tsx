import React from 'react';
import { CloudRain, Target, ShieldCheck, Trophy, Sparkles, Star, CheckCircle2, Flame, ArrowRight } from 'lucide-react';
import { MissionType, Student, StudentSummary } from '../types';

interface MissionSelectorProps {
  currentStudent: Student | null;
  summary: StudentSummary | null;
  onSelectMission: (mission: MissionType) => void;
  onOpenAuth: () => void;
}

export const MissionSelector: React.FC<MissionSelectorProps> = ({
  currentStudent,
  summary,
  onSelectMission,
  onOpenAuth,
}) => {
  const completedMissions = summary?.completedMissions || [];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* 상단 웰컴 배너 */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-sky-400 via-sky-500 to-indigo-500 p-6 md:p-8 text-white shadow-xl shadow-sky-200">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-xs font-black backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
              <span>초등학교 4학년 1학기 · 2학기 국어 교과 연계</span>
            </div>
            <h1 className="text-2xl md:text-4xl font-black font-['Jua',sans-serif] tracking-tight">
              {currentStudent ? (
                <span>
                  반가워요, <span className="text-yellow-300 underline underline-offset-4 decoration-wavy decoration-yellow-300">{currentStudent.name}</span> 대장님!
                </span>
              ) : (
                <span>4학년 국어 타자 왕에 도전해 보세요!</span>
              )}
            </h1>
            <p className="text-sm md:text-base text-sky-100 max-w-xl font-medium">
              신나는 게임과 재미있는 미션으로 4학년 필수 국어 낱말, 지혜로운 속담, 헷갈리는 맞춤법을 익히고 타자 실력을 쑥쑥 키워요!
            </p>
          </div>

          {/* 학생 통계 뱃지 또는 로그인 안내 */}
          {currentStudent ? (
            <div className="bg-white/15 backdrop-blur-md border border-white/30 rounded-2xl p-4 flex items-center gap-4 shrink-0 shadow-inner">
              <div className="text-center px-2">
                <div className="text-xs text-sky-100 font-semibold">최고 타수</div>
                <div className="text-2xl md:text-3xl font-black text-yellow-300 font-['Jua',sans-serif]">
                  {summary?.maxCpm || 0} <span className="text-xs text-white">타</span>
                </div>
              </div>
              <div className="h-8 w-px bg-white/30" />
              <div className="text-center px-2">
                <div className="text-xs text-sky-100 font-semibold">평균 정확도</div>
                <div className="text-2xl md:text-3xl font-black text-emerald-300 font-['Jua',sans-serif]">
                  {summary?.avgAccuracy || 0}<span className="text-xs text-white">%</span>
                </div>
              </div>
              <div className="h-8 w-px bg-white/30" />
              <div className="text-center px-2">
                <div className="text-xs text-sky-100 font-semibold">완료 미션</div>
                <div className="text-2xl md:text-3xl font-black text-amber-200 font-['Jua',sans-serif]">
                  {completedMissions.length}<span className="text-xs text-white">/3</span>
                </div>
              </div>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="bg-white text-sky-800 hover:bg-yellow-300 hover:text-amber-950 px-6 py-3.5 rounded-2xl font-black text-base shadow-lg transition-transform hover:scale-105 flex items-center gap-2 cursor-pointer font-['Jua',sans-serif]"
            >
              <Trophy className="w-5 h-5 text-amber-500" />
              내 이름으로 기록 저장하기
            </button>
          )}
        </div>

        {/* 배경 데코레이션 원 */}
        <div className="absolute -right-12 -bottom-12 w-64 h-64 rounded-full bg-white/10 pointer-events-none" />
        <div className="absolute -left-12 -top-12 w-48 h-48 rounded-full bg-white/10 pointer-events-none" />
      </div>

      {/* 미션 선택 카드 그리드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 미션 1: 단어 산성비 게임 */}
        <div className="group relative bg-white rounded-3xl p-6 border-4 border-sky-100 hover:border-sky-300 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden">
          {completedMissions.includes('acid_rain') && (
            <div className="absolute top-4 right-4 bg-emerald-100 text-emerald-800 text-xs font-black px-2.5 py-1 rounded-full flex items-center gap-1 border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              완료함
            </div>
          )}

          <div className="space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-sky-100 text-sky-600 flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner">
              <CloudRain className="w-9 h-9" />
            </div>

            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-sky-600 mb-1">
                <span>미션 1</span>
                <span>•</span>
                <span>4학년 필수 어휘</span>
              </div>
              <h2 className="text-2xl font-black text-slate-800 font-['Jua',sans-serif] group-hover:text-sky-600 transition-colors">
                단어 산성비 게임
              </h2>
            </div>

            <p className="text-slate-600 text-sm leading-relaxed font-medium">
              하늘에서 비처럼 쏟아지는 4학년 국어 낱말을 바닥에 닿기 전에 재빠르게 입력하여 팡팡 터뜨려요!
            </p>

            <div className="bg-sky-50 p-3 rounded-2xl border border-sky-100 space-y-1.5 text-xs text-sky-800 font-semibold">
              <div className="flex items-center gap-1.5">
                <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                목숨 5개, 20단어 격파 시 성공
              </div>
              <div className="flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
                연속 성공 시 콤보 보너스 점수!
              </div>
            </div>
          </div>

          <button
            onClick={() => onSelectMission('acid_rain')}
            className="mt-6 w-full py-3.5 bg-sky-500 hover:bg-sky-600 text-white font-black rounded-2xl shadow-md shadow-sky-200 flex items-center justify-center gap-2 text-base font-['Jua',sans-serif] cursor-pointer transition group-hover:shadow-lg"
          >
            <span>산성비 게임 시작</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* 미션 2: 타수 목표 달성! */}
        <div className="group relative bg-white rounded-3xl p-6 border-4 border-amber-100 hover:border-amber-300 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden">
          {completedMissions.includes('target_cpm') && (
            <div className="absolute top-4 right-4 bg-emerald-100 text-emerald-800 text-xs font-black px-2.5 py-1 rounded-full flex items-center gap-1 border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              완료함
            </div>
          )}

          <div className="space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner">
              <Target className="w-9 h-9" />
            </div>

            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-600 mb-1">
                <span>미션 2</span>
                <span>•</span>
                <span>속담 및 교과서 문장</span>
              </div>
              <h2 className="text-2xl font-black text-slate-800 font-['Jua',sans-serif] group-hover:text-amber-600 transition-colors">
                타수 목표 달성!
              </h2>
            </div>

            <p className="text-slate-600 text-sm leading-relaxed font-medium">
              옛 조상들의 지혜가 담긴 4학년 속담과 교과서 문장을 바르게 입력하고 목표 타수(250타 이상)를 돌파해 보세요!
            </p>

            <div className="bg-amber-50 p-3 rounded-2xl border border-amber-100 space-y-1.5 text-xs text-amber-800 font-semibold">
              <div className="flex items-center gap-1.5">
                <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                목표 타수 선택 (150~300타)
              </div>
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                음절별 실시간 색상 피드백 & 속도계
              </div>
            </div>
          </div>

          <button
            onClick={() => onSelectMission('target_cpm')}
            className="mt-6 w-full py-3.5 bg-amber-500 hover:bg-amber-600 text-white font-black rounded-2xl shadow-md shadow-amber-200 flex items-center justify-center gap-2 text-base font-['Jua',sans-serif] cursor-pointer transition group-hover:shadow-lg"
          >
            <span>타수 목표 도전하기</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* 미션 3: 오탈자 제로 미션! */}
        <div className="group relative bg-white rounded-3xl p-6 border-4 border-indigo-100 hover:border-indigo-300 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden">
          {completedMissions.includes('zero_error') && (
            <div className="absolute top-4 right-4 bg-emerald-100 text-emerald-800 text-xs font-black px-2.5 py-1 rounded-full flex items-center gap-1 border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              완료함
            </div>
          )}

          <div className="space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner">
              <ShieldCheck className="w-9 h-9" />
            </div>

            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 mb-1">
                <span>미션 3</span>
                <span>•</span>
                <span>맞춤법 100% 퍼펙트</span>
              </div>
              <h2 className="text-2xl font-black text-slate-800 font-['Jua',sans-serif] group-hover:text-indigo-600 transition-colors">
                오탈자 제로 미션!
              </h2>
            </div>

            <p className="text-slate-600 text-sm leading-relaxed font-medium">
              4학년에서 가장 헷갈리는 맞춤법 문장을 단 한 번의 오타도 없이 정확도 100%로 완성하는 고난도 집중력 미션!
            </p>

            <div className="bg-indigo-50 p-3 rounded-2xl border border-indigo-100 space-y-1.5 text-xs text-indigo-800 font-semibold">
              <div className="flex items-center gap-1.5">
                <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                3개 문장 오탈자 0개 달성 목표
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                맞춤법 집중력 왕 칭호 수여
              </div>
            </div>
          </div>

          <button
            onClick={() => onSelectMission('zero_error')}
            className="mt-6 w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl shadow-md shadow-indigo-200 flex items-center justify-center gap-2 text-base font-['Jua',sans-serif] cursor-pointer transition group-hover:shadow-lg"
          >
            <span>오탈자 제로 도전하기</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
};
