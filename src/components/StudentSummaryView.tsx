import React, { useState, useEffect } from 'react';
import { Trophy, Award, Target, Calendar, Clock, Sparkles, Star, CheckCircle2, ArrowRight } from 'lucide-react';
import { Student, StudentSummary, TypingRecord } from '../types';
import { getRecentRecordsForStudent } from '../firebase';

interface StudentSummaryViewProps {
  student: Student | null;
  summary: StudentSummary | null;
  onSelectMission: () => void;
  onOpenAuth: () => void;
}

export const StudentSummaryView: React.FC<StudentSummaryViewProps> = ({
  student,
  summary,
  onSelectMission,
  onOpenAuth,
}) => {
  const [recentRecords, setRecentRecords] = useState<TypingRecord[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!student) return;
    setLoading(true);
    getRecentRecordsForStudent(student.studentKey, 8)
      .then((records) => setRecentRecords(records))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [student]);

  if (!student) {
    return (
      <div className="max-w-md mx-auto my-12 bg-white rounded-3xl p-8 border-4 border-sky-100 shadow-xl text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto shadow-inner">
          <Trophy className="w-9 h-9" />
        </div>
        <h2 className="text-2xl font-black text-slate-800 font-['Jua',sans-serif]">학생 로그인이 필요해요</h2>
        <p className="text-sm text-slate-500 font-medium">
          로그인하면 내 타수 기록과 달성한 미션 칭호를 언제든 확인하고 다른 컴퓨터에서도 이어갈 수 있어요!
        </p>
        <button
          onClick={onOpenAuth}
          className="w-full py-3.5 bg-gradient-to-r from-sky-400 to-indigo-500 hover:from-sky-500 hover:to-indigo-600 text-white font-black rounded-2xl shadow-md text-base font-['Jua',sans-serif] cursor-pointer transition hover:scale-102"
        >
          학생 로그인하기
        </button>
      </div>
    );
  }

  const completed = summary?.completedMissions || [];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 학생 개인 프로필 배너 */}
      <div className="bg-gradient-to-r from-sky-400 via-sky-500 to-indigo-500 rounded-3xl p-6 md:p-8 text-white shadow-lg flex flex-wrap items-center justify-between gap-6">
        <div className="space-y-2">
          <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-bold backdrop-blur-md">
            2026학년도 4학년 국어 타자 명예의 전당
          </span>
          <h1 className="text-2xl md:text-3xl font-black font-['Jua',sans-serif]">
            4-{student.classNum}반 {student.studentNum}번 {student.name} 학생의 기록장
          </h1>
          <p className="text-xs md:text-sm text-sky-100 font-medium">
            꾸준히 연습하여 더욱 빠르고 정확한 국어 타자 실력을 길러보세요!
          </p>
        </div>

        <button
          onClick={onSelectMission}
          className="px-6 py-3.5 bg-yellow-400 hover:bg-yellow-300 text-amber-950 font-black rounded-2xl shadow-md font-['Jua',sans-serif] text-base flex items-center gap-2 cursor-pointer transition hover:scale-105"
        >
          <span>지금 미션 도전하기</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* 요약 통계 3종 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-3xl border-2 border-sky-100 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <div className="text-xs font-bold text-slate-500">최고 타수 (CPM)</div>
            <div className="text-3xl font-black text-amber-500 font-['Jua',sans-serif]">
              {summary?.maxCpm || 0} <span className="text-sm font-normal text-slate-400">타</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center font-black">
            <Trophy className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border-2 border-sky-100 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <div className="text-xs font-bold text-slate-500">평균 정확도</div>
            <div className="text-3xl font-black text-emerald-500 font-['Jua',sans-serif]">
              {summary?.avgAccuracy || 0}%
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-black">
            <Target className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border-2 border-sky-100 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <div className="text-xs font-bold text-slate-500">총 미션 연습 횟수</div>
            <div className="text-3xl font-black text-sky-600 font-['Jua',sans-serif]">
              {summary?.totalPlays || 0} <span className="text-sm font-normal text-slate-400">회</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-sky-100 text-sky-600 flex items-center justify-center font-black">
            <Sparkles className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* 미션 배지 목록 */}
      <div className="bg-white rounded-3xl p-6 border-2 border-sky-100 shadow-sm space-y-4">
        <h2 className="text-lg font-black text-slate-800 font-['Jua',sans-serif] flex items-center gap-2">
          <Award className="w-5 h-5 text-indigo-600" />
          내가 획득한 미션 칭호 배지
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div
            className={`p-4 rounded-2xl border-2 flex items-center gap-3 ${
              completed.includes('acid_rain')
                ? 'bg-sky-50 border-sky-300 text-sky-900'
                : 'bg-slate-50 border-slate-200 text-slate-400 opacity-60'
            }`}
          >
            <div className="w-12 h-12 rounded-xl bg-sky-200 text-sky-700 flex items-center justify-center text-xl">
              🌧️
            </div>
            <div>
              <div className="font-black font-['Jua',sans-serif] text-base">산성비 격파왕</div>
              <div className="text-xs">4학년 국어 낱말 20개 클리어</div>
            </div>
          </div>

          <div
            className={`p-4 rounded-2xl border-2 flex items-center gap-3 ${
              completed.includes('target_cpm')
                ? 'bg-amber-50 border-amber-300 text-amber-900'
                : 'bg-slate-50 border-slate-200 text-slate-400 opacity-60'
            }`}
          >
            <div className="w-12 h-12 rounded-xl bg-amber-200 text-amber-700 flex items-center justify-center text-xl">
              🎯
            </div>
            <div>
              <div className="font-black font-['Jua',sans-serif] text-base">속담 타수 달인</div>
              <div className="text-xs">목표 타수 초과 달성 성공</div>
            </div>
          </div>

          <div
            className={`p-4 rounded-2xl border-2 flex items-center gap-3 ${
              completed.includes('zero_error')
                ? 'bg-indigo-50 border-indigo-300 text-indigo-900'
                : 'bg-slate-50 border-slate-200 text-slate-400 opacity-60'
            }`}
          >
            <div className="w-12 h-12 rounded-xl bg-indigo-200 text-indigo-700 flex items-center justify-center text-xl">
              🛡️
            </div>
            <div>
              <div className="font-black font-['Jua',sans-serif] text-base">맞춤법 오탈자 제로 마스터</div>
              <div className="text-xs">오타 없이 100% 퍼펙트 완성</div>
            </div>
          </div>
        </div>
      </div>

      {/* 최근 연습 기록 목록 (Firestore에서 조회) */}
      <div className="bg-white rounded-3xl p-6 border-2 border-sky-100 shadow-sm space-y-4">
        <h2 className="text-lg font-black text-slate-800 font-['Jua',sans-serif] flex items-center gap-2">
          <Clock className="w-5 h-5 text-sky-600" />
          최근 타자 연습 기록 (Firestore 클라우드 동기화)
        </h2>

        {loading ? (
          <div className="py-8 text-center text-xs text-slate-400">기록을 불러오는 중...</div>
        ) : recentRecords.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            아직 완료한 연습 기록이 없습니다. 지금 미션에 도전해 보세요!
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {recentRecords.map((rec) => {
              const missionName =
                rec.missionType === 'acid_rain'
                  ? '단어 산성비 게임'
                  : rec.missionType === 'target_cpm'
                  ? '타수 목표 달성'
                  : '오탈자 제로 미션';

              return (
                <div key={rec.id} className="py-3 flex items-center justify-between text-sm">
                  <div className="space-y-0.5">
                    <div className="font-bold text-slate-800 flex items-center gap-2">
                      <span>{missionName}</span>
                      {rec.isSuccess ? (
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-extrabold">
                          성공
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-[10px] font-semibold">
                          완료
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {new Date(rec.timestamp).toLocaleString('ko-KR')}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-right">
                    <div>
                      <div className="font-black text-amber-600 font-['Jua',sans-serif] text-base">
                        {rec.cpm} 타
                      </div>
                      <div className="text-[11px] text-slate-400">정확도 {rec.accuracy}%</div>
                    </div>
                    <div className="font-black text-sky-600 font-['Jua',sans-serif] text-sm">
                      +{rec.score}점
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
