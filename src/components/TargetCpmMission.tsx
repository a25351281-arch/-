import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Target, Sparkles, CheckCircle2, AlertCircle, Gauge, Trophy } from 'lucide-react';
import { PROVERB_SENTENCES } from '../data/curriculumData';
import { SentenceItem, TypingRecord } from '../types';
import {
  calculateCPM,
  calculateAccuracy,
  playKeyClickSound,
  playPopSound,
  playErrorSound,
  playSuccessFanfare,
} from '../koreanUtils';

interface TargetCpmMissionProps {
  onBack: () => void;
  onFinishGame: (record: Omit<TypingRecord, 'id' | 'studentKey' | 'studentName'>) => void;
}

export const TargetCpmMission: React.FC<TargetCpmMissionProps> = ({ onBack, onFinishGame }) => {
  const [targetCpm, setTargetCpm] = useState<number>(250);
  const [sentences] = useState<SentenceItem[]>(() => {
    // 5개의 속담 및 교과서 문장 무작위 선정
    return [...PROVERB_SENTENCES].sort(() => Math.random() - 0.5).slice(0, 5);
  });

  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [inputVal, setInputVal] = useState<string>('');
  const [sentenceStats, setSentenceStats] = useState<{ cpm: number; accuracy: number }[]>([]);
  const [mistakes, setMistakes] = useState<string[]>([]);

  const sentenceStartTimeRef = useRef<number>(Date.now());
  const inputRef = useRef<HTMLInputElement>(null);
  const isComposingRef = useRef<boolean>(false);

  const currentSentence = sentences[currentIndex];

  useEffect(() => {
    sentenceStartTimeRef.current = Date.now();
    setInputVal('');
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [currentIndex]);

  // 실시간 계산
  const elapsedSec = Math.max((Date.now() - sentenceStartTimeRef.current) / 1000, 0.4);
  const liveCPM = calculateCPM(inputVal, elapsedSec);
  const liveAccuracy = calculateAccuracy(currentSentence?.sentence || '', inputVal);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputVal(val);
    playKeyClickSound();
  };

  // 문장 완료 처리
  const handleSentenceComplete = () => {
    const target = currentSentence.sentence;
    const finalElapsed = Math.max((Date.now() - sentenceStartTimeRef.current) / 1000, 0.5);
    const finalSentenceCpm = calculateCPM(inputVal, finalElapsed);
    const finalSentenceAcc = calculateAccuracy(target, inputVal);

    if (finalSentenceAcc < 90) {
      setMistakes((prev) => [...prev, `${target} (입력: ${inputVal})`]);
    }

    const nextStats = [...sentenceStats, { cpm: finalSentenceCpm, accuracy: finalSentenceAcc }];
    setSentenceStats(nextStats);

    if (currentIndex + 1 < sentences.length) {
      playPopSound();
      setCurrentIndex((i) => i + 1);
    } else {
      // 모든 문장 완료!
      const avgCpm = Math.round(nextStats.reduce((sum, s) => sum + s.cpm, 0) / nextStats.length);
      const avgAcc = Math.round(nextStats.reduce((sum, s) => sum + s.accuracy, 0) / nextStats.length);
      const isSuccess = avgCpm >= targetCpm && avgAcc >= 85;

      if (isSuccess) {
        playSuccessFanfare();
      }

      onFinishGame({
        missionType: 'target_cpm',
        cpm: avgCpm,
        accuracy: avgAcc,
        isSuccess,
        score: avgCpm * 2 + (isSuccess ? 300 : 50),
        mistakes,
        timestamp: new Date().toISOString(),
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (inputVal.trim().length > 0) {
        handleSentenceComplete();
      }
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 헤더 바 */}
      <div className="bg-white rounded-3xl p-5 shadow-sm border-2 border-amber-100 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
            title="미션 목록으로"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-xl font-black text-amber-950 font-['Jua',sans-serif] flex items-center gap-2">
              <span>🎯 타수 목표 달성 미션!</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold">
                문장 {currentIndex + 1} / {sentences.length}
              </span>
            </h2>
            <p className="text-xs text-slate-500 font-medium">4학년 속담과 교과서 문장을 입력하고 목표 타수를 넘겨보세요!</p>
          </div>
        </div>

        {/* 목표 타수 선택 버튼군 */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500">목표 타수:</span>
          <div className="flex items-center gap-1 bg-amber-50 p-1 rounded-2xl border border-amber-200">
            {[150, 200, 250, 300].map((cpm) => (
              <button
                key={cpm}
                onClick={() => setTargetCpm(cpm)}
                className={`px-3 py-1.5 rounded-xl font-black text-xs transition cursor-pointer font-['Jua',sans-serif] ${
                  targetCpm === cpm
                    ? 'bg-amber-500 text-white shadow-sm'
                    : 'text-amber-800 hover:bg-amber-100'
                }`}
              >
                {cpm}타
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 진행 상황 및 속도 메트릭 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 실시간 타수 vs 목표 타수 */}
        <div className="bg-white p-5 rounded-3xl border-2 border-amber-100 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <div className="text-xs font-bold text-slate-500 flex items-center gap-1">
              <Gauge className="w-4 h-4 text-amber-500" />
              현재 타수 (CPM)
            </div>
            <div className="text-3xl font-black text-amber-600 font-['Jua',sans-serif]">
              {liveCPM} <span className="text-sm text-slate-400 font-normal">/ {targetCpm}타</span>
            </div>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-600 font-black text-sm">
            {liveCPM >= targetCpm ? '달성! 🎉' : '도전 🔥'}
          </div>
        </div>

        {/* 정확도 */}
        <div className="bg-white p-5 rounded-3xl border-2 border-amber-100 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <div className="text-xs font-bold text-slate-500 flex items-center gap-1">
              <Target className="w-4 h-4 text-emerald-500" />
              실시간 정확도
            </div>
            <div className="text-3xl font-black text-emerald-600 font-['Jua',sans-serif]">
              {liveAccuracy}%
            </div>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-600 font-black text-sm">
            {liveAccuracy >= 95 ? '완벽 ✨' : '주의 💡'}
          </div>
        </div>

        {/* 전체 진행률 */}
        <div className="bg-white p-5 rounded-3xl border-2 border-amber-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-2">
            <span>미션 진행도</span>
            <span>{Math.round(((currentIndex) / sentences.length) * 100)}%</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
            <div
              className="bg-gradient-to-r from-amber-400 to-amber-500 h-full rounded-full transition-all duration-300"
              style={{ width: `${(currentIndex / sentences.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* 제시 문장 및 입력 카드 */}
      <div className="bg-white rounded-3xl p-8 border-4 border-amber-200 shadow-lg space-y-6">
        {/* 문장 카테고리 태그 */}
        <div className="flex items-center justify-between">
          <span className="px-3 py-1 bg-amber-100 text-amber-900 rounded-full text-xs font-black">
            {currentSentence.category === '속담' ? '📖 지혜로운 4학년 속담' : '🏫 국어 교과서 명문장'}
          </span>
          <span className="text-xs text-slate-400 font-medium">Enter를 누르면 다음 문장으로 이동합니다</span>
        </div>

        {/* 제시 문장 (음절별 색상 비교 렌더링) */}
        <div className="bg-amber-50/70 p-6 rounded-2xl border-2 border-amber-100 select-none">
          <div className="text-2xl md:text-3xl font-black tracking-wide leading-relaxed font-['Noto_Sans_KR',sans-serif]">
            {currentSentence.sentence.split('').map((char, idx) => {
              const inputChar = inputVal[idx];
              let colorClass = 'text-slate-400';
              let bgClass = '';

              if (inputChar !== undefined) {
                if (inputChar === char) {
                  colorClass = 'text-emerald-700 font-extrabold';
                  bgClass = 'bg-emerald-100/70 rounded px-0.5';
                } else {
                  colorClass = 'text-rose-600 font-extrabold underline decoration-wavy decoration-rose-500';
                  bgClass = 'bg-rose-100/80 rounded px-0.5';
                }
              } else if (idx === inputVal.length) {
                // 현재 입력 대기 위치
                bgClass = 'border-b-4 border-amber-500 animate-pulse';
              }

              return (
                <span key={idx} className={`${colorClass} ${bgClass} transition-colors inline-block`}>
                  {char === ' ' ? '\u00A0' : char}
                </span>
              );
            })}
          </div>

          {/* 속담 및 문장의 뜻 안내 */}
          {currentSentence.meaning && (
            <div className="mt-4 pt-4 border-t border-amber-200/60 flex items-start gap-2 text-amber-900 text-sm font-semibold">
              <Sparkles className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <span>뜻풀이: {currentSentence.meaning}</span>
            </div>
          )}
        </div>

        {/* 학생 입력 창 */}
        <div className="space-y-2">
          <input
            ref={inputRef}
            type="text"
            value={inputVal}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onCompositionStart={() => {
              isComposingRef.current = true;
            }}
            onCompositionEnd={() => {
              isComposingRef.current = false;
            }}
            placeholder="위 문장을 보면서 정확하고 빠르게 따라 적어보세요..."
            className="w-full px-6 py-5 rounded-2xl border-3 border-amber-300 focus:border-amber-500 focus:ring-4 focus:ring-amber-100 font-black text-2xl text-slate-800 outline-none transition"
          />
        </div>

        {/* 하단 다음 버튼 */}
        <div className="flex justify-end">
          <button
            onClick={handleSentenceComplete}
            disabled={inputVal.trim().length === 0}
            className="px-8 py-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-black text-lg rounded-2xl shadow-md shadow-amber-200 cursor-pointer font-['Jua',sans-serif] transition hover:scale-102 active:scale-98 disabled:opacity-50"
          >
            {currentIndex + 1 < sentences.length ? '다음 문장으로 ➡️' : '결과 확인하기 🏆'}
          </button>
        </div>
      </div>
    </div>
  );
};
