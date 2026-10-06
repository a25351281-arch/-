import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, ShieldCheck, AlertTriangle, Sparkles, CheckCircle2, Flame, Award } from 'lucide-react';
import { ZERO_ERROR_SENTENCES } from '../data/curriculumData';
import { SentenceItem, TypingRecord } from '../types';
import {
  calculateCPM,
  calculateAccuracy,
  playKeyClickSound,
  playPopSound,
  playErrorSound,
  playSuccessFanfare,
} from '../koreanUtils';

interface ZeroErrorMissionProps {
  onBack: () => void;
  onFinishGame: (record: Omit<TypingRecord, 'id' | 'studentKey' | 'studentName'>) => void;
}

export const ZeroErrorMission: React.FC<ZeroErrorMissionProps> = ({ onBack, onFinishGame }) => {
  const [sentences] = useState<SentenceItem[]>(() => {
    return [...ZERO_ERROR_SENTENCES].sort(() => Math.random() - 0.5).slice(0, 3);
  });

  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [inputVal, setInputVal] = useState<string>('');
  const [totalErrors, setTotalErrors] = useState<number>(0);
  const [sentenceErrorCount, setSentenceErrorCount] = useState<number>(0);
  const [mistakes, setMistakes] = useState<string[]>([]);
  const [completedStats, setCompletedStats] = useState<{ cpm: number; accuracy: number }[]>([]);

  const startTimeRef = useRef<number>(Date.now());
  const inputRef = useRef<HTMLInputElement>(null);
  const prevInputLengthRef = useRef<number>(0);

  const currentSentence = sentences[currentIndex];

  useEffect(() => {
    startTimeRef.current = Date.now();
    setInputVal('');
    setSentenceErrorCount(0);
    prevInputLengthRef.current = 0;
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [currentIndex]);

  const elapsedSec = Math.max((Date.now() - startTimeRef.current) / 1000, 0.4);
  const liveCPM = calculateCPM(inputVal, elapsedSec);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    playKeyClickSound();

    // 사용자가 글자를 덧붙였을 때 즉시 오타 검사
    if (val.length > prevInputLengthRef.current) {
      const addedCharIndex = val.length - 1;
      const targetChar = currentSentence.sentence[addedCharIndex];
      const typedChar = val[addedCharIndex];

      // 한글 조합 중이 아닐 때 또는 확실한 오타 발생 시
      if (targetChar && typedChar !== targetChar) {
        playErrorSound();
        setTotalErrors((err) => err + 1);
        setSentenceErrorCount((err) => err + 1);
      }
    }

    prevInputLengthRef.current = val.length;
    setInputVal(val);
  };

  const handleNext = () => {
    const target = currentSentence.sentence;
    const finalElapsed = Math.max((Date.now() - startTimeRef.current) / 1000, 0.5);
    const finalCpm = calculateCPM(inputVal, finalElapsed);
    const finalAcc = calculateAccuracy(target, inputVal);

    if (sentenceErrorCount > 0 || finalAcc < 100) {
      setMistakes((prev) => [...prev, `${target} (오타 ${sentenceErrorCount}회 발생)`]);
    }

    const nextStats = [...completedStats, { cpm: finalCpm, accuracy: finalAcc }];
    setCompletedStats(nextStats);

    if (currentIndex + 1 < sentences.length) {
      playPopSound();
      setCurrentIndex((i) => i + 1);
    } else {
      // 3문장 모두 마침
      const avgCpm = Math.round(nextStats.reduce((sum, s) => sum + s.cpm, 0) / nextStats.length);
      const avgAcc = Math.round(nextStats.reduce((sum, s) => sum + s.accuracy, 0) / nextStats.length);
      const isSuccess = totalErrors === 0 && avgAcc === 100;

      if (isSuccess) {
        playSuccessFanfare();
      }

      onFinishGame({
        missionType: 'zero_error',
        cpm: avgCpm,
        accuracy: avgAcc,
        isSuccess,
        score: isSuccess ? 500 : Math.max(100, 300 - totalErrors * 30),
        mistakes,
        timestamp: new Date().toISOString(),
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (inputVal.trim().length > 0) {
        handleNext();
      }
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 헤더 바 */}
      <div className="bg-white rounded-3xl p-5 shadow-sm border-2 border-indigo-100 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
            title="미션 목록으로"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-xl font-black text-indigo-950 font-['Jua',sans-serif] flex items-center gap-2">
              <span>🛡️ 오탈자 제로 미션!</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 font-bold">
                문장 {currentIndex + 1} / {sentences.length}
              </span>
            </h2>
            <p className="text-xs text-slate-500 font-medium">단 한 번의 오타도 없이 100% 퍼펙트 맞춤법에 도전하세요!</p>
          </div>
        </div>

        {/* 오탈자 카운터 배지 */}
        <div className={`px-4 py-2 rounded-2xl border-2 flex items-center gap-2 font-black text-sm font-['Jua',sans-serif] ${
          totalErrors === 0
            ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
            : 'bg-rose-50 border-rose-300 text-rose-800'
        }`}>
          {totalErrors === 0 ? (
            <>
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <span>현재 누적 오탈자: 0개 (퍼펙트 유지 중!)</span>
            </>
          ) : (
            <>
              <AlertTriangle className="w-5 h-5 text-rose-500" />
              <span>누적 오탈자: {totalErrors}개 발생</span>
            </>
          )}
        </div>
      </div>

      {/* 상태 메트릭 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-3xl border-2 border-indigo-100 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <div className="text-xs font-bold text-slate-500">실시간 타수 (CPM)</div>
            <div className="text-3xl font-black text-indigo-600 font-['Jua',sans-serif]">
              {liveCPM} <span className="text-sm text-slate-400">타</span>
            </div>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-black">
            속도 ⚡
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border-2 border-indigo-100 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <div className="text-xs font-bold text-slate-500">현재 문장 오탈자</div>
            <div className={`text-3xl font-black font-['Jua',sans-serif] ${
              sentenceErrorCount === 0 ? 'text-emerald-600' : 'text-rose-600'
            }`}>
              {sentenceErrorCount} <span className="text-sm text-slate-400">개</span>
            </div>
          </div>
          <div className={`h-12 w-12 rounded-2xl flex items-center justify-center font-black ${
            sentenceErrorCount === 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
          }`}>
            {sentenceErrorCount === 0 ? '퍼펙트' : '오타!'}
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border-2 border-indigo-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-2">
            <span>집중도 게이지</span>
            <span>{Math.round((currentIndex / sentences.length) * 100)}%</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
            <div
              className="bg-gradient-to-r from-indigo-500 to-purple-600 h-full rounded-full transition-all duration-300"
              style={{ width: `${(currentIndex / sentences.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* 제시 맞춤법 문장 카드 */}
      <div className="bg-white rounded-3xl p-8 border-4 border-indigo-200 shadow-lg space-y-6">
        <div className="flex items-center justify-between">
          <span className="px-3 py-1 bg-indigo-100 text-indigo-900 rounded-full text-xs font-black">
            📝 4학년 필수 맞춤법 집중 트레이닝
          </span>
          <span className="text-xs text-slate-400 font-medium">천천히 침착하게 글자 하나하나 정확히 쳐보세요</span>
        </div>

        {/* 문장 텍스트 렌더링 */}
        <div className="bg-indigo-50/70 p-6 rounded-2xl border-2 border-indigo-100 select-none">
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
                  bgClass = 'bg-rose-100/80 rounded px-0.5 animate-pulse';
                }
              } else if (idx === inputVal.length) {
                bgClass = 'border-b-4 border-indigo-500 animate-pulse';
              }

              return (
                <span key={idx} className={`${colorClass} ${bgClass} transition-colors inline-block`}>
                  {char === ' ' ? '\u00A0' : char}
                </span>
              );
            })}
          </div>

          {currentSentence.meaning && (
            <div className="mt-4 pt-4 border-t border-indigo-200/60 flex items-start gap-2 text-indigo-900 text-sm font-semibold">
              <Sparkles className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
              <span>맞춤법 길잡이: {currentSentence.meaning}</span>
            </div>
          )}
        </div>

        {/* 입력창 */}
        <div className="space-y-2">
          <input
            ref={inputRef}
            type="text"
            value={inputVal}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="틀리지 않도록 차근차근 입력해 보세요..."
            className="w-full px-6 py-5 rounded-2xl border-3 border-indigo-300 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 font-black text-2xl text-slate-800 outline-none transition"
          />
        </div>

        {/* 완료/다음 버튼 */}
        <div className="flex justify-end">
          <button
            onClick={handleNext}
            disabled={inputVal.trim().length === 0}
            className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-black text-lg rounded-2xl shadow-md shadow-indigo-200 cursor-pointer font-['Jua',sans-serif] transition hover:scale-102 active:scale-98 disabled:opacity-50"
          >
            {currentIndex + 1 < sentences.length ? '다음 문장으로 ➡️' : '최종 확인하기 🛡️'}
          </button>
        </div>
      </div>
    </div>
  );
};
