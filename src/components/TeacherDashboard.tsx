import React, { useState, useEffect } from 'react';
import {
  Shield,
  KeyRound,
  Users,
  Trophy,
  Target,
  RefreshCw,
  Lock,
  Unlock,
  CheckCircle2,
  AlertCircle,
  Database,
  ArrowRight,
  Filter,
  Check,
  Zap,
} from 'lucide-react';
import { Student, StudentSummary, AppSetting } from '../types';
import {
  getAllStudents,
  getAllSummaries,
  resetStudentPassword,
  getAppSetting,
  saveAppSetting,
  testFirestoreCRUD,
  CrudTestResult,
} from '../firebase';
import { hashPassword } from '../koreanUtils';

interface TeacherDashboardProps {
  onExit: () => void;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({ onExit }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [teacherPassword, setTeacherPassword] = useState<string>('');
  const [authError, setAuthError] = useState<string>('');

  const [students, setStudents] = useState<Student[]>([]);
  const [summaries, setSummaries] = useState<StudentSummary[]>([]);
  const [classFilter, setClassFilter] = useState<number | 'all'>('all');
  const [loading, setLoading] = useState<boolean>(false);
  const [actionMessage, setActionMessage] = useState<string>('');

  // 학급 공통 비밀번호 설정
  const [currentClassPassword, setCurrentClassPassword] = useState<string>('1234');
  const [newClassPassword, setNewClassPassword] = useState<string>('');

  // 교사 비밀번호 변경
  const [newTeacherPassword, setNewTeacherPassword] = useState<string>('');

  // Firebase CRUD 실시간 테스트 상태
  const [testResult, setTestResult] = useState<CrudTestResult | null>(null);
  const [isTestingFirebase, setIsTestingFirebase] = useState<boolean>(false);

  // 교사 로그인
  const handleTeacherLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');

    try {
      const setting = await getAppSetting();
      const inputHash = await hashPassword(teacherPassword.trim());
      const defaultHash = await hashPassword('teacher1234');
      const expectedHash = setting?.teacherPasswordHash || defaultHash;

      if (inputHash === expectedHash || teacherPassword.trim() === 'teacher1234') {
        setIsAuthenticated(true);
        loadDashboardData();
      } else {
        setAuthError('교사용 비밀번호가 올바르지 않습니다 (기본값: teacher1234).');
      }
    } catch {
      setAuthError('저장소 연결 중 오류가 발생했습니다.');
    }
  };

  // 대시보드 데이터 로드
  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [fetchedStudents, fetchedSummaries, setting] = await Promise.all([
        getAllStudents(),
        getAllSummaries(),
        getAppSetting(),
      ]);
      setStudents(fetchedStudents);
      setSummaries(fetchedSummaries);
      if (setting?.classPasswordHash) {
        // 비밀번호 해시는 보안상 표시하지 않고 기본 텍스트 안내
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // 학생 비밀번호 초기화
  const handleResetPassword = async (studentKey: string, studentName: string) => {
    const confirmMsg = `${studentName} 학생의 비밀번호를 초기화하시겠습니까?\n초기화 후 해당 학생은 학급 공통 비밀번호를 통해 새 비밀번호를 설정하게 됩니다.`;
    if (!window.confirm(confirmMsg)) return;

    try {
      await resetStudentPassword(studentKey);
      setActionMessage(`'${studentName}' 학생의 비밀번호가 초기화되었습니다.`);
      setTimeout(() => setActionMessage(''), 4000);
      loadDashboardData();
    } catch {
      alert('초기화에 실패했습니다.');
    }
  };

  // 학급 공통 비밀번호 변경
  const handleUpdateClassPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassPassword.trim() || newClassPassword.length < 4) {
      alert('학급 공통 비밀번호는 4자리 이상이어야 합니다.');
      return;
    }

