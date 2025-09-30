# 🎾TennisMatcher

라이프 클럽 정기모임을 위한 자동 페어 매칭 프로그램

## 주요 기능

### 멤버 관리
- **라이프 멤버**: 클럽 멤버 데이터 저장, 참석 시 클릭으로 참가자 추가
- **게스트 입력**: 일회성 참가자 직접 입력

### 매칭 설정
- **참가자 수**: 8~20명 설정 가능
- **코트 수**: 1~4코트 지원
- **휴식자**: 라운드당 0~4명 설정

### 매칭 규칙

#### **잡복 방지 우선 정책**
- **16명/20명 시나리오에서 잡복 발생은 버그로 간주**
- 휴식자를 남녀 균등 선택하여 잡복 완전 차단
- 매칭 우선순위: **남복/여복 > 혼복** (남녀 모두 짝수일 때)

#### **균형 정책**
- **중복 허용**: 같은 타입 코트 중복 가능 (잡복 방지가 최우선)
- **휴식 순환**: 1인당 균등한 휴식 기회 제공

### 수동 매칭
- **라운드별 설정**: 특정 라운드 수동 매칭 가능
- **팀 구성**: 원하는 선수 4명 직접 선택
- **대표자 지정**: 클럽멤버 중 대표자 설정

## 데이터 구조

### 참가자 등록 시 입력 데이터
- **이름** (필수): 참가자 이름
- **성별** (필수): 남성/여성 선택  
- **타입** (필수): 클럽멤버/게스트 구분

### 클럽멤버 저장 데이터
- **이름**: 클럽멤버 이름
- **성별**: 남성/여성
- **등록일**: 자동 생성 (createdAt)

## 기술 스택 (확정x)
- React + Vite
- Firebase Firestore (데이터베이스)
- LocalStorage (백업 저장소)


## Firebase 설정

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCte9IbqzZGgBNQ_ukq7Jkv06R88fyywNE",
  authDomain: "tennis-matcher-de4ba.firebaseapp.com",
  projectId: "tennis-matcher-de4ba",
  storageBucket: "tennis-matcher-de4ba.firebasestorage.app",
  messagingSenderId: "234737028997",
  appId: "1:234737028997:web:35f1592a42b1530412feec",
  measurementId: "G-20RVQ2YMLH"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
```

## 실행 방법
```bash
npm install
npm run dev
```

## 주의사항
- Firebase 설정 없이는 클럽멤버 저장 기능이 LocalStorage로 동작합니다
- 인터넷 연결이 필요합니다 (Firestore 접근용)