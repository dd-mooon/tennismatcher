import { useState, useEffect } from 'react'
import './App.css'
import { db } from './firebase'
import { collection, doc, getDocs, addDoc, deleteDoc, updateDoc } from 'firebase/firestore'

// ✅ 단순화된 매칭 설정: 인원별 고정 설정
const MATCH_SETTINGS = {
  20: { rest: 4, courts: 4, rounds: 5 },
  15: { rest: 3, courts: 3, rounds: 5 },
  10: { rest: 2, courts: 2, rounds: 5 }
}

function App() {
  const [participants, setParticipants] = useState([])
  const [manualMatches, setManualMatches] = useState({})
  const [matchingResults, setMatchingResults] = useState(null)
  const [newParticipant, setNewParticipant] = useState({ name: '', gender: 'male', type: 'guest' })
  const [totalParticipants, setTotalParticipants] = useState(20)
  const [restPlayersPerRound, setRestPlayersPerRound] = useState(4)
  const [maxCourts, setMaxCourts] = useState(4)
  const [clubMembers, setClubMembers] = useState([])
  const [savedClubMembers, setSavedClubMembers] = useState([])
  const [showClubMemberManager, setShowClubMemberManager] = useState(false)
  const [newClubMember, setNewClubMember] = useState({ name: '', gender: 'male' })
  
  // ✅ Python 알고리즘 포팅: 그룹 관리 및 이력 추적
  const [participantGroups, setParticipantGroups] = useState({}) // 참가자별 그룹 (A/B/guest)
  const [gameHistory, setGameHistory] = useState({}) // 게임 횟수 추적
  const [restHistory, setRestHistory] = useState({}) // 휴식 횟수 추적
  const [mixedHistory, setMixedHistory] = useState({}) // 혼복 참여 이력

  // 컴포넌트 마운트 시 Firebase에서 클럽멤버 불러오기
  useEffect(() => {
    const loadClubMembers = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'clubMembers'))
        const members = []
        querySnapshot.forEach((doc) => {
          members.push({ id: doc.id, ...doc.data() })
        })
        setSavedClubMembers(members)
      } catch (error) {
        console.error('클럽멤버 불러오기 실패:', error)
        // Firebase 실패 시 LocalStorage 폴백
        const saved = localStorage.getItem('tennisClubMembers')
        if (saved) {
          setSavedClubMembers(JSON.parse(saved))
        }
      }
    }
    loadClubMembers()
  }, [])

  // 클럽멤버 저장
  const saveClubMember = async (member) => {
    try {
      const docRef = await addDoc(collection(db, 'clubMembers'), {
        name: member.name,
        gender: member.gender,
        createdAt: new Date()
      })
      const newMember = { id: docRef.id, ...member }
      const newSavedMembers = [...savedClubMembers, newMember]
      setSavedClubMembers(newSavedMembers)
      
      // Firebase 성공 시 LocalStorage도 업데이트 (백업용)
      localStorage.setItem('tennisClubMembers', JSON.stringify(newSavedMembers))
    } catch (error) {
      console.error('클럽멤버 저장 실패:', error)
      // Firebase 실패 시 LocalStorage만 사용
      const memberWithId = { id: Date.now(), ...member }
      const newSavedMembers = [...savedClubMembers, memberWithId]
      setSavedClubMembers(newSavedMembers)
      localStorage.setItem('tennisClubMembers', JSON.stringify(newSavedMembers))
    }
  }

  // 클럽멤버 삭제
  const removeSavedClubMember = async (id) => {
    try {
      await deleteDoc(doc(db, 'clubMembers', id))
      const newSavedMembers = savedClubMembers.filter(m => m.id !== id)
      setSavedClubMembers(newSavedMembers)
      
      // Firebase 성공 시 LocalStorage도 업데이트 (백업용)
      localStorage.setItem('tennisClubMembers', JSON.stringify(newSavedMembers))
    } catch (error) {
      console.error('클럽멤버 삭제 실패:', error)
      // Firebase 실패 시 LocalStorage만 사용
      const newSavedMembers = savedClubMembers.filter(m => m.id !== id)
      setSavedClubMembers(newSavedMembers)
      localStorage.setItem('tennisClubMembers', JSON.stringify(newSavedMembers))
    }
  }

  // 저장된 클럽멤버를 현재 참가자에 추가
  const addSavedClubMember = (member) => {
    if (participants.length < totalParticipants) {
      const participant = { ...member, id: Date.now(), type: 'club' }
      setParticipants([...participants, participant])
      setClubMembers([...clubMembers, participant])
    }
  }

  // 클럽멤버 직접 등록
  const addNewClubMember = async () => {
    if (newClubMember.name.trim()) {
      const member = {
        name: newClubMember.name.trim(),
        gender: newClubMember.gender
      }
      
      // 중복 체크
      const isDuplicate = savedClubMembers.some(m => m.name === member.name)
      if (!isDuplicate) {
        await saveClubMember(member)
        setNewClubMember({ name: '', gender: 'male' })
      } else {
        alert('이미 등록된 클럽멤버입니다.')
      }
    }
  }

  // 참가자 추가
  const addParticipant = async () => {
    if (newParticipant.name.trim() && participants.length < totalParticipants) {
      const participant = { 
        id: Date.now(), 
        name: newParticipant.name.trim(), 
        gender: newParticipant.gender,
        type: newParticipant.type
      }
      
      setParticipants([...participants, participant])
      
      // ✅ 그룹 할당 (클럽멤버는 A그룹 기본, 게스트는 guest)
      setParticipantGroups(prev => ({
        ...prev,
        [participant.id]: newParticipant.type === 'club' ? 'A' : 'guest'
      }))
      
      // 클럽멤버인 경우 클럽멤버 리스트에도 추가하고 저장
      if (newParticipant.type === 'club') {
        setClubMembers([...clubMembers, participant])
        // 중복 체크 후 저장
        const isDuplicate = savedClubMembers.some(m => m.name === participant.name)
        if (!isDuplicate) {
          await saveClubMember({ name: participant.name, gender: participant.gender })
        }
      }
      
      setNewParticipant({ name: '', gender: 'male', type: 'guest' })
    }
  }

  // ✅ 참가자 그룹 변경
  const changeParticipantGroup = (participantId, newGroup) => {
    setParticipantGroups(prev => ({
      ...prev,
      [participantId]: newGroup
    }))
  }

  // 참가자 삭제
  const removeParticipant = (id) => {
    const participant = participants.find(p => p.id === id)
    setParticipants(participants.filter(p => p.id !== id))
    
    // 클럽멤버인 경우 클럽멤버 리스트에서도 제거
    if (participant && participant.type === 'club') {
      setClubMembers(clubMembers.filter(p => p.id !== id))
    }
  }

  // ✅ Python 포팅: Cross-pair swap 잡복 방지 로직
  const swapIfNeeded = (previousRound, currentRound, maxAttempts = 20) => {
    let attempt = 0
    let swapWarning = false
    
    while (attempt < maxAttempts) {
      let needRetry = false
      
      for (const prevMatch of previousRound) {
        for (const currMatch of currentRound) {
          const prevPlayers = [...prevMatch.team1, ...prevMatch.team2]
          const currPlayers = [...currMatch.team1, ...currMatch.team2]
          const commonPlayers = prevPlayers.filter(p1 => 
            currPlayers.some(p2 => p1.id === p2.id)
          )
          
          if (commonPlayers.length >= 3 && currPlayers.length >= 4) {
            // Cross-pair swap: p1,p2,p3,p4 → p1,p3,p2,p4
            const temp = currMatch.team1[1]
            currMatch.team1[1] = currMatch.team2[0]
            currMatch.team2[0] = temp
            needRetry = true
          }
        }
      }
      
      if (!needRetry) break
      attempt++
    }
    
    if (attempt >= maxAttempts) {
      swapWarning = true
    }
    
    return [currentRound, swapWarning]
  }

  // ✅ 단순화된 동적 매칭 알고리즘
  const generateMatches = () => {
    console.log('=== 동적 매칭 알고리즘 시작 ===')
    
    if (participants.length !== totalParticipants) {
      alert(`정확히 ${totalParticipants}명의 참가자가 필요합니다. 현재 ${participants.length}명입니다.`)
      return
    }

    // ✅ 지원되는 인원만 허용
    if (![10, 15, 20].includes(totalParticipants)) {
      alert('10명, 15명, 20명만 지원됩니다.')
      return
    }

    const malePlayers = participants.filter(p => p.gender === 'male')
    const femalePlayers = participants.filter(p => p.gender === 'female')
    const numMale = malePlayers.length
    const numFemale = femalePlayers.length
    const settings = MATCH_SETTINGS[totalParticipants]
    
    console.log(`참가자: 남 ${numMale}, 여 ${numFemale}`)
    console.log('매칭 설정:', settings)

    // ✅ 남녀 비율 분석 및 매칭 전략 결정
    const genderDiff = Math.abs(numMale - numFemale)
    const isGenderBalanced = genderDiff <= 2 // 차이 2명 이하면 균등
    
    console.log(`남녀 차이: ${genderDiff}명, 균등 여부: ${isGenderBalanced}`)
    
    // ✅ 그룹 정보 및 이력 초기화
    const groupDict = {}
    participants.forEach(p => {
      groupDict[p.id] = participantGroups[p.id] || (p.type === 'guest' ? 'guest' : 'A')
    })
    
    const restCount = {}
    const gameCount = {}
    const mixedPlayed = {}
    
    participants.forEach(p => {
      restCount[p.id] = 0
      gameCount[p.id] = 0
      mixedPlayed[p.id] = 0
    })
    
    const results = []
    let previousRound = []
    
    // ✅ 5라운드 단순 반복 매칭
    for (let round = 1; round <= settings.rounds; round++) {
      console.log(`\n--- 라운드 ${round} 시작 ---`)
      
      // ✅ 휴식자 선정 (성별 균형 고려 + 휴식 횟수 우선)
      const maleCandidates = malePlayers.sort((a, b) => restCount[a.id] - restCount[b.id])
      const femaleCandidates = femalePlayers.sort((a, b) => restCount[a.id] - restCount[b.id])
      
      // 휴식자를 성별 균형있게 선택
      const restMaleCount = Math.floor(settings.rest / 2)
      const restFemaleCount = settings.rest - restMaleCount
      
      const restMales = maleCandidates.slice(0, Math.min(restMaleCount, maleCandidates.length))
      const restFemales = femaleCandidates.slice(0, Math.min(restFemaleCount, femaleCandidates.length))
      
      // 부족한 휴식자가 있으면 다른 성별에서 충당
      let restThisRound = [...restMales, ...restFemales]
      
      if (restThisRound.length < settings.rest) {
        const remaining = settings.rest - restThisRound.length
        const otherCandidates = participants
          .filter(p => !restThisRound.includes(p))
          .sort((a, b) => restCount[a.id] - restCount[b.id])
        restThisRound = [...restThisRound, ...otherCandidates.slice(0, remaining)]
      }
      
      const activePlayers = participants.filter(p => !restThisRound.includes(p))
      
      console.log(`휴식자 성별 구성: 남 ${restThisRound.filter(p => p.gender === 'male').length}, 여 ${restThisRound.filter(p => p.gender === 'female').length}`)
      
      // 휴식자 카운트 증가
      restThisRound.forEach(p => { restCount[p.id] = restCount[p.id] + 1 })
      
      const activeMen = activePlayers.filter(p => p.gender === 'male')
      const activeWomen = activePlayers.filter(p => p.gender === 'female')
      
      console.log(`활동 인원: 남 ${activeMen.length}, 여 ${activeWomen.length}`)
      console.log(`휴식자: ${restThisRound.map(p => p.name).join(', ')}`)
      console.log(`코트 설정: ${settings.courts}코트, 필요 인원: ${settings.courts * 4}명, 실제 활동 인원: ${activePlayers.length}명`)
      
      // ✅ 동적 매칭 전략 결정 + 클럽멤버 우선 배치
      const matchList = []
      
      // 클럽멤버와 게스트 분리 (성별별로)
      const activeMenClub = activeMen.filter(p => p.type === 'club').sort((a, b) => gameCount[a.id] - gameCount[b.id])
      const activeMenGuest = activeMen.filter(p => p.type === 'guest').sort((a, b) => gameCount[a.id] - gameCount[b.id])
      const activeWomenClub = activeWomen.filter(p => p.type === 'club').sort((a, b) => gameCount[a.id] - gameCount[b.id])
      const activeWomenGuest = activeWomen.filter(p => p.type === 'guest').sort((a, b) => gameCount[a.id] - gameCount[b.id])
      
      // 클럽멤버 우선 배치를 위해 섞어서 정렬
      let remainingMen = [...activeMenClub, ...activeMenGuest]
      let remainingWomen = [...activeWomenClub, ...activeWomenGuest]
      
      console.log(`클럽멤버 분포: 남자 클럽 ${activeMenClub.length}, 여자 클럽 ${activeWomenClub.length}`)
      
      // 총 코트 수만큼 매칭 생성  
      for (let court = 1; court <= settings.courts; court++) {
        // 각 코트마다 4명이 필요하므로 남은 인원이 4명 미만이면 해당 코트는 스킵
        if (remainingMen.length + remainingWomen.length < 4) {
          console.log(`코트 ${court}: 인원 부족 (남 ${remainingMen.length}, 여 ${remainingWomen.length})`)
          break
        }
        
        let team1 = [], team2 = []
        
        // ✅ 매칭 전략: 여복/남복/혼복을 적당히 섞어서 배치
        // 코트별로 다양한 매칭 타입 생성 (라운드와 코트 번호 기준으로 패턴 생성)
        const matchPattern = (round === 1) ? 0 : (round + court) % 3 // 1라운드에서는 여복/남복 우선

        if (matchPattern === 0 && remainingWomen.length >= 4) {
          // 패턴 0: 여복 우선
          console.log(`코트 ${court}: 여복 매칭 (패턴)`)
          team1 = [remainingWomen.shift(), remainingWomen.shift()]
          team2 = [remainingWomen.shift(), remainingWomen.shift()]
        }
        else if (matchPattern === 1 && remainingMen.length >= 4) {
          // 패턴 1: 남복 우선
          console.log(`코트 ${court}: 남복 매칭 (패턴)`)
          team1 = [remainingMen.shift(), remainingMen.shift()]
          team2 = [remainingMen.shift(), remainingMen.shift()]
        }
        else if (matchPattern === 2 && remainingMen.length >= 2 && remainingWomen.length >= 2) {
          // 패턴 2: 혼복 우선
          console.log(`코트 ${court}: 혼복 매칭 (패턴)`)
          team1 = [remainingMen.shift(), remainingWomen.shift()]
          team2 = [remainingMen.shift(), remainingWomen.shift()]
          // 혼복 이력 기록
          team1.forEach(p => { mixedPlayed[p.id] = mixedPlayed[p.id] + 1 })
          team2.forEach(p => { mixedPlayed[p.id] = mixedPlayed[p.id] + 1 })
        }
        // 패턴 매칭이 안되면 가능한 것 중에서 선택 (폴백)
        else if (remainingWomen.length >= 4) {
          console.log(`코트 ${court}: 여복 매칭 (폴백)`)
          team1 = [remainingWomen.shift(), remainingWomen.shift()]
          team2 = [remainingWomen.shift(), remainingWomen.shift()]
        }
        else if (remainingMen.length >= 4) {
          console.log(`코트 ${court}: 남복 매칭 (폴백)`)
          team1 = [remainingMen.shift(), remainingMen.shift()]
          team2 = [remainingMen.shift(), remainingMen.shift()]
        }
        else if (remainingMen.length >= 2 && remainingWomen.length >= 2) {
          console.log(`코트 ${court}: 혼복 매칭 (폴백)`)
          team1 = [remainingMen.shift(), remainingWomen.shift()]
          team2 = [remainingMen.shift(), remainingWomen.shift()]
          // 혼복 이력 기록
          team1.forEach(p => { mixedPlayed[p.id] = mixedPlayed[p.id] + 1 })
          team2.forEach(p => { mixedPlayed[p.id] = mixedPlayed[p.id] + 1 })
        }
        
        if (team1.length === 2 && team2.length === 2) {
          // ✅ 각 코트마다 클럽멤버 최소 1명 보장
          const allMatchPlayers = [...team1, ...team2]
          const clubMembersInMatch = allMatchPlayers.filter(p => p.type === 'club')
          
          // 클럽멤버가 없으면 남은 인원에서 클럽멤버 찾아서 교체
          if (clubMembersInMatch.length === 0) {
            console.log(`⚠️ 코트 ${court}: 클럽멤버 없음, 교체 필요`)
            
            // 남은 인원 중에서 클럽멤버 찾기
            const availableClubMen = remainingMen.filter(p => p.type === 'club')
            const availableClubWomen = remainingWomen.filter(p => p.type === 'club')
            
            // 교체 시도 (같은 성별끼리만 교체)
            if (availableClubMen.length > 0 && (team1.some(p => p.gender === 'male') || team2.some(p => p.gender === 'male'))) {
              // 남자 게스트와 클럽멤버 교체
              const guestMale = allMatchPlayers.find(p => p.gender === 'male' && p.type === 'guest')
              if (guestMale) {
                const clubMale = availableClubMen.shift()
                
                // 팀에서 교체
                if (team1.includes(guestMale)) {
                  team1[team1.indexOf(guestMale)] = clubMale
                } else {
                  team2[team2.indexOf(guestMale)] = clubMale
                }
                
                // 남은 인원 목록에서 제거하고 추가
                remainingMen = remainingMen.filter(p => p.id !== clubMale.id)
                remainingMen.push(guestMale)
                console.log(`✅ 남자 교체: ${guestMale.name}(게스트) ↔ ${clubMale.name}(클럽)`)
              }
            }
            else if (availableClubWomen.length > 0 && (team1.some(p => p.gender === 'female') || team2.some(p => p.gender === 'female'))) {
              // 여자 게스트와 클럽멤버 교체
              const guestFemale = allMatchPlayers.find(p => p.gender === 'female' && p.type === 'guest')
              if (guestFemale) {
                const clubFemale = availableClubWomen.shift()
                
                // 팀에서 교체
                if (team1.includes(guestFemale)) {
                  team1[team1.indexOf(guestFemale)] = clubFemale
                } else {
                  team2[team2.indexOf(guestFemale)] = clubFemale
                }
                
                // 남은 인원 목록에서 제거하고 추가
                remainingWomen = remainingWomen.filter(p => p.id !== clubFemale.id)
                remainingWomen.push(guestFemale)
                console.log(`✅ 여자 교체: ${guestFemale.name}(게스트) ↔ ${clubFemale.name}(클럽)`)
              }
            }
          }
          
          // 게임 횟수 증가
          team1.forEach(p => { gameCount[p.id] = gameCount[p.id] + 1 })
          team2.forEach(p => { gameCount[p.id] = gameCount[p.id] + 1 })
          
          // 대표자 선정 (클럽멤버 중 랜덤)
          const finalAllPlayers = [...team1, ...team2]
          const finalClubMembers = finalAllPlayers.filter(p => p.type === 'club')
          const representative = finalClubMembers.length > 0 
            ? finalClubMembers[Math.floor(Math.random() * finalClubMembers.length)]
            : null
          
          console.log(`코트 ${court} 구성: 클럽 ${finalClubMembers.length}명, 게스트 ${4 - finalClubMembers.length}명`)
          
          matchList.push({
            type: 'match',
            team1,
            team2,
            court,
            representative
          })
        }
      }
      
      // ✅ Cross-pair swap 적용
      const [swappedMatches, swapWarning] = swapIfNeeded(previousRound, matchList)
      
      // ✅ 라운드 결과 저장
      const roundMatches = swappedMatches.map(match => ({
        court: match.court,
        team1: match.team1,
        team2: match.team2,
        representative: match.representative
      }))
      
      results.push({
        round,
        matches: roundMatches,
        restPlayers: restThisRound
      })
      
      previousRound = matchList
      
      console.log(`라운드 ${round} 완료: ${roundMatches.length}경기/${settings.courts}코트 (사용률: ${Math.round(roundMatches.length/settings.courts*100)}%), 휴식 ${restThisRound.length}명`)
      
      // ✅ 코트 사용률 체크
      if (roundMatches.length < settings.courts) {
        console.warn(`⚠️ 코트 미사용 발생! ${settings.courts}코트 중 ${roundMatches.length}코트만 사용`)
        console.log('매칭 완료 시점 잔여 인원:', {
          men: remainingMen.length,
          women: remainingWomen.length,
          total: remainingMen.length + remainingWomen.length
        })
      }
    }
    
    console.log('✅ 매칭 생성 완료')
    setMatchingResults(results)
    
    // 이력 저장
    setGameHistory(gameCount)
    setRestHistory(restCount)
    setMixedHistory(mixedPlayed)
  }

  // 수동 매칭 설정
  const setManualMatch = (round, court, player1, player2, player3, player4, representative) => {
    setManualMatches({
      ...manualMatches,
      [round]: { court, player1, player2, player3, player4, representative }
    })
  }

  // 코트 타입 판단 함수 (코트 전체 구성)
  const getCourtType = (match) => {
    if (!match || !match.team1 || !match.team2) return 'jabok-court'
    
    const allPlayers = [...match.team1, ...match.team2]
    const genders = allPlayers.map(player => player?.gender).filter(Boolean)
    
    if (genders.length !== 4) return 'jabok-court'
    
    const maleCount = genders.filter(g => g === 'male').length
    const femaleCount = genders.filter(g => g === 'female').length
    
    if (maleCount === 4) return 'male-court'
    if (femaleCount === 4) return 'female-court'
    if (maleCount === 2 && femaleCount === 2) return 'mixed-court'
    
    // 어쩔 수 없는 경우 (1남3여, 3남1여 등) 잡복으로 분류
    return 'jabok-court'
  }

  // 코트 타입 텍스트 함수
  const getCourtTypeText = (match) => {
    if (!match || !match.team1 || !match.team2) return '잡복'
    
    const allPlayers = [...match.team1, ...match.team2]
    const genders = allPlayers.map(player => player?.gender).filter(Boolean)
    
    if (genders.length !== 4) return '잡복'
    
    const maleCount = genders.filter(g => g === 'male').length
    const femaleCount = genders.filter(g => g === 'female').length
    
    if (maleCount === 4) return '남복'
    if (femaleCount === 4) return '여복'
    if (maleCount === 2 && femaleCount === 2) return '혼복'
    
    // 어쩔 수 없는 경우 (1남3여, 3남1여 등) 잡복으로 표시
    return '잡복'
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>🎾 테니스 페어 매칭 시스템</h1>
        <p>{totalParticipants}명 기준 • {maxCourts}코트 • 5라운드 • 휴식 {restPlayersPerRound}명 (남녀 비율 기반 동적 매칭)</p>
      </header>

      <div className="main-content">
        {/* 참가자 등록 섹션 */}
        <section className="participants-section">
          <h2>참가자 등록 ({participants.length}/{totalParticipants})</h2>
          <div className="gender-stats">
            <span className="male-count">남자: {participants.filter(p => p.gender === 'male').length}명</span>
            <span className="female-count">여자: {participants.filter(p => p.gender === 'female').length}명</span>
          </div>
          
          <div className="settings-selectors">
            <div className="participant-count-selector">
              <label>총 참가자 수:</label>
              <select 
                value={totalParticipants} 
                onChange={(e) => {
                  const newCount = parseInt(e.target.value)
                  setTotalParticipants(newCount)
                  
                  // 참가자 수가 줄어들면 초과하는 참가자들 제거
                  if (participants.length > newCount) {
                    setParticipants(participants.slice(0, newCount))
                  }
                  
                  // ✅ 인원별 휴식자 수와 코트 수 자동 설정
                  if (newCount === 20) {
                    setRestPlayersPerRound(4)
                    setMaxCourts(4)
                  } else if (newCount === 15) {
                    setRestPlayersPerRound(3)
                    setMaxCourts(3)
                  } else if (newCount === 10) {
                    setRestPlayersPerRound(2)
                    setMaxCourts(2)
                  }
                }}
              >
                <option value={20}>20명</option>
                <option value={15}>15명</option>
                <option value={10}>10명</option>
              </select>
            </div>
            
            <div className="rest-count-display">
              <label>라운드당 휴식자 수:</label>
              <span className="auto-setting">{restPlayersPerRound}명 (자동 설정)</span>
            </div>
            
            <div className="court-count-display">
              <label>코트 수:</label>
              <span className="auto-setting">{maxCourts}코트 (자동 설정)</span>
            </div>
          </div>
          
          <div className="add-participant">
            <input
              type="text"
              placeholder="이름을 입력하세요"
              value={newParticipant.name}
              onChange={(e) => setNewParticipant({...newParticipant, name: e.target.value})}
              onKeyPress={(e) => e.key === 'Enter' && addParticipant()}
            />
            <select
              value={newParticipant.gender}
              onChange={(e) => setNewParticipant({...newParticipant, gender: e.target.value})}
            >
              <option value="male">남성</option>
              <option value="female">여성</option>
            </select>
            <select
              value={newParticipant.type}
              onChange={(e) => setNewParticipant({...newParticipant, type: e.target.value})}
            >
              <option value="guest">게스트</option>
              <option value="club">클럽멤버</option>
            </select>
            <button onClick={addParticipant} disabled={participants.length >= totalParticipants}>
              추가
            </button>
          </div>

          <div className="participants-list">
            {participants.map((participant) => (
              <div key={participant.id} className="participant-item">
                <span className={`gender-badge ${participant.gender}`}>
                  {participant.gender === 'male' ? '남' : '여'}
                </span>
                <span className={`type-badge ${participant.type}`}>
                  {participant.type === 'club' ? '클럽' : '게스트'}
                </span>
                <span className="name">{participant.name} ({participant.gender === 'male' ? '남' : '여'})</span>
                
                {/* ✅ 그룹 선택 기능 추가 */}
                {participant.type === 'club' && (
                  <select 
                    value={participantGroups[participant.id] || 'A'} 
                    onChange={(e) => changeParticipantGroup(participant.id, e.target.value)}
                    className="group-select"
                  >
                    <option value="A">A그룹</option>
                    <option value="B">B그룹</option>
                  </select>
                )}
                {participant.type === 'guest' && (
                  <span className="guest-group-badge">게스트</span>
                )}
                
                <button onClick={() => removeParticipant(participant.id)}>삭제</button>
              </div>
            ))}
          </div>
          
          {/* 클럽멤버 정보 */}
          {clubMembers.length > 0 && (
            <div className="club-members-info">
              <h3>현재 참가 클럽멤버 ({clubMembers.length}명)</h3>
              <div className="club-members-list">
                {clubMembers.map((member) => (
                  <span key={member.id} className="club-member-item">
                    {member.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 클럽멤버 관리 */}
          <div className="club-member-manager">
            <div className="manager-header">
              <h3>클럽멤버 관리</h3>
              <button 
                onClick={() => setShowClubMemberManager(!showClubMemberManager)}
                className="toggle-btn"
              >
                {showClubMemberManager ? '닫기' : '관리하기'}
              </button>
            </div>
            
            {showClubMemberManager && (
              <div className="manager-content">
                {/* 새 클럽멤버 등록 */}
                <div className="add-club-member-section">
                  <h4>새 클럽멤버 등록</h4>
                  <div className="add-club-member-form">
                    <input
                      type="text"
                      placeholder="클럽멤버 이름을 입력하세요"
                      value={newClubMember.name}
                      onChange={(e) => setNewClubMember({...newClubMember, name: e.target.value})}
                      onKeyPress={(e) => e.key === 'Enter' && addNewClubMember()}
                    />
                    <select
                      value={newClubMember.gender}
                      onChange={(e) => setNewClubMember({...newClubMember, gender: e.target.value})}
                    >
                      <option value="male">남성</option>
                      <option value="female">여성</option>
                    </select>
                    <button onClick={addNewClubMember}>
                      등록
                    </button>
                  </div>
                </div>

                {/* 저장된 클럽멤버 목록 */}
                <div className="saved-members-section">
                  <h4>저장된 클럽멤버 ({savedClubMembers.length}명)</h4>
                  <div className="saved-members-list">
                    {savedClubMembers.map((member) => (
                      <div key={member.id} className="saved-member-item">
                        <span className={`gender-badge ${member.gender}`}>
                          {member.gender === 'male' ? '남' : '여'}
                        </span>
                        <span className="name">{member.name}</span>
                        <button 
                          onClick={() => addSavedClubMember(member)}
                          disabled={participants.length >= totalParticipants || participants.some(p => p.name === member.name)}
                          className="add-btn"
                        >
                          추가
                        </button>
                        <button 
                          onClick={() => removeSavedClubMember(member.id)}
                          className="remove-btn"
                        >
                          삭제
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* 수동 매칭 섹션 */}
        <section className="manual-matching-section">
          <h2>수동 매칭 설정</h2>
          <div className="manual-match-inputs">
            <select onChange={(e) => {
              const round = parseInt(e.target.value)
              if (round) {
                setManualMatches({
                  ...manualMatches,
                  [round]: {
                    court: 1,
                    player1: '',
                    player2: '',
                    player3: '',
                    player4: ''
                  }
                })
              }
            }}>
              <option value="">라운드 선택</option>
              {[1,2,3,4,5].map(round => (
                <option key={round} value={round}>라운드 {round}</option>
              ))}
            </select>
          </div>
          
          {Object.keys(manualMatches).map(round => {
            const roundNum = parseInt(round)
            const match = manualMatches[roundNum]
            return (
              <div key={round} className="manual-match-form">
                <h3>라운드 {roundNum} 수동 매칭</h3>
                <div className="match-inputs">
                  <div className="court-select">
                    <label>코트:</label>
                    <select 
                      value={match.court} 
                      onChange={(e) => setManualMatches({
                        ...manualMatches,
                        [roundNum]: {...match, court: parseInt(e.target.value)}
                      })}
                    >
                      {[1,2,3,4].map(court => (
                        <option key={court} value={court}>코트 {court}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="team-inputs">
                    <div className="team">
                      <h4>팀 1</h4>
                      <select 
                        value={match.player1} 
                        onChange={(e) => {
                          console.log('선수 1 선택:', e.target.value, '현재 participants:', participants)
                          setManualMatches({
                            ...manualMatches,
                            [roundNum]: {...match, player1: e.target.value}
                          })
                        }}
                      >
                        <option value="">선수 선택</option>
                        {participants.filter(p => 
                          ![match.player2, match.player3, match.player4].includes(p.name)
                        ).map(p => (
                          <option key={p.id} value={p.name}>
                            {p.name} ({p.gender === 'male' ? '남' : '여'}, {p.type === 'club' ? '클럽' : '게스트'})
                          </option>
                        ))}
                      </select>
                      <select 
                        value={match.player2} 
                        onChange={(e) => setManualMatches({
                          ...manualMatches,
                          [roundNum]: {...match, player2: e.target.value}
                        })}
                      >
                        <option value="">선수 선택</option>
                        {participants.filter(p => 
                          ![match.player1, match.player3, match.player4].includes(p.name)
                        ).map(p => (
                          <option key={p.id} value={p.name}>
                            {p.name} ({p.gender === 'male' ? '남' : '여'}, {p.type === 'club' ? '클럽' : '게스트'})
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="team">
                      <h4>팀 2</h4>
                      <select 
                        value={match.player3} 
                        onChange={(e) => setManualMatches({
                          ...manualMatches,
                          [roundNum]: {...match, player3: e.target.value}
                        })}
                      >
                        <option value="">선수 선택</option>
                        {participants.filter(p => 
                          ![match.player1, match.player2, match.player4].includes(p.name)
                        ).map(p => (
                          <option key={p.id} value={p.name}>
                            {p.name} ({p.gender === 'male' ? '남' : '여'}, {p.type === 'club' ? '클럽' : '게스트'})
                          </option>
                        ))}
                      </select>
                      <select 
                        value={match.player4} 
                        onChange={(e) => setManualMatches({
                          ...manualMatches,
                          [roundNum]: {...match, player4: e.target.value}
                        })}
                      >
                        <option value="">선수 선택</option>
                        {participants.filter(p => 
                          ![match.player1, match.player2, match.player3].includes(p.name)
                        ).map(p => (
                          <option key={p.id} value={p.name}>
                            {p.name} ({p.gender === 'male' ? '남' : '여'}, {p.type === 'club' ? '클럽' : '게스트'})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  <div className="representative-select">
                    <label>대표자 선택:</label>
                    <select 
                      value={match.representative || ''} 
                      onChange={(e) => setManualMatches({
                        ...manualMatches,
                        [roundNum]: {...match, representative: e.target.value}
                      })}
                    >
                      <option value="">대표자 선택</option>
                      {[match.player1, match.player2, match.player3, match.player4]
                        .filter(name => name && participants.find(p => p.name === name && p.type === 'club'))
                        .map(name => {
                          const player = participants.find(p => p.name === name)
                          return (
                            <option key={name} value={name}>
                              {name} ({player?.gender === 'male' ? '남' : '여'}, 클럽)
                            </option>
                          )
                        })}
                    </select>
                  </div>
                  
                  <button 
                    onClick={() => {
                      const newMatches = {...manualMatches}
                      delete newMatches[roundNum]
                      setManualMatches(newMatches)
                    }}
                    className="remove-manual-match"
                  >
                    수동 매칭 제거
                  </button>
                </div>
      </div>
            )
          })}
        </section>

        {/* 매칭 생성 버튼 */}
        <div className="generate-section">
          <button 
            className="generate-btn"
            onClick={generateMatches}
            disabled={participants.length !== totalParticipants}
          >
            매칭 생성하기
        </button>
        </div>

        {/* 결과 표시 섹션 */}
        {matchingResults && (
          <section className="results-section">
            <h2>🎾 매칭 결과</h2>
            
            {/* ✅ 매칭 통계 정보 */}
            <div className="matching-stats">
              <h3>📊 매칭 통계</h3>
              <div className="stats-grid">
                <div className="stat-item">
                  <span className="stat-label">총 참가자</span>
                  <span className="stat-value">{participants.length}명</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">남녀 비율</span>
                  <span className="stat-value">
                    남 {participants.filter(p => p.gender === 'male').length} : 
                    여 {participants.filter(p => p.gender === 'female').length}
                  </span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">클럽 vs 게스트</span>
                  <span className="stat-value">
                    클럽 {participants.filter(p => p.type === 'club').length} : 
                    게스트 {participants.filter(p => p.type === 'guest').length}
                  </span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">총 라운드</span>
                  <span className="stat-value">{matchingResults.length}라운드</span>
                </div>
                
                {/* 매칭 타입별 통계 */}
                <div className="match-type-stats">
                  {(() => {
                    const typeStats = { mixed: 0, men: 0, women: 0 }
                    matchingResults.forEach(round => {
                      round.matches.forEach(match => {
                        const courtType = getCourtTypeText(match)
                        if (courtType === '혼복') typeStats.mixed++
                        else if (courtType === '남복') typeStats.men++
                        else if (courtType === '여복') typeStats.women++
                      })
                    })
                    return (
                      <div className="type-breakdown">
                        <span className="stat-label">매칭 타입</span>
                        <span className="stat-value">
                          혼복 {typeStats.mixed} | 남복 {typeStats.men} | 여복 {typeStats.women}
                        </span>
                      </div>
                    )
                  })()}
                </div>
              </div>
            </div>
            {matchingResults.map((roundData) => (
              <div key={roundData.round} className="round-result">
                <h3>라운드 {roundData.round}</h3>
                
                <div className="matches">
                  {roundData.matches.map((match) => (
                    <div key={match.court} className={`match ${getCourtType(match)}`}>
                      <h4>코트 {match.court}</h4>
                      <div className={`court-type-badge ${getCourtTypeText(match) === '잡복' ? 'jabok' : ''}`}>
                        {getCourtTypeText(match)}
                      </div>
                      {console.log(`코트 ${match.court} 렌더링:`, {
                        representative: match.representative,
                        team1: match.team1.map(p => ({ name: p.name, id: p.id, type: p.type })),
                        team2: match.team2.map(p => ({ name: p.name, id: p.id, type: p.type }))
                      })}
                      <div className="teams">
                        <div className="team">
                          <span className={`player-name ${match.representative?.id === match.team1[0]?.id ? 'representative' : ''}`}>
                            {match.team1[0]?.name}
                            <span className={`player-type ${match.team1[0]?.type}`}>
                              ({match.team1[0]?.type === 'club' ? '클럽' : '게스트'})
                            </span>
                          </span>
                          <span className="team-separator">+</span>
                          <span className={`player-name ${match.representative?.id === match.team1[1]?.id ? 'representative' : ''}`}>
                            {match.team1[1]?.name}
                            <span className={`player-type ${match.team1[1]?.type}`}>
                              ({match.team1[1]?.type === 'club' ? '클럽' : '게스트'})
                            </span>
                          </span>
                        </div>
                        <span className="vs">VS</span>
                        <div className="team">
                          <span className={`player-name ${match.representative?.id === match.team2[0]?.id ? 'representative' : ''}`}>
                            {match.team2[0]?.name}
                            <span className={`player-type ${match.team2[0]?.type}`}>
                              ({match.team2[0]?.type === 'club' ? '클럽' : '게스트'})
                            </span>
                          </span>
                          <span className="team-separator">+</span>
                          <span className={`player-name ${match.representative?.id === match.team2[1]?.id ? 'representative' : ''}`}>
                            {match.team2[1]?.name}
                            <span className={`player-type ${match.team2[1]?.type}`}>
                              ({match.team2[1]?.type === 'club' ? '클럽' : '게스트'})
                            </span>
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="rest-players">
                  <h4>휴식자</h4>
                  <div className="rest-list">
                    {roundData.restPlayers.map((player, index) => (
                      <span key={index} className="rest-player">
                        {player.name}
                        <span className={`rest-player-type ${player.type}`}>
                          ({player.type === 'club' ? '클럽' : '게스트'})
                        </span>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </section>
        )}
      </div>
    </div>
  )
}

export default App