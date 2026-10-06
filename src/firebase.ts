import { initializeApp, getApps } from 'firebase/app';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { Student, TypingRecord, StudentSummary, AppSetting } from './types';

// Firebase 앱 초기화 (싱글톤)
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Firestore 인스턴스 (databaseId 필수 연동)
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    operationType,
    path,
  };
  console.error('Firestore Error:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// -------------------------------------------------------------
// 학생 (Students) CRUD
// -------------------------------------------------------------

export async function getStudentDoc(studentKey: string): Promise<Student | null> {
  const path = `students/${studentKey}`;
  try {
    const docRef = doc(db, 'students', studentKey);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    return snap.data() as Student;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return null;
  }
}

export async function saveStudentDoc(student: Student): Promise<void> {
  const path = `students/${student.studentKey}`;
  try {
    const docRef = doc(db, 'students', student.studentKey);
    await setDoc(docRef, student, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function resetStudentPassword(studentKey: string): Promise<void> {
  const path = `students/${studentKey}`;
  try {
    const docRef = doc(db, 'students', studentKey);
    await updateDoc(docRef, {
      mustResetPassword: true,
      passwordHash: '',
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function getAllStudents(): Promise<Student[]> {
  const path = 'students';
  try {
    const q = query(collection(db, 'students'), orderBy('classNum', 'asc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as Student);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}

// -------------------------------------------------------------
// 타자 기록 (Typing Records) & 학생 요약 (Student Summary)
// -------------------------------------------------------------

export async function saveTypingRecordAndSummary(
  record: Omit<TypingRecord, 'id'>,
  student: Student
): Promise<void> {
  try {
    // 1. typingRecords 컬렉션에 새 레코드 추가
    await addDoc(collection(db, 'typingRecords'), record);

    // 2. studentSummary 업데이트
    const summaryRef = doc(db, 'studentSummary', record.studentKey);
    const existingSnap = await getDoc(summaryRef);

    let summary: StudentSummary;
    if (existingSnap.exists()) {
      const prev = existingSnap.data() as StudentSummary;
      const completedSet = new Set(prev.completedMissions || []);
      if (record.isSuccess) {
        completedSet.add(record.missionType);
      }

      const totalPlays = (prev.totalPlays || 0) + 1;
      const maxCpm = Math.max(prev.maxCpm || 0, record.cpm);
      // 단순 누적 평균 정확도 추정
      const avgAccuracy = Math.round(((prev.avgAccuracy || 100) * (totalPlays - 1) + record.accuracy) / totalPlays);

      summary = {
        studentKey: record.studentKey,
        name: student.name,
        classNum: student.classNum,
        studentNum: student.studentNum,
        maxCpm,
        avgAccuracy,
        totalPlays,
        completedMissions: Array.from(completedSet),
        lastUpdated: record.timestamp,
      };
    } else {
      summary = {
        studentKey: record.studentKey,
        name: student.name,
        classNum: student.classNum,
        studentNum: student.studentNum,
        maxCpm: record.cpm,
        avgAccuracy: record.accuracy,
        totalPlays: 1,
        completedMissions: record.isSuccess ? [record.missionType] : [],
        lastUpdated: record.timestamp,
      };
    }

    await setDoc(summaryRef, summary, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `typingRecords / studentSummary`);
  }
}

export async function getStudentSummary(studentKey: string): Promise<StudentSummary | null> {
  const path = `studentSummary/${studentKey}`;
  try {
    const docRef = doc(db, 'studentSummary', studentKey);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    return snap.data() as StudentSummary;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return null;
  }
}

export async function getAllSummaries(): Promise<StudentSummary[]> {
  const path = 'studentSummary';
  try {
    const snap = await getDocs(collection(db, 'studentSummary'));
    return snap.docs.map((d) => d.data() as StudentSummary);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}

export async function getRecentRecordsForStudent(studentKey: string, maxLimit = 10): Promise<TypingRecord[]> {
  const path = 'typingRecords';
  try {
    const q = query(
      collection(db, 'typingRecords'),
      where('studentKey', '==', studentKey),
      orderBy('timestamp', 'desc'),
      limit(maxLimit)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<TypingRecord, 'id'>) }));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}

// -------------------------------------------------------------
// 설정 (Settings - 학급 공통 비밀번호 및 교사 비밀번호)
// -------------------------------------------------------------

export async function getAppSetting(): Promise<AppSetting | null> {
  const path = 'settings/schoolConfig';
  try {
    const docRef = doc(db, 'settings', 'schoolConfig');
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    return snap.data() as AppSetting;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return null;
  }
}

export async function saveAppSetting(setting: Partial<AppSetting>): Promise<void> {
  const path = 'settings/schoolConfig';
  try {
    const docRef = doc(db, 'settings', 'schoolConfig');
    await setDoc(docRef, { key: 'schoolConfig', ...setting }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// -------------------------------------------------------------
// 실제 Firestore CRUD 연결 테스트 함수 (교사용 대시보드 검증용)
// -------------------------------------------------------------

export interface CrudTestStepLog {
  step: 'CREATE' | 'READ' | 'UPDATE' | 'DELETE';
  title: string;
  success: boolean;
  message: string;
  time: string;
}

export interface CrudTestResult {
  allPassed: boolean;
  logs: CrudTestStepLog[];
  completedAt: string;
}

export async function testFirestoreCRUD(): Promise<CrudTestResult> {
  const logs: CrudTestStepLog[] = [];
  const testDocId = `test_${Date.now()}`;
  const testDocRef = doc(db, 'test_connection', testDocId);

  // 1. CREATE
  try {
    const payload = {
      status: 'pending',
      message: '연결 테스트용 임시 문서입니다.',
      timestamp: new Date().toISOString(),
    };
    await setDoc(testDocRef, payload);
    logs.push({
      step: 'CREATE',
      title: '문서 생성 (Create)',
      success: true,
      message: `test_connection/${testDocId} 문서 생성 성공`,
      time: new Date().toLocaleTimeString('ko-KR'),
    });
  } catch (err) {
    logs.push({
      step: 'CREATE',
      title: '문서 생성 (Create)',
      success: false,
      message: `생성 실패: ${err instanceof Error ? err.message : String(err)}`,
      time: new Date().toLocaleTimeString('ko-KR'),
    });
    return { allPassed: false, logs, completedAt: new Date().toISOString() };
  }

  // 2. READ
  try {
    const snap = await getDoc(testDocRef);
    if (!snap.exists() || snap.data()?.status !== 'pending') {
      throw new Error('문서를 읽었으나 데이터가 일치하지 않습니다.');
    }
    logs.push({
      step: 'READ',
      title: '문서 읽기 (Read)',
      success: true,
      message: `문서 조회 성공 (상태: ${snap.data()?.status})`,
      time: new Date().toLocaleTimeString('ko-KR'),
    });
  } catch (err) {
    logs.push({
      step: 'READ',
      title: '문서 읽기 (Read)',
      success: false,
      message: `읽기 실패: ${err instanceof Error ? err.message : String(err)}`,
      time: new Date().toLocaleTimeString('ko-KR'),
    });
    return { allPassed: false, logs, completedAt: new Date().toISOString() };
  }

  // 3. UPDATE
  try {
    await updateDoc(testDocRef, {
      status: 'verified',
      updatedAt: new Date().toISOString(),
    });
    const updatedSnap = await getDoc(testDocRef);
    if (updatedSnap.data()?.status !== 'verified') {
      throw new Error('수정된 값을 확인하지 못했습니다.');
    }
    logs.push({
      step: 'UPDATE',
      title: '문서 수정 (Update)',
      success: true,
      message: `문서 상태 'verified'로 업데이트 성공`,
      time: new Date().toLocaleTimeString('ko-KR'),
    });
  } catch (err) {
    logs.push({
      step: 'UPDATE',
      title: '문서 수정 (Update)',
      success: false,
      message: `수정 실패: ${err instanceof Error ? err.message : String(err)}`,
      time: new Date().toLocaleTimeString('ko-KR'),
    });
    return { allPassed: false, logs, completedAt: new Date().toISOString() };
  }

  // 4. DELETE
  try {
    await deleteDoc(testDocRef);
    const deletedSnap = await getDoc(testDocRef);
    if (deletedSnap.exists()) {
      throw new Error('문서가 정상적으로 삭제되지 않았습니다.');
    }
    logs.push({
      step: 'DELETE',
      title: '문서 삭제 (Delete)',
      success: true,
      message: `임시 테스트 문서 정리 및 삭제 완료`,
      time: new Date().toLocaleTimeString('ko-KR'),
    });
  } catch (err) {
    logs.push({
      step: 'DELETE',
      title: '문서 삭제 (Delete)',
      success: false,
      message: `삭제 실패: ${err instanceof Error ? err.message : String(err)}`,
      time: new Date().toLocaleTimeString('ko-KR'),
    });
    return { allPassed: false, logs, completedAt: new Date().toISOString() };
  }

  return {
    allPassed: true,
    logs,
    completedAt: new Date().toISOString(),
  };
}