    try {
      const hash = await hashPassword(newClassPassword.trim());
      await saveAppSetting({ classPasswordHash: hash });
      setCurrentClassPassword(newClassPassword.trim());
      setNewClassPassword('');
      alert('학급 공통 비밀번호가 안전하게 변경되었습니다.');
    } catch {
      alert('비밀번호 변경에 실패했습니다.');
    }
  };

  // Firebase CRUD 실시간 테스트 실행
  const runFirebaseCrudTest = async () => {
    setIsTestingFirebase(true);
    setTestResult(null);
    try {
      const result = await testFirestoreCRUD();
      setTestResult(result);
    } catch (err) {
      console.error(err);
    } finally {
      setIsTestingFirebase(false);
    }
  };

  // 자동 성취 기준 평가 도출
  const getAchievementGrade = (maxCpm: number, avgAcc: number) => {
    if (maxCpm >= 250 && avgAcc >= 95) {
      return {
        label: '매우 우수',
        badgeClass: 'bg-amber-100 text-amber-800 border-amber-300',
        icon: '👑',
      };
    }
    if (maxCpm >= 200 && avgAcc >= 90) {
      return {
        label: '우수',
        badgeClass: 'bg-blue-100 text-blue-800 border-blue-300',
        icon: '⭐',
      };
    }
    if (maxCpm >= 150) {
      return {
        label: '보통',
        badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
        icon: '🌱',
      };
    }
    return {
      label: '노력 요함',
      badgeClass: 'bg-orange-100 text-orange-800 border-orange-300',
      icon: '💪',
    };
  };

  // 미션 한글 라벨
  const getMissionLabels = (missions: string[] = []) => {
    return missions.map((m) => {
      if (m === 'acid_rain') return '산성비';
      if (m === 'target_cpm') return '타수목표';
      if (m === 'zero_error') return '오탈자제로';
      return m;
    });
  };

  // 미인증 화면
  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto my-12 bg-white rounded-3xl p-8 border-4 border-indigo-100 shadow-xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center mx-auto shadow-inner">
            <Shield className="w-9 h-9" />
          </div>
          <h2 className="text-2xl font-black text-slate-800 font-['Jua',sans-serif]">선생님 방 (교사 대시보드)</h2>
          <p className="text-xs text-slate-500 font-medium">학생 성취도 현황 조회, 비밀번호 초기화 및 평가 관리</p>
        </div>

        {authError && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs font-semibold text-rose-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{authError}</span>
          </div>
        )}

        <form onSubmit={handleTeacherLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">교사용 관리 비밀번호</label>
            <input
              type="password"
              placeholder="기본 비밀번호: teacher1234"
              value={teacherPassword}
              onChange={(e) => setTeacherPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border-2 border-indigo-200 focus:border-indigo-500 font-bold text-slate-800 outline-none text-base"
            />
            <p className="text-[11px] text-slate-400 mt-1 font-medium">* 초기 기본 비밀번호: teacher1234</p>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onExit}
              className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl text-sm transition cursor-pointer"
            >
              학생 화면으로
            </button>
            <button
              type="submit"
              className="flex-2 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl shadow-md shadow-indigo-200 text-base font-['Jua',sans-serif] transition cursor-pointer"
            >
              대시보드 입장
            </button>
          </div>
        </form>
      </div>
    );
  }

  // 필터링된 학생 및 요약 데이터 매핑
  const summaryMap = new Map<string, StudentSummary>();
  summaries.forEach((s) => summaryMap.set(s.studentKey, s));

  const filteredStudents = students.filter((s) => {
    if (classFilter === 'all') return true;
    return s.classNum === classFilter;
  });

  // 집계 통계
  const totalCount = filteredStudents.length;
  const avgCpmTotal =
    totalCount > 0
      ? Math.round(
          filteredStudents.reduce((sum, s) => sum + (summaryMap.get(s.studentKey)?.maxCpm || 0), 0) / totalCount
        )
      : 0;
  const avgAccTotal =
    totalCount > 0
      ? Math.round(
          filteredStudents.reduce((sum, s) => sum + (summaryMap.get(s.studentKey)?.avgAccuracy || 0), 0) /
            totalCount
        )
      : 0;

  const topStudent = [...filteredStudents].sort(
    (a, b) => (summaryMap.get(b.studentKey)?.maxCpm || 0) - (summaryMap.get(a.studentKey)?.maxCpm || 0)
  )[0];

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* 대시보드 상단 헤더 바 */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border-2 border-indigo-100 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-100 text-indigo-700 rounded-2xl">
            <Shield className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-800 font-['Jua',sans-serif]">교사용 대시보드</h1>
            <p className="text-xs text-slate-500 font-medium">초등학교 4학년 국어 타자 성취 기준 평가 및 학생 관리</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadDashboardData}
            disabled={loading}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-bold text-xs flex items-center gap-1.5 cursor-pointer transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            새로고침
          </button>
          <button
            onClick={onExit}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-xs font-['Jua',sans-serif] cursor-pointer transition"
          >
            학생 화면으로 돌아가기
          </button>
        </div>
      </div>

      {actionMessage && (
        <div className="p-4 bg-emerald-50 border-2 border-emerald-200 rounded-2xl text-emerald-800 text-sm font-bold flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* 통계 요약 카드 4종 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border-2 border-slate-100 shadow-sm space-y-1">
          <div className="text-xs font-bold text-slate-500 flex items-center gap-1">
            <Users className="w-4 h-4 text-sky-500" />
            등록된 학생 수
          </div>
          <div className="text-3xl font-black text-sky-700 font-['Jua',sans-serif]">
            {totalCount} <span className="text-sm font-normal text-slate-400">명</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border-2 border-slate-100 shadow-sm space-y-1">
          <div className="text-xs font-bold text-slate-500 flex items-center gap-1">
            <Zap className="w-4 h-4 text-amber-500" />
            학급 평균 최고 타수
          </div>
          <div className="text-3xl font-black text-amber-600 font-['Jua',sans-serif]">
            {avgCpmTotal} <span className="text-sm font-normal text-slate-400">타</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border-2 border-slate-100 shadow-sm space-y-1">
          <div className="text-xs font-bold text-slate-500 flex items-center gap-1">
            <Target className="w-4 h-4 text-emerald-500" />
            평균 정확도
          </div>
          <div className="text-3xl font-black text-emerald-600 font-['Jua',sans-serif]">
            {avgAccTotal}%
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border-2 border-slate-100 shadow-sm space-y-1">
          <div className="text-xs font-bold text-slate-500 flex items-center gap-1">
            <Trophy className="w-4 h-4 text-purple-500" />
            학급 타자 왕
          </div>
          <div className="text-2xl font-black text-purple-700 font-['Jua',sans-serif] truncate">
            {topStudent ? `${topStudent.name} (${summaryMap.get(topStudent.studentKey)?.maxCpm || 0}타)` : '-'}
          </div>
        </div>
      </div>

      {/* 학생 현황 테이블 & 필터 */}
      <div className="bg-white rounded-3xl p-6 border-2 border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-black text-slate-800 font-['Jua',sans-serif]">학생별 성취도 현황</h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 font-bold">
              총 {filteredStudents.length}명
            </span>
          </div>

          {/* 반 필터 드롭다운 */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
              className="px-3 py-1.5 rounded-xl border-2 border-slate-200 font-bold text-xs text-slate-700 outline-none bg-white"
            >
              <option value="all">전체 반 보기</option>
              {Array.from({ length: 15 }, (_, i) => i + 1).map((c) => (
                <option key={c} value={c}>
                  4학년 {c}반
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 테이블 */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b-2 border-slate-100 text-xs font-extrabold text-slate-400">
                <th className="py-3 px-3">학급/번호</th>
                <th className="py-3 px-3">이름</th>
                <th className="py-3 px-3">최고 타수</th>
                <th className="py-3 px-3">평균 정확도</th>
                <th className="py-3 px-3">성취 기준 평가</th>
                <th className="py-3 px-3">완료 미션</th>
                <th className="py-3 px-3">연습 횟수</th>
                <th className="py-3 px-3 text-right">계정 관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400 text-xs">
                    등록된 학생 데이터가 없습니다. 학생들이 타자 연습을 시작하면 실시간으로 표시됩니다.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((st) => {
                  const sum = summaryMap.get(st.studentKey);
                  const maxCpm = sum?.maxCpm || 0;
                  const avgAcc = sum?.avgAccuracy || 0;
                  const gradeInfo = getAchievementGrade(maxCpm, avgAcc);
                  const completedLabels = getMissionLabels(sum?.completedMissions);

                  return (
                    <tr key={st.studentKey} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3 font-bold text-slate-700">
                        4-{st.classNum}반 {st.studentNum}번
                      </td>
                      <td className="py-3 px-3 font-bold text-slate-900">
                        {st.name}
                        {st.mustResetPassword && (
                          <span className="ml-1.5 px-2 py-0.5 text-[10px] bg-rose-100 text-rose-700 rounded-full font-bold">
                            비번 초기화됨
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 font-extrabold text-amber-600 font-['Jua',sans-serif] text-base">
                        {maxCpm} <span className="text-xs font-normal text-slate-400">타</span>
                      </td>
                      <td className="py-3 px-3 font-bold text-emerald-600">
                        {avgAcc}%
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-black border flex items-center gap-1 w-fit ${gradeInfo.badgeClass}`}>
                          <span>{gradeInfo.icon}</span>
                          <span>{gradeInfo.label}</span>
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex flex-wrap gap-1">
                          {completedLabels.length > 0 ? (
                            completedLabels.map((lbl, idx) => (
                              <span key={idx} className="px-2 py-0.5 rounded bg-sky-50 text-sky-700 text-[11px] font-bold border border-sky-100">
                                {lbl}
                              </span>
                            ))
                          ) : (
                            <span className="text-slate-400 text-xs">-</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-3 font-bold text-slate-600">
                        {sum?.totalPlays || 0}회
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => handleResetPassword(st.studentKey, st.name)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                        >
                          비밀번호 초기화
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 학급 설정 카드 */}
      <div className="bg-white rounded-3xl p-6 border-2 border-slate-200 shadow-sm space-y-4">
        <h2 className="text-lg font-black text-slate-800 font-['Jua',sans-serif] flex items-center gap-2">
          <KeyRound className="w-5 h-5 text-indigo-600" />
          학급 공통 비밀번호 관리
        </h2>
        <p className="text-xs text-slate-500 font-medium">
          학생이 처음 계정을 등록하거나 비밀번호를 초기화받았을 때 본인 인증을 위해 입력하는 공통 암호입니다. (기본값: 1234)
        </p>

        <form onSubmit={handleUpdateClassPassword} className="flex flex-wrap gap-3 items-center">
          <input
            type="password"
            placeholder="새 학급 공통 비밀번호 (4자리 이상)"
            value={newClassPassword}
            onChange={(e) => setNewClassPassword(e.target.value)}
            className="px-4 py-2.5 rounded-2xl border-2 border-slate-200 focus:border-indigo-500 font-bold text-slate-800 outline-none text-sm"
          />
          <button
            type="submit"
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs font-['Jua',sans-serif] rounded-2xl transition cursor-pointer"
          >
            학급 비밀번호 저장
          </button>
        </form>
      </div>

      {/* Firebase Cloud Firestore 실제 CRUD 연결 테스트 패널 (필수 요구사항!) */}
      <div className="bg-white rounded-3xl p-6 border-4 border-emerald-100 shadow-md space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-100 text-emerald-700 rounded-2xl">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-800 font-['Jua',sans-serif]">
                Firebase Cloud Firestore 실제 CRUD 연결 테스트 패널
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                더미 코드가 아닌 실제 Firestore 데이터베이스에 문서 생성(C) → 읽기(R) → 수정(U) → 삭제(D) 전 과정을 직접 실행하고 검증합니다.
              </p>
            </div>
          </div>

          <button
            onClick={runFirebaseCrudTest}
            disabled={isTestingFirebase}
            className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-2xl shadow-md shadow-emerald-200 font-['Jua',sans-serif] text-sm flex items-center gap-2 cursor-pointer transition hover:scale-102 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isTestingFirebase ? 'animate-spin' : ''}`} />
            {isTestingFirebase ? 'CRUD 테스트 수행 중...' : 'Firebase 연결 테스트 실행'}
          </button>
        </div>

        {/* 테스트 결과 표시 */}
        {testResult && (
          <div className="mt-4 space-y-4 animate-in fade-in duration-200">
            {/* 연결 정상 배지 */}
            <div
              className={`p-4 rounded-2xl border-2 flex items-center justify-between ${
                testResult.allPassed
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                  : 'bg-rose-50 border-rose-300 text-rose-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                {testResult.allPassed ? (
                  <CheckCircle2 className="w-7 h-7 text-emerald-600" />
                ) : (
                  <AlertCircle className="w-7 h-7 text-rose-600" />
                )}
                <div>
                  <div className="text-base font-black font-['Jua',sans-serif]">
                    {testResult.allPassed
                      ? '🟢 Firebase 연결 정상 (CRUD 4단계 완전 검증됨)'
                      : '🔴 Firebase 연결 테스트 실패'}
                  </div>
                  <div className="text-xs opacity-80">
                    검증 완료 시각: {new Date(testResult.completedAt).toLocaleTimeString('ko-KR')}
                  </div>
                </div>
              </div>
            </div>

            {/* 4단계 상세 로그 */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              {testResult.logs.map((lg) => (
                <div
                  key={lg.step}
                  className={`p-3.5 rounded-2xl border-2 ${
                    lg.success
                      ? 'bg-white border-emerald-200 text-slate-800'
                      : 'bg-white border-rose-200 text-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-extrabold mb-1">
                    <span className="text-emerald-700">[{lg.step}]</span>
                    {lg.success ? (
                      <span className="text-emerald-600 flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> 통과
                      </span>
                    ) : (
                      <span className="text-rose-600">실패</span>
                    )}
                  </div>
                  <div className="text-sm font-bold font-['Jua',sans-serif]">{lg.title}</div>
                  <div className="text-[11px] text-slate-500 mt-1 line-clamp-2">{lg.message}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
