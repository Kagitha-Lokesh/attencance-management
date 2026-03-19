import { doc, setDoc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

// 7.1 Save User Profile
export async function saveUserProfile(uid, profileData) {
  const ref = doc(db, 'users', uid);
  await setDoc(ref, { profile: profileData }, { merge: true });
}

export async function getUserSettings(uid) {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? snap.data() : null;
}

// 7.2 Save Setup Config
export async function saveSettings(uid, section, data) {
  const ref = doc(db, 'users', uid);
  // section = 'loginEmail' | 'logoutEmail' | 'timeConfig' |
  //           'googleForm' | 'workWeek' | 'holidays' | 'leaves'
  await setDoc(ref, { [section]: data, setupCompleted: true }, { merge: true });
}

// 7.3 Save Attendance Log
export async function saveAttendanceLog(uid, date, logData) {
  // date format: 'YYYY-MM-DD'
  const ref = doc(db, 'attendance', uid, 'logs', date);
  await setDoc(ref, logData, { merge: true });
}

export async function getAttendanceLogs(uid, year, month) {
  // month is 1-indexed (1=Jan, 12=Dec)
  const start = `${year}-${String(month).padStart(2,'0')}-01`;
  const end   = `${year}-${String(month).padStart(2,'0')}-31`;
  const ref = collection(db, 'attendance', uid, 'logs');
  const q = query(ref, where('date','>=',start), where('date','<=',end));
  const snap = await getDocs(q);
  return snap.docs.map(d => d.data());
}

export async function deleteAttendanceLog(uid, date) {
  const { deleteDoc } = await import('firebase/firestore');
  const ref = doc(db, 'attendance', uid, 'logs', date);
  await deleteDoc(ref);
}
