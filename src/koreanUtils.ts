// 한글 자모 및 타수(글쇠 수) 계산 유틸리티

// 초성 19자 타수 (두벌식 키보드 기준: 쌍자음 ㄲ, ㄸ, ㅃ, ㅆ, ㅉ는 Shift 포함 2타)
const CHOSUNG_STROKES = [
  1, // ㄱ
  2, // ㄲ
  1, // ㄴ
  1, // ㄷ
  2, // ㄸ
  1, // ㄹ
  1, // ㅁ
  1, // ㅂ
  2, // ㅃ
  1, // ㅅ
  2, // ㅆ
  1, // ㅇ
  1, // ㅈ
  2, // ㅉ
  1, // ㅊ
  1, // ㅋ
  1, // ㅌ
  1, // ㅍ
  1, // ㅎ
];

// 중성 21자 타수
// 복합 모음: ㅘ(ㅗ+ㅏ=2), ㅙ(ㅗ+ㅐ=2 or 3), ㅚ(ㅗ+ㅣ=2), ㅝ(ㅜ+ㅓ=2), ㅞ(ㅜ+ㅔ=3), ㅟ(ㅜ+ㅣ=2), ㅢ(ㅡ+ㅣ=2), ㅒ(Shift+ㅐ=2), ㅖ(Shift+ㅔ=2)
const JUNGSUNG_STROKES = [
  1, // ㅏ
  1, // ㅐ
  1, // ㅑ
  2, // ㅒ
  1, // ㅓ
  1, // ㅔ
  1, // ㅕ
  2, // ㅖ
  1, // ㅗ
  2, // ㅘ
  2, // ㅙ
  2, // ㅚ
  1, // ㅛ
  1, // ㅜ
  2, // ㅝ
  2, // ㅞ
  2, // ㅟ
  1, // ㅠ
  1, // ㅡ
  2, // ㅢ
  1, // ㅣ
];

// 종성 28자 타수 (0은 받침 없음)
// 겹받침: ㄳ(2), ㄵ(2), ㄶ(2), ㄺ(2), ㄻ(2), ㄼ(2), ㄽ(2), ㄾ(2), ㄿ(2), ㅀ(2), ㅄ(2), ㅆ(2), ㄲ(2)
const JONGSUNG_STROKES = [
  0, // 없음
  1, // ㄱ
  2, // ㄲ
  2, // ㄳ
  1, // ㄴ
  2, // ㄵ
  2, // ㄶ
  1, // ㄷ
  1, // ㄹ
  2, // ㄺ
  2, // ㄻ
  2, // ㄼ
  2, // ㄽ
  2, // ㄾ
  2, // ㄿ
  2, // ㅀ
  1, // ㅁ
  1, // ㅂ
  2, // ㅄ
  1, // ㅅ
  2, // ㅆ
  1, // ㅇ
  1, // ㅈ
  1, // ㅊ
  1, // ㅋ
  1, // ㅌ
  1, // ㅍ
  1, // ㅎ
];

/**
 * 단일 문자의 타수(키스트로크) 계산
 */
export function getCharStrokes(char: string): number {
  const code = char.charCodeAt(0);

  // 완성형 한글 음절 (가 ~ 힣)
  if (code >= 0xac00 && code <= 0xd7a3) {
    const syllableIndex = code - 0xac00;
    const jong = syllableIndex % 28;
    const jung = Math.floor((syllableIndex - jong) / 28) % 21;
    const cho = Math.floor((syllableIndex - jong) / 28 / 21);

    return (
      (CHOSUNG_STROKES[cho] || 1) +
      (JUNGSUNG_STROKES[jung] || 1) +
      (JONGSUNG_STROKES[jong] || 0)
    );
  }

  // 한글 자모 단독 입력 (ㄱ ~ ㅎ, ㅏ ~ ㅣ)
  if (code >= 0x3131 && code <= 0x314e) {
    // 호환용 자음
    return 1;
  }
  if (code >= 0x314f && code <= 0x3163) {
    // 호환용 모음
    return 1;
  }

  // 영문 대문자나 Shift 기호
  if (/[~!@#$%^&*()_+{}|:"<>?A-Z]/.test(char)) {
    return 2;
  }

  // 공백, 숫자, 일반 소문자, 쉼표, 마침표 등
  return 1;
}

/**
 * 문자열 전체의 총 타수(키스트로크 수) 계산
 */
export function getTotalStrokes(text: string): number {
  let strokes = 0;
  for (let i = 0; i < text.length; i++) {
    strokes += getCharStrokes(text[i]);
  }
  return strokes;
}

/**
 * 실시간 CPM (분당 타수) 계산
 * @param typedText 현재까지 올바르게 입력된 텍스트
 * @param elapsedSeconds 경과 시간(초)
 */
export function calculateCPM(typedText: string, elapsedSeconds: number): number {
  if (elapsedSeconds <= 0.4 || typedText.length === 0) return 0;
  const strokes = getTotalStrokes(typedText);
  const cpm = (strokes / elapsedSeconds) * 60;
  return Math.min(Math.round(cpm), 1200); // 비정상적인 극단치 상한선 제한
}

/**
 * 두 텍스트의 정확도(Accuracy %) 계산
 * 문자 단위 매칭 기반
 */
export function calculateAccuracy(target: string, input: string): number {
  if (!input || input.length === 0) return 100;
  if (!target || target.length === 0) return 0;

  const len = Math.min(target.length, input.length);
  let correctCount = 0;

  for (let i = 0; i < len; i++) {
    if (target[i] === input[i]) {
      correctCount++;
    }
  }

  // 입력 길이가 목표 길이보다 길면 초과 입력도 감점 요소
  const totalChecked = Math.max(input.length, 1);
  const acc = (correctCount / totalChecked) * 100;
  return Math.max(0, Math.min(100, Math.round(acc)));
}

/**
 * 비밀번호 단방향 SHA-256 해시 함수
 */
export async function hashPassword(plainText: string): Promise<string> {
  if (!plainText) return '';
  const encoder = new TextEncoder();
  const data = encoder.encode(plainText.trim());
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

// -------------------------------------------------------------
// Web Audio API 기반 효과음 (에셋 다운로드 없이 내장 합성)
// -------------------------------------------------------------
let audioCtx: AudioContext | null = null;
let soundEnabled = true;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function setSoundEnabled(enabled: boolean) {
  soundEnabled = enabled;
}

export function getSoundEnabled(): boolean {
  return soundEnabled;
}

/** 키보드 타건 딸깍 소리 */
export function playKeyClickSound() {
  if (!soundEnabled) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(440, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.04);

    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.04);
  } catch {
    // 음향 재생 실패 무시
  }
}

/** 정답 및 단어 격파 소리 (경쾌한 퐁!) */
export function playPopSound() {
  if (!soundEnabled) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12); // A5

    gain.gain.setValueAtTime(0.18, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.12);
  } catch {
    // ignore
  }
}

/** 오타 또는 실패 소리 (낮은 삑) */
export function playErrorSound() {
  if (!soundEnabled) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(140, ctx.currentTime + 0.15);

    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.15);
  } catch {
    // ignore
  }
}

/** 미션 성공 팡파레 */
export function playSuccessFanfare() {
  if (!soundEnabled) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const startTime = ctx.currentTime + idx * 0.1;
      const duration = 0.25;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.15, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + duration);
    });
  } catch {
    // ignore
  }
}
