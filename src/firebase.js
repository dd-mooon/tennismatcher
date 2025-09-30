// Firebase 설정 파일
import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'

// Firebase 설정 완료! ✅
const firebaseConfig = {
  apiKey: "AIzaSyCte9IbqzZGgBNQ_ukq7Jkv06R88fyywNE",
  authDomain: "tennis-matcher-de4ba.firebaseapp.com",
  projectId: "tennis-matcher-de4ba",
  storageBucket: "tennis-matcher-de4ba.firebasestorage.app",
  messagingSenderId: "234737028997",
  appId: "1:234737028997:web:35f1592a42b1530412feec",
  measurementId: "G-20RVQ2YMLH"
}

// Firebase 초기화
const app = initializeApp(firebaseConfig)

// Firestore 데이터베이스 초기화
export const db = getFirestore(app)

export default app
