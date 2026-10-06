import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, Award, CheckCircle2, XCircle, RotateCcw, ListFilter, CloudCheck, Sparkles, BookOpen } from 'lucide-react';
import { TypingRecord } from '../types';

interface ResultModalProps {
  record: TypingRecord;
  saveStatus: 'saving' | 'saved' | 'error';
  onRetry: () => void;
  onGoHome: () => void;
}

export const ResultModal: React.FC<ResultModalProps> = ({
  record,
  saveStatus,
  onRetry,
  onGoHome,
}) => {
  useEffect(() => {
    if (record.isSuccess) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  }, [record.isSuccess]);

  const missionName =
    record.missionType === 'acid_rain'
      ? '단어 산성비 게임'
      : record.missionType === 'target_cpm'
      ? '타수 목표 달성'
      : '오탈자 제로 미션';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border-4 border-sky-100 overflow-hidden">
        {/* 모달 상단 배너 */}
        <div
          className={`p-6 text-white text-center flex flex-col items-center justify-center relative ${
            record.isSuccess
              ? 'bg-gradient-to-b from-amber-400 via-amber-500 to-yellow-500'
              : 'bg-gradient-to-b from-sky-400 to-indigo-500'
          }`}
        >
          <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center mb-3 shadow-inner">
            {record.isSuccess ? (
              <Trophy className="w-12 h-12 text-yellow-100 fill-yellow-200 animate-bounce" />
            ) : (
              <Award className="w-12 h-12 text-white" />
            )}
          </div>

          <h3 className="text-2xl md:text-3xl font-black font-['Jua',sans-serif] tracking-tight">
            {record.isSuccess ? '🎉 미션 완수 대성공!' : '💪 멋진 도전이었어요!'}
          </h3>
          <p className="text-sm text-white/90 font-semibold mt-1">
            [{missionName}] {record.isSuccess ? '훌륭한 실력으로 미션을 완료했습니다!' : '조금만 더 연습하면 금방 달성할 수 있어요!'}
          </p>

          {/* 저장 상태 배지 */}
          <div className="mt-3 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 bg-black/20 text-white backdrop-blur-md">
            {saveStatus === 'saving' && <span>☁️ 기록을 안전하게 저장하는 중...</span>}
            {saveStatus === 'saved' && <span>✅ Firestore 클라우드 저장 완료!</span>}
            {saveStatus === 'error' && <span>⚠️ 저장하지 못했어요. 잠시 후 다시 시도해 주세요.</span>}
          </div>
        </div>

        {/* 결과 통계 카드 */}
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-sky-50 p-3.5 rounded-2xl border border-sky-100">
              <div className="text-xs text-sky-700 font-bold">최종 점수</div>
              <div className="text-2xl font-black text-sky-800 font-['Jua',sans-serif] mt-1">
                {record.score} <span className="text-xs font-normal">점</span>
              </div>
            </div>
            <div className="bg-amber-50 p-3.5 rounded-2xl border border-amber-100">
              <div className="text-xs text-amber-700 font-bold">타수 (CPM)</div>
              <div className="text-2xl font-black text-amber-800 font-['Jua',sans-serif] mt-1">
                {record.cpm} <span className="text-xs font-normal">타</span>
              </div>
            </div>
            <div className="bg-emerald-50 p-3.5 rounded-2xl border border-emerald-100">
              <div className="text-xs text-emerald-700 font-bold">정확도</div>
              <div className="text-2xl font-black text-emerald-800 font-['Jua',sans-serif] mt-1">
                {record.accuracy}%
              </div>
            </div>
          </div>

          {/* 오답 및 피드백 노트 */}
          {record.mistakes && record.mistakes.length > 0 ? (
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                <BookOpen className="w-4 h-4 text-sky-600" />
                <span>복습하기 (놓치거나 오타가 난 낱말/문장)</span>
              </div>
              <ul className="text-xs text-slate-600 space-y-1 max-h-32 overflow-y-auto pr-2">
                {record.mistakes.slice(0, 5).map((m, idx) => (
                  <li key={idx} className="bg-white p-2 rounded-xl border border-slate-100 font-medium">
                    • {m}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="bg-emerald-50 p-3.5 rounded-2xl border border-emerald-200 text-center text-xs font-bold text-emerald-800 flex items-center justify-center gap-1.5">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>오탈자 없이 퍼펙트하게 완수했습니다! 정말 대단해요!</span>
            </div>
          )}

          {/* 버튼 영역 */}
          <div className="flex gap-3">
            <button
              onClick={onRetry}
              className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl text-base flex items-center justify-center gap-1.5 transition cursor-pointer font-['Jua',sans-serif]"
            >
              <RotateCcw className="w-4 h-4" />
              다시 도전
            </button>
            <button
              onClick={onGoHome}
              className="flex-2 py-3.5 bg-sky-500 hover:bg-sky-600 text-white font-black rounded-2xl shadow-md shadow-sky-200 text-base flex items-center justify-center gap-1.5 transition cursor-pointer font-['Jua',sans-serif]"
            >
              미션 선택으로 가기 🚀
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
