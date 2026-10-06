import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { MissionSelector } from './components/MissionSelector';
import { AcidRainGame } from './components/AcidRainGame';
import { TargetCpmMission } from './components/TargetCpmMission';
import { ZeroErrorMission } from './components/ZeroErrorMission';
import { ResultModal } from './components/ResultModal';
import { StudentAuthModal } from './components/StudentAuthModal';
import { StudentSummaryView } from './components/StudentSummaryView';
import { TeacherDashboard } from './components/TeacherDashboard';
import { Student, StudentSummary, TypingRecord, MissionType } from './types';
import {
  db,
  getStudentDoc,
  getStudentSummary,
  saveTypingRecordAndSummary,
} from './firebase';
import { doc, getDocFromServer } from 'firebase/firestore';
import { setSoundEnabled, getSoundEnabled } from './koreanUtils';

export default function App() {
  const [currentStudent, setCurrentStudent] = useState<Student | null>(null);
  const [summary, setSummary] = useState<StudentSummary | null>(null);
  const [currentView, setCurrentView] = useState<'missions' | 'summary' | 'teacher'>('missions');
  const [activeMission, setActiveMission] = useState<MissionType | null>(null);

  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [soundOn, setSoundOn] = useState<boolean>(true);

  // 결과 모달 상태
  const [resultRecord, setResultRecord] = useState<TypingRecord | null>(null);
  const [saveStatus, setSaveStatus] = useState<'saving' | 'saved' | 'error'>('saved');

  // Firestore 초기 연결 상태 확인
  useEffect(() => {
    async function testInitialConnection() {
      try {
        await getDocFromServer(doc(db, 'settings', 'schoolConfig'));
      } catch (error) {
        if (error instanceof Error && error.message.includes('the client is offline')) {
          console.warn('Firestore offline or reconnecting:', error.message);
        }
      }
    }
    testInitialConnection();
  }, []);

  // 로컬스토리지에서 최근 로그인한 학생 정보 복원 & Firestore 최신 동기화
  useEffect(() => {
    const savedKey = localStorage.getItem('last_student_key');
    if (savedKey) {
      getStudentDoc(savedKey)
        .then((st) => {
          if (st) {
            setCurrentStudent(st);
            fetchStudentSummary(st.studentKey);
          }
        })
        .catch((err) => console.error(err));
    }
  }, []);

  const fetchStudentSummary = async (studentKey: string) => {
    try {
      const sum = await getStudentSummary(studentKey);
      if (sum) {
        setSummary(sum);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleLoginSuccess = (student: Student) => {
    setCurrentStudent(student);
    localStorage.setItem('last_student_key', student.studentKey);
    fetchStudentSummary(student.studentKey);
  };

  const handleLogout = () => {
    setCurrentStudent(null);
    setSummary(null);
    localStorage.removeItem('last_student_key');
  };

  const handleToggleSound = () => {
    const nextVal = !soundOn;
    setSoundOn(nextVal);
    setSoundEnabled(nextVal);
  };

  // 미션 완료 후 처리
  const handleFinishMission = async (
    recordData: Omit<TypingRecord, 'id' | 'studentKey' | 'studentName'>
  ) => {
    const fullRecord: TypingRecord = {
      ...recordData,
      studentKey: currentStudent?.studentKey || 'guest_2026',
      studentName: currentStudent?.name || '게스트 친구',
    };

    setResultRecord(fullRecord);
    setSaveStatus('saving');

    if (currentStudent) {
      try {
        await saveTypingRecordAndSummary(fullRecord, currentStudent);
        setSaveStatus('saved');
        fetchStudentSummary(currentStudent.studentKey);
      } catch (err) {
        console.error(err);
        setSaveStatus('error');
      }
    } else {
      // 비로그인 상태일 때는 로컬 완료 표시 후 로그인 권장
      setSaveStatus('saved');
    }
  };

  const handleRetryCurrentMission = () => {
    setResultRecord(null);
    // 현재 미션 다시 시작
  };

  const handleCloseResult = () => {
    setResultRecord(null);
    setActiveMission(null);
    setCurrentView('missions');
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col font-['Noto_Sans_KR',sans-serif] text-slate-800">
      {/* 글로벌 상단 헤더 */}
      <Navbar
        currentStudent={currentStudent}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onLogout={handleLogout}
        soundEnabled={soundOn}
        onToggleSound={handleToggleSound}
        currentView={currentView}
        onChangeView={(view) => {
          setActiveMission(null);
          setCurrentView(view);
        }}
      />

      {/* 메인 뷰 컨테이너 */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8">
        {/* 교사 대시보드 뷰 */}
        {currentView === 'teacher' && (
          <TeacherDashboard onExit={() => setCurrentView('missions')} />
        )}

        {/* 내 성취도 뷰 */}
        {currentView === 'summary' && (
          <StudentSummaryView
            student={currentStudent}
            summary={summary}
            onSelectMission={() => {
              setCurrentView('missions');
              setActiveMission(null);
            }}
            onOpenAuth={() => setIsAuthModalOpen(true)}
          />
        )}

        {/* 타자 미션 뷰 */}
        {currentView === 'missions' && (
          <>
            {/* 미션 선택 화면 */}
            {!activeMission && (
              <MissionSelector
                currentStudent={currentStudent}
                summary={summary}
                onSelectMission={(mission) => setActiveMission(mission)}
                onOpenAuth={() => setIsAuthModalOpen(true)}
              />
            )}

            {/* 미션 1: 단어 산성비 게임 */}
            {activeMission === 'acid_rain' && (
              <AcidRainGame
                onBack={() => setActiveMission(null)}
                onFinishGame={handleFinishMission}
              />
            )}

            {/* 미션 2: 타수 목표 달성 */}
            {activeMission === 'target_cpm' && (
              <TargetCpmMission
                onBack={() => setActiveMission(null)}
                onFinishGame={handleFinishMission}
              />
            )}

            {/* 미션 3: 오탈자 제로 미션 */}
            {activeMission === 'zero_error' && (
              <ZeroErrorMission
                onBack={() => setActiveMission(null)}
                onFinishGame={handleFinishMission}
              />
            )}
          </>
        )}
      </main>

      {/* 결과 모달 */}
      {resultRecord && (
        <ResultModal
          record={resultRecord}
          saveStatus={saveStatus}
          onRetry={handleRetryCurrentMission}
          onGoHome={handleCloseResult}
        />
      )}

      {/* 학생 로그인 & 신규 비밀번호 모달 */}
      <StudentAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      {/* 푸터 */}
      <footer className="mt-auto py-6 border-t border-slate-200/80 bg-white/60 text-center text-xs text-slate-500">
        <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-2 font-medium">
          <p>© 2026 초등학교 4학년 국어 교과 연계 한글 타자 연습 프로그램 • 4학년 국어 타자 왕</p>
          <div className="flex items-center gap-3">
            <span className="text-sky-600 font-bold">☁️ Firestore 클라우드 연동</span>
            <span>•</span>
            <button
              onClick={() => setCurrentView('teacher')}
              className="text-slate-600 hover:text-indigo-600 underline cursor-pointer"
            >
              선생님 전용 관리실
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
