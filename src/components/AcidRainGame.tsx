import React, { useState, useEffect, useRef } from 'react';
import { Heart, Trophy, Zap, ArrowLeft, RefreshCw, Sparkles, Volume2, Flame } from 'lucide-react';
import { KOREAN_WORDS } from '../data/curriculumData';
import { WordItem, TypingRecord } from '../types';
import {
  calculateCPM,
  calculateAccuracy,
  playKeyClickSound,
  playPopSound,
  playErrorSound,
  playSuccessFanfare,
} from '../koreanUtils';

interface FallingWord {
  id: string;
  wordItem: WordItem;
  x: number; // 5% ~ 85%
  y: number; // 0% ~ 90%
  speed: number;
}

interface AcidRainGameProps {
  onBack: () => void;
  onFinishGame: (record: Omit<TypingRecord, 'id' | 'studentKey' | 'studentName'>) => void;
}

export const AcidRainGame: React.FC<AcidRainGameProps> = ({ onBack, onFinishGame }) => {
  const [speedLevel, setSpeedLevel] = useState<'slow' | 'normal' | 'fast'>('normal');
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [lives, setLives] = useState<number>(5);
  const [score, setScore] = useState<number>(0);
  const [combo, setCombo] = useState<number>(0);
  const [clearedWordsCount, setClearedWordsCount] = useState<number>(0);
  const targetWordsCount = 20;

  const [inputVal, setInputVal] = useState<string>('');
  const [activeWords, setActiveWords] = useState<FallingWord[]>([]);
  const [mistakes, setMistakes] = useState<string[]>([]);
  const [totalTypedStrokes, setTotalTypedStrokes] = useState<string>('');
  const [totalAttemptedChars, setTotalAttemptedChars] = useState<number>(0);
  const [correctAttemptedChars, setCorrectAttemptedChars] = useState<number>(0);

  const startTimeRef = useRef<number>(Date.now());
  const inputRef = useRef<HTMLInputElement>(null);
  const isComposingRef = useRef<boolean>(false);
  const wordsPoolRef = useRef<WordItem[]>([...KOREAN_WORDS].sort(() => Math.random() - 0.5));
  const poolIndexRef = useRef<number>(0);

  // 현재 속도 배율
  const speedMultiplier = speedLevel === 'slow' ? 0.35 : speedLevel === 'normal' ? 0.55 : 0.85;

  // 단어 생성 인터벌
  useEffect(() => {
    if (!isPlaying) return;

    const spawnInterval = setInterval(() => {
      setActiveWords((prev) => {
        if (prev.length >= 4) return prev; // 화면에 최대 4개 동시 출현

        const nextWord = wordsPoolRef.current[poolIndexRef.current % wordsPoolRef.current.length];
        poolIndexRef.current += 1;

        const newWord: FallingWord = {
          id: `${nextWord.id}_${Date.now()}_${Math.random()}`,
          wordItem: nextWord,
          x: Math.floor(Math.random() * 75) + 8, // 8% ~ 83% 사이
          y: 0,
          speed: (Math.random() * 0.15 + 0.3) * speedMultiplier,
        };

        return [...prev, newWord];
      });
    }, speedLevel === 'slow' ? 2600 : speedLevel === 'normal' ? 2000 : 1500);

    return () => clearInterval(spawnInterval);
  }, [isPlaying, speedMultiplier, speedLevel]);

  // 애니메이션 루프 (낙하 및 바닥 판정)
  useEffect(() => {
    if (!isPlaying) return;

    const animationFrame = setInterval(() => {
      setActiveWords((prev) => {
        const nextWords: FallingWord[] = [];
        let lostLifeCount = 0;
        const newMistakes: string[] = [];

        for (const w of prev) {
          const nextY = w.y + w.speed;
          if (nextY >= 88) {
            // 바닥에 닿음
            lostLifeCount += 1;
            newMistakes.push(`${w.wordItem.word} (${w.wordItem.meaning})`);
          } else {
            nextWords.push({ ...w, y: nextY });
          }
        }

        if (lostLifeCount > 0) {
          playErrorSound();
          setCombo(0);
          setMistakes((m) => [...m, ...newMistakes]);
          setLives((l) => {
            const nextL = l - lostLifeCount;
            if (nextL <= 0) {
              endGame(false);
              return 0;
            }
            return nextL;
          });
        }

        return nextWords;
      });
    }, 50);

    return () => clearInterval(animationFrame);
  }, [isPlaying]);

  // 실시간 타수 & 정확도 계산
  const elapsedSeconds = Math.max((Date.now() - startTimeRef.current) / 1000, 1);
  const currentCPM = calculateCPM(totalTypedStrokes, elapsedSeconds);
  const currentAccuracy =
    totalAttemptedChars > 0 ? Math.round((correctAttemptedChars / totalAttemptedChars) * 100) : 100;

  // 게임 종료 처리
  const endGame = (isSuccess: boolean) => {
    setIsPlaying(false);
    if (isSuccess) {
      playSuccessFanfare();
    }
    const finalElapsed = Math.max((Date.now() - startTimeRef.current) / 1000, 1);
    const finalCpm = calculateCPM(totalTypedStrokes, finalElapsed);
    const finalAcc =
      totalAttemptedChars > 0 ? Math.round((correctAttemptedChars / totalAttemptedChars) * 100) : 95;

    onFinishGame({
      missionType: 'acid_rain',
      cpm: Math.max(finalCpm, isSuccess ? 180 : 100),
      accuracy: Math.max(50, finalAcc),
      isSuccess,
      score: score + (isSuccess ? 200 : 0),
      mistakes,
      timestamp: new Date().toISOString(),
    });
  };

  // 키 입력 제출 처리
  const handleSubmitWord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPlaying) return;

    const trimmed = inputVal.trim();
    if (!trimmed) return;

    // 일치하는 단어 찾기 (화면 상 가장 아래에 있는 일치 단어 우선)
    const matchedIdx = activeWords.reduce<number>((foundIdx, curWord, idx) => {
      if (curWord.wordItem.word === trimmed) {
        if (foundIdx === -1 || curWord.y > activeWords[foundIdx].y) {
          return idx;
        }
      }
      return foundIdx;
    }, -1);

    if (matchedIdx !== -1) {
      // 적중!
      playPopSound();
      const matched = activeWords[matchedIdx];
      setActiveWords((prev) => prev.filter((_, idx) => idx !== matchedIdx));

      const newCombo = combo + 1;
      const comboBonus = Math.min(newCombo * 5, 50);
      setScore((s) => s + 20 + comboBonus);
      setCombo(newCombo);
      setClearedWordsCount((c) => {
        const nextCount = c + 1;
        if (nextCount >= targetWordsCount) {
          setTimeout(() => endGame(true), 300);
        }
        return nextCount;
      });

      setTotalTypedStrokes((prev) => prev + matched.wordItem.word);
      setTotalAttemptedChars((t) => t + matched.wordItem.word.length);
      setCorrectAttemptedChars((c) => c + matched.wordItem.word.length);
    } else {
      // 빗나감 또는 오타
      playErrorSound();
      setCombo(0);
      setTotalAttemptedChars((t) => t + trimmed.length);
    }

    setInputVal('');
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* 게임 상단 제어 바 */}
      <div className="bg-white rounded-3xl p-4 shadow-sm border-2 border-sky-100 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
            title="미션 목록으로"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-xl font-black text-sky-900 font-['Jua',sans-serif] flex items-center gap-2">
              <span>🌧️ 단어 산성비 게임</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-700 font-bold">
                목표 {targetWordsCount}단어
              </span>
            </h2>
            <p className="text-xs text-slate-500 font-medium">하늘에서 떨어지는 4학년 국어 낱말을 입력해 보세요!</p>
          </div>
        </div>

        {/* 속도 선택 및 상태 정보 */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl text-xs font-bold">
            <button
              onClick={() => setSpeedLevel('slow')}
              className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
                speedLevel === 'slow' ? 'bg-emerald-500 text-white shadow-sm' : 'text-slate-600'
              }`}
            >
              초급
            </button>
            <button
              onClick={() => setSpeedLevel('normal')}
              className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
                speedLevel === 'normal' ? 'bg-sky-500 text-white shadow-sm' : 'text-slate-600'
              }`}
            >
              중급
            </button>
            <button
              onClick={() => setSpeedLevel('fast')}
              className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
                speedLevel === 'fast' ? 'bg-amber-500 text-white shadow-sm' : 'text-slate-600'
              }`}
            >
              고급
            </button>
          </div>

          {/* 목숨 */}
          <div className="flex items-center gap-1 bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-2xl">
            {Array.from({ length: 5 }).map((_, i) => (
              <Heart
                key={i}
                className={`w-5 h-5 transition-transform ${
                  i < lives ? 'text-rose-500 fill-rose-500 scale-100' : 'text-slate-300 scale-90'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* 상태 메트릭 바 */}
      <div className="grid grid-cols-4 gap-3 text-center">
        <div className="bg-white p-3 rounded-2xl border-2 border-sky-100 shadow-sm">
          <div className="text-xs text-slate-500 font-bold">격파 단어</div>
          <div className="text-2xl font-black text-sky-600 font-['Jua',sans-serif]">
            {clearedWordsCount} <span className="text-xs text-slate-400">/ {targetWordsCount}</span>
          </div>
        </div>
        <div className="bg-white p-3 rounded-2xl border-2 border-sky-100 shadow-sm">
          <div className="text-xs text-slate-500 font-bold">현재 점수</div>
          <div className="text-2xl font-black text-amber-500 font-['Jua',sans-serif]">
            {score} <span className="text-xs text-slate-400">점</span>
          </div>
        </div>
        <div className="bg-white p-3 rounded-2xl border-2 border-sky-100 shadow-sm">
          <div className="text-xs text-slate-500 font-bold">실시간 타수</div>
          <div className="text-2xl font-black text-indigo-600 font-['Jua',sans-serif]">
            {currentCPM} <span className="text-xs text-slate-400">타</span>
          </div>
        </div>
        <div className="bg-white p-3 rounded-2xl border-2 border-sky-100 shadow-sm">
          <div className="text-xs text-slate-500 font-bold">연속 콤보</div>
          <div className="text-2xl font-black text-emerald-500 font-['Jua',sans-serif] flex items-center justify-center gap-1">
            <Flame className="w-5 h-5 text-rose-500 fill-rose-500" />
            {combo}
          </div>
        </div>
      </div>

      {/* 산성비 게임 캔버스 영역 */}
      <div className="relative w-full h-[450px] bg-gradient-to-b from-sky-100 via-sky-50 to-indigo-100 rounded-3xl border-4 border-sky-200 shadow-inner overflow-hidden">
        {/* 하늘 구름 배경 */}
        <div className="absolute top-2 left-6 text-sky-200/60 font-black text-6xl select-none pointer-events-none">☁️</div>
        <div className="absolute top-8 right-12 text-sky-200/60 font-black text-7xl select-none pointer-events-none">☁️</div>

        {/* 바닥 경계선 안내 */}
        <div className="absolute bottom-0 inset-x-0 h-10 bg-gradient-to-t from-sky-400/40 to-transparent pointer-events-none border-b-4 border-sky-500/50 flex items-end justify-center pb-1">
          <span className="text-xs text-sky-800/80 font-bold">🌊 바닥에 닿기 전에 낱말을 입력해 주세요!</span>
        </div>

        {/* 떨어지는 단어들 */}
        {activeWords.map((wordObj) => (
          <div
            key={wordObj.id}
            style={{
              left: `${wordObj.x}%`,
              top: `${wordObj.y}%`,
            }}
            className="absolute -translate-x-1/2 transition-[top] duration-75 ease-linear pointer-events-none z-10"
          >
            <div className="flex flex-col items-center group">
              <div className="px-4 py-2 bg-white/95 backdrop-blur-sm rounded-2xl border-2 border-sky-300 shadow-lg shadow-sky-100 flex flex-col items-center transform hover:scale-105 transition-transform animate-bounce">
                <span className="text-lg md:text-xl font-black text-sky-950 font-['Jua',sans-serif] tracking-wide">
                  {wordObj.wordItem.word}
                </span>
                <span className="text-[11px] text-sky-600 font-semibold max-w-[140px] truncate text-center">
                  {wordObj.wordItem.meaning}
                </span>
              </div>
              <div className="w-2 h-2 bg-sky-400 rounded-full mt-1 animate-ping" />
            </div>
          </div>
        ))}
      </div>

      {/* 하단 입력 폼 */}
      <div className="bg-white p-4 rounded-3xl border-2 border-sky-200 shadow-md">
        <form onSubmit={handleSubmitWord} className="flex gap-3">
          <input
            ref={inputRef}
            type="text"
            autoFocus
            value={inputVal}
            onChange={(e) => {
              setInputVal(e.target.value);
              playKeyClickSound();
            }}
            onCompositionStart={() => {
              isComposingRef.current = true;
            }}
            onCompositionEnd={() => {
              isComposingRef.current = false;
            }}
            placeholder="화면에 보이는 낱말을 입력하고 Enter를 누르세요!"
            className="flex-1 px-6 py-4 rounded-2xl border-3 border-sky-300 focus:border-indigo-500 focus:ring-4 focus:ring-sky-100 font-black text-xl text-slate-800 outline-none transition"
          />
          <button
            type="submit"
            className="px-8 py-4 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white font-black text-lg rounded-2xl shadow-md shadow-sky-200 cursor-pointer font-['Jua',sans-serif] transition hover:scale-102 active:scale-98"
          >
            격파 💥
          </button>
        </form>
      </div>
    </div>
  );
};
