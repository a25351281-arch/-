import React, { useState } from 'react';
import { X, UserCheck, KeyRound, Sparkles, AlertCircle, HelpCircle } from 'lucide-react';
import { Student } from '../types';
import { getStudentDoc, saveStudentDoc, getAppSetting } from '../firebase';
import { hashPassword } from '../koreanUtils';

interface StudentAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (student: Student) => void;
}

export const StudentAuthModal: React.FC<StudentAuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
}) => {
  const [year, setYear] = useState(2026);
  const [grade] = useState(4);
  const [classNum, setClassNum] = useState<number>(1);
  const [studentNum, setStudentNum] = useState<number>(1);
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');

  // 신규 등록 또는 비밀번호 초기화 모드 상태
  const [mode, setMode] = useState<'login' | 'register_new' | 'reset_by_teacher'>('login');
  const [classCommonPassword, setClassCommonPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');

  if (!isOpen) return null;

  const generateStudentKey = () => {
    return `${year}-${grade}-${classNum}-${String(studentNum).padStart(2, '0')}`;
  };

  // 1. 일반 로그인 시도
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setInfoMsg('');

    if (!name.trim()) {
      setErrorMsg('이름을 입력해 주세요!');
      return;
    }
    if (!password.trim()) {
      setErrorMsg('비밀번호를 입력해 주세요!');
      return;
    }

    setLoading(true);
    try {
      const studentKey = generateStudentKey();
      const existing = await getStudentDoc(studentKey);

      if (!existing) {
        // 기존 등록 정보 없음 -> 신규 등록 유도
        setMode('register_new');
        setInfoMsg(`'${year}학년도 4학년 ${classNum}반 ${studentNum}번'의 첫 접속입니다! 학급 공통 비밀번호(선생님이 안내한 번호)와 사용할 새 비밀번호를 등록해 주세요.`);
        setLoading(false);
        return;
      }

      // 선생님에 의해 초기화된 상태인지 확인
      if (existing.mustResetPassword) {
        setMode('reset_by_teacher');
        setInfoMsg('선생님께서 비밀번호를 초기화하셨습니다. 학급 공통 비밀번호를 입력하고 새로운 비밀번호를 설정해 주세요.');
        setLoading(false);
        return;
      }

      // 이름 확인
      if (existing.name.trim() !== name.trim()) {
        setErrorMsg(`등록된 이름('${existing.name}')과 입력한 이름이 다릅니다. 번호와 이름을 다시 확인해 주세요.`);
        setLoading(false);
        return;
      }

      // 비밀번호 해시 일치 검사
      const inputHash = await hashPassword(password);
      if (existing.passwordHash !== inputHash) {
        setErrorMsg('비밀번호가 맞지 않아요! 잊어버렸다면 선생님께 비밀번호 초기화를 부탁해 보세요.');
        setLoading(false);
        return;
      }

      // 로그인 성공
      onLoginSuccess(existing);
      onClose();
    } catch {
      setErrorMsg('저장소에 연결하지 못했어요. 잠시 후 다시 시도해 주세요.');
    } finally {
      setLoading(false);
    }
  };

  // 2. 신규 등록 및 비밀번호 설정 완료
  const handleRegisterNew = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!classCommonPassword.trim()) {
      setErrorMsg('학급 공통 비밀번호를 입력해 주세요 (기본: 1234).');
      return;
    }
    if (newPassword.length < 4) {
      setErrorMsg('비밀번호는 최소 4자리 이상이어야 안전해요!');
      return;
    }
    if (newPassword !== newPasswordConfirm) {
      setErrorMsg('새 비밀번호와 확인 입력이 일치하지 않습니다.');
      return;
    }

    setLoading(true);
    try {
      // 학급 공통 비밀번호 확인
      const setting = await getAppSetting();
      const classCommonHash = await hashPassword(classCommonPassword.trim());
      const defaultHash = await hashPassword('1234');
      const expectedHash = setting?.classPasswordHash || defaultHash;

      if (classCommonHash !== expectedHash && classCommonPassword.trim() !== '1234') {
        setErrorMsg('학급 공통 비밀번호가 올바르지 않습니다. 선생님께 확인해 주세요! (기본: 1234)');
        setLoading(false);
        return;
      }

      const studentKey = generateStudentKey();
      const passwordHash = await hashPassword(newPassword.trim());

      const newStudent: Student = {
        studentKey,
        year,
        grade,
        classNum,
        studentNum,
        name: name.trim(),
        passwordHash,
        mustResetPassword: false,
        createdAt: new Date().toISOString(),
      };

      await saveStudentDoc(newStudent);
      onLoginSuccess(newStudent);
      onClose();
    } catch {
      setErrorMsg('등록 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border-4 border-sky-100 overflow-hidden transform transition-all">
        {/* 모달 헤더 */}
        <div className="bg-gradient-to-r from-sky-400 to-indigo-500 px-6 py-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/20 rounded-2xl">
              <Sparkles className="w-6 h-6 text-yellow-300" />
            </div>
            <div>
              <h3 className="text-xl font-black font-['Jua',sans-serif]">
                {mode === 'login' ? '학생 로그인' : '새 비밀번호 등록'}
              </h3>
              <p className="text-xs text-sky-100 font-medium">
                {mode === 'login' ? '내 기록을 이어받아 연습해요' : '학급 친구 인증 및 안전한 시작'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-2xl transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 폼 본문 */}
        <div className="p-6">
          {errorMsg && (
            <div className="mb-4 p-3.5 bg-rose-50 border-2 border-rose-200 rounded-2xl flex items-start gap-2.5 text-rose-700 text-sm font-semibold">
              <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {infoMsg && (
            <div className="mb-4 p-3.5 bg-sky-50 border-2 border-sky-200 rounded-2xl flex items-start gap-2.5 text-sky-800 text-sm font-semibold">
              <HelpCircle className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
              <span>{infoMsg}</span>
            </div>
          )}

          {mode === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              {/* 학년도, 학년, 반, 번호 그리드 */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">학년도</label>
                  <input
                    type="number"
                    value={year}
                    onChange={(e) => setYear(Number(e.target.value))}
                    className="w-full px-3 py-2.5 rounded-xl border-2 border-slate-200 focus:border-sky-400 font-bold text-slate-700 outline-none text-base bg-slate-50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">학년</label>
                  <input
                    type="text"
                    disabled
                    value="4학년"
                    className="w-full px-3 py-2.5 rounded-xl border-2 border-slate-200 bg-slate-100 font-bold text-slate-500 outline-none text-base cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">반 선택</label>
                  <select
                    value={classNum}
                    onChange={(e) => setClassNum(Number(e.target.value))}
                    className="w-full px-3 py-2.5 rounded-xl border-2 border-sky-200 focus:border-sky-400 font-bold text-slate-800 outline-none text-base bg-white"
                  >
                    {Array.from({ length: 15 }, (_, i) => i + 1).map((c) => (
                      <option key={c} value={c}>
                        {c}반
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">번호 선택</label>
                  <select
                    value={studentNum}
                    onChange={(e) => setStudentNum(Number(e.target.value))}
                    className="w-full px-3 py-2.5 rounded-xl border-2 border-sky-200 focus:border-sky-400 font-bold text-slate-800 outline-none text-base bg-white"
                  >
                    {Array.from({ length: 40 }, (_, i) => i + 1).map((n) => (
                      <option key={n} value={n}>
                        {n}번
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 이름 */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">학생 이름</label>
                <input
                  type="text"
                  placeholder="예: 홍길동"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border-2 border-sky-200 focus:border-sky-400 font-bold text-slate-800 outline-none text-base"
                />
              </div>

              {/* 비밀번호 */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">개인 비밀번호</label>
                <input
                  type="password"
                  placeholder="비밀번호 입력"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border-2 border-sky-200 focus:border-sky-400 font-bold text-slate-800 outline-none text-base"
                />
                <p className="text-xs text-slate-400 mt-1 font-medium">
                  * 첫 접속 시 학급 확인 후 새 비밀번호가 설정됩니다.
                </p>
              </div>

              {/* 제출 버튼 */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3.5 bg-gradient-to-r from-sky-400 to-indigo-500 hover:from-sky-500 hover:to-indigo-600 text-white font-black rounded-2xl shadow-md shadow-sky-200 flex items-center justify-center gap-2 text-lg font-['Jua',sans-serif] cursor-pointer transition hover:scale-101 active:scale-99 disabled:opacity-50"
              >
                <UserCheck className="w-5 h-5" />
                {loading ? '확인 중...' : '입장하기'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegisterNew} className="space-y-4">
              <div className="bg-amber-50 p-3 rounded-2xl border border-amber-200 text-amber-900 text-xs font-semibold">
                선택된 학생: <span className="font-extrabold text-sm">{year}년 4학년 {classNum}반 {studentNum}번 ({name})</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  학급 공통 비밀번호 <span className="text-sky-600">(선생님이 알려주신 번호 / 기본: 1234)</span>
                </label>
                <input
                  type="password"
                  placeholder="기본 1234"
                  value={classCommonPassword}
                  onChange={(e) => setClassCommonPassword(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border-2 border-sky-200 focus:border-sky-400 font-bold text-slate-800 outline-none text-base"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">앞으로 사용할 새 비밀번호 (4자리 이상)</label>
                <input
                  type="password"
                  placeholder="새 비밀번호 입력"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border-2 border-sky-200 focus:border-sky-400 font-bold text-slate-800 outline-none text-base"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">새 비밀번호 한 번 더 확인</label>
                <input
                  type="password"
                  placeholder="새 비밀번호 다시 입력"
                  value={newPasswordConfirm}
                  onChange={(e) => setNewPasswordConfirm(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border-2 border-sky-200 focus:border-sky-400 font-bold text-slate-800 outline-none text-base"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setErrorMsg('');
                    setInfoMsg('');
                  }}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl text-sm transition cursor-pointer"
                >
                  뒤로 가기
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-2 py-3 bg-gradient-to-r from-emerald-400 to-teal-500 hover:from-emerald-500 hover:to-teal-600 text-white font-black rounded-2xl shadow-md shadow-emerald-200 flex items-center justify-center gap-2 text-base font-['Jua',sans-serif] cursor-pointer transition hover:scale-101 disabled:opacity-50"
                >
                  <KeyRound className="w-5 h-5" />
                  {loading ? '등록 중...' : '비밀번호 등록 및 입장'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
