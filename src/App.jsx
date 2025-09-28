import { useState, useEffect } from 'react'
import './App.css'

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

  // 컴포넌트 마운트 시 저장된 클럽멤버 불러오기
  useEffect(() => {
    const saved = localStorage.getItem('tennisClubMembers')
    if (saved) {
      setSavedClubMembers(JSON.parse(saved))
    }
  }, [])

  // 클럽멤버 저장
  const saveClubMember = (member) => {
    const newSavedMembers = [...savedClubMembers, member]
    setSavedClubMembers(newSavedMembers)
    localStorage.setItem('tennisClubMembers', JSON.stringify(newSavedMembers))
  }

  // 클럽멤버 삭제
  const removeSavedClubMember = (id) => {
    const newSavedMembers = savedClubMembers.filter(m => m.id !== id)
    setSavedClubMembers(newSavedMembers)
    localStorage.setItem('tennisClubMembers', JSON.stringify(newSavedMembers))
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
  const addNewClubMember = () => {
    if (newClubMember.name.trim()) {
      const member = {
        id: Date.now(),
        name: newClubMember.name.trim(),
        gender: newClubMember.gender
      }
      
      // 중복 체크
      const isDuplicate = savedClubMembers.some(m => m.name === member.name)
      if (!isDuplicate) {
        saveClubMember(member)
        setNewClubMember({ name: '', gender: 'male' })
      } else {
        alert('이미 등록된 클럽멤버입니다.')
      }
    }
  }

  // 참가자 추가
  const addParticipant = () => {
    if (newParticipant.name.trim() && participants.length < totalParticipants) {
      const participant = { 
        id: Date.now(), 
        name: newParticipant.name.trim(), 
        gender: newParticipant.gender,
        type: newParticipant.type
      }
      
      setParticipants([...participants, participant])
      
      // 클럽멤버인 경우 클럽멤버 리스트에도 추가하고 저장
      if (newParticipant.type === 'club') {
        setClubMembers([...clubMembers, participant])
        // 중복 체크 후 저장
        const isDuplicate = savedClubMembers.some(m => m.name === participant.name)
        if (!isDuplicate) {
          saveClubMember({ name: participant.name, gender: participant.gender })
        }
      }
      
      setNewParticipant({ name: '', gender: 'male', type: 'guest' })
    }
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

  // 매칭 로직
  const generateMatches = () => {
    console.log('=== 매칭 생성 시작 ===')
    console.log('참가자 수:', participants.length)
    console.log('설정된 총 참가자 수:', totalParticipants)
    console.log('휴식자 수:', restPlayersPerRound)
    console.log('최대 코트 수:', maxCourts)
    console.log('수동매칭:', manualMatches)
    
    if (participants.length !== totalParticipants) {
      alert(`정확히 ${totalParticipants}명의 참가자가 필요합니다. 현재 ${participants.length}명입니다.`)
      return
    }

    console.log('참가자 정보:', participants)

    const results = []
    const usedPairs = new Set()
    const usedRestPlayers = new Set() // 휴식자 중복 방지
    
    for (let round = 1; round <= 5; round++) {
      console.log(`\n--- 라운드 ${round} 시작 ---`)
      const roundMatches = []
      const availableParticipants = [...participants]
      console.log('라운드 시작 시 참가자 수:', availableParticipants.length)
      
      // 수동 매칭이 있는 경우 먼저 적용
      if (manualMatches[round]) {
        const manualMatch = manualMatches[round]
        const player1 = participants.find(p => p.name === manualMatch.player1)
        const player2 = participants.find(p => p.name === manualMatch.player2)
        const player3 = participants.find(p => p.name === manualMatch.player3)
        const player4 = participants.find(p => p.name === manualMatch.player4)
        
        console.log(`라운드 ${round} 수동 매칭:`, { 
          manualMatch,
          player1, 
          player2, 
          player3, 
          player4,
          participants: participants.map(p => ({ name: p.name, type: p.type })),
          representative: manualMatch.representative
        })
        
        if (player1 && player2 && player3 && player4) {
          // 수동매칭에서 선택된 대표자 찾기 (선수들 중에서 찾기)
          const representativePlayer = manualMatch.representative 
            ? [player1, player2, player3, player4].find(p => p.name === manualMatch.representative)
            : null
          
          console.log(`수동매칭 대표자 찾기:`, {
            selectedRepresentative: manualMatch.representative,
            foundRepresentative: representativePlayer,
            players: [player1, player2, player3, player4].map(p => ({ name: p.name, type: p.type }))
          })
          
          const match = {
            court: manualMatch.court,
            team1: [player1, player2],
            team2: [player3, player4],
            representative: representativePlayer
          }
          roundMatches.push(match)
          
          // 수동 매칭에 사용된 선수들을 제거
          const usedPlayers = [player1, player2, player3, player4]
          usedPlayers.forEach(player => {
            const index = availableParticipants.findIndex(p => p.id === player.id)
            if (index !== -1) availableParticipants.splice(index, 1)
          })
        }
      }

      // 나머지 매칭 자동 생성 - 동적 코트 수 계산
      const playersPerCourt = 4
      const availablePlayers = availableParticipants.length
      const restCount = Math.min(restPlayersPerRound, availablePlayers)
      const playingPlayers = availablePlayers - restCount
      const calculatedMaxCourts = Math.floor(playingPlayers / playersPerCourt)
      // 수동매칭이 있는 경우 해당 코트 번호를 제외하고 계산
      const usedCourts = roundMatches.map(m => m.court)
      const availableCourtNumbers = Array.from({length: maxCourts}, (_, i) => i + 1)
        .filter(courtNum => !usedCourts.includes(courtNum))
      const actualCourts = Math.min(calculatedMaxCourts, Math.max(availableCourtNumbers.length, 1))
      
      let restPlayers = []
      
      if (availablePlayers >= playersPerCourt) {
        // 휴식자 선택 (중복 방지)
        const availableForRest = availableParticipants.filter(p => !usedRestPlayers.has(p.id))
        for (let i = 0; i < restCount && i < availableForRest.length; i++) {
          const randomIndex = Math.floor(Math.random() * availableForRest.length)
          const selectedPlayer = availableForRest.splice(randomIndex, 1)[0]
          restPlayers.push(selectedPlayer)
          usedRestPlayers.add(selectedPlayer.id)
          
          // availableParticipants에서도 제거
          const index = availableParticipants.findIndex(p => p.id === selectedPlayer.id)
          if (index !== -1) availableParticipants.splice(index, 1)
        }

        // 남은 선수들로 매칭 생성 (남녀 비율 고려)
        const shuffledPlayers = [...availableParticipants].sort(() => Math.random() - 0.5)
        const malePlayers = shuffledPlayers.filter(p => p.gender === 'male')
        const femalePlayers = shuffledPlayers.filter(p => p.gender === 'female')
        
        console.log(`라운드 ${round} 매칭:`, {
          totalPlayers: shuffledPlayers.length,
          maleCount: malePlayers.length,
          femaleCount: femalePlayers.length,
          actualCourts
        })
        
        // 모든 코트를 최대한 활용하는 매칭 로직
        let courtIndex = 0
        
        // 가능한 모든 매칭 타입 계산
        const femaleCourts = Math.floor(femalePlayers.length / 4)
        const maleCourts = Math.floor(malePlayers.length / 4)
        const mixedCourts = Math.min(Math.floor(malePlayers.length / 2), Math.floor(femalePlayers.length / 2))
        
        const totalPossibleCourts = femaleCourts + maleCourts + mixedCourts
        const maxCourtsToUse = Math.min(totalPossibleCourts, actualCourts, availableCourtNumbers.length)
        
        console.log(`매칭 계획:`, {
          femaleCourts,
          maleCourts, 
          mixedCourts,
          totalPossibleCourts,
          maxCourtsToUse,
          actualCourts,
          availableCourtNumbers,
          usedCourts
        })
        
        // 1단계: 여복 매칭 (여자 4명씩)
        for (let i = 0; i < femaleCourts && courtIndex < maxCourtsToUse; i++) {
          const team1 = [femalePlayers[0], femalePlayers[1]]
          const team2 = [femalePlayers[2], femalePlayers[3]]
          femalePlayers.splice(0, 4)
          
          const match = {
            court: availableCourtNumbers[courtIndex],
            team1,
            team2,
            representative: null
          }
          
          console.log(`코트 ${match.court} 매칭 (여복):`, {
            team1: team1.map(p => `${p.name}(${p.gender},${p.type})`),
            team2: team2.map(p => `${p.name}(${p.gender},${p.type})`),
            courtType: 'female-court',
            courtTypeText: '여복'
          })
          
          roundMatches.push(match)
          courtIndex++
        }
        
        // 2단계: 남복 매칭 (남자 4명씩)
        for (let i = 0; i < maleCourts && courtIndex < maxCourtsToUse; i++) {
          const team1 = [malePlayers[0], malePlayers[1]]
          const team2 = [malePlayers[2], malePlayers[3]]
          malePlayers.splice(0, 4)
          
          const match = {
            court: availableCourtNumbers[courtIndex],
            team1,
            team2,
            representative: null
          }
          
          console.log(`코트 ${match.court} 매칭 (남복):`, {
            team1: team1.map(p => `${p.name}(${p.gender},${p.type})`),
            team2: team2.map(p => `${p.name}(${p.gender},${p.type})`),
            courtType: 'male-court',
            courtTypeText: '남복'
          })
          
          roundMatches.push(match)
          courtIndex++
        }
        
        // 3단계: 혼복 매칭 (남자 2명, 여자 2명)
        for (let i = 0; i < mixedCourts && courtIndex < maxCourtsToUse; i++) {
          const team1 = [malePlayers[0], femalePlayers[0]]
          const team2 = [malePlayers[1], femalePlayers[1]]
          malePlayers.splice(0, 2)
          femalePlayers.splice(0, 2)
          
          const match = {
            court: availableCourtNumbers[courtIndex],
            team1,
            team2,
            representative: null
          }
          
          console.log(`코트 ${match.court} 매칭 (혼복):`, {
            team1: team1.map(p => `${p.name}(${p.gender},${p.type})`),
            team2: team2.map(p => `${p.name}(${p.gender},${p.type})`),
            courtType: 'mixed-court',
            courtTypeText: '혼복'
          })
          
          roundMatches.push(match)
          courtIndex++
        }
        
        // 각 매칭에 대표자 선택 및 클럽멤버 배치
        roundMatches.forEach(match => {
          let team1 = [...match.team1]
          let team2 = [...match.team2]
          
          // 클럽멤버 배치 확인 및 조정
          const team1ClubCount = team1.filter(p => p.type === 'club').length
          const team2ClubCount = team2.filter(p => p.type === 'club').length
          
          if (team1ClubCount === 0 && team2ClubCount > 1) {
            const clubMember = team2.find(p => p.type === 'club')
            const guestMember = team1.find(p => p.type === 'guest')
            if (clubMember && guestMember) {
              team1 = team1.map(p => p.id === guestMember.id ? clubMember : p)
              team2 = team2.map(p => p.id === clubMember.id ? guestMember : p)
            }
          } else if (team2ClubCount === 0 && team1ClubCount > 1) {
            const clubMember = team1.find(p => p.type === 'club')
            const guestMember = team2.find(p => p.type === 'guest')
            if (clubMember && guestMember) {
              team2 = team2.map(p => p.id === guestMember.id ? clubMember : p)
              team1 = team1.map(p => p.id === clubMember.id ? guestMember : p)
            }
          }
          
          // 각 코트별로 클럽멤버 대표자 선택 (랜덤)
          const courtClubMembers = [...team1, ...team2].filter(p => p.type === 'club')
          const courtRepresentative = courtClubMembers.length > 0 
            ? courtClubMembers[Math.floor(Math.random() * courtClubMembers.length)]
            : null
          
          // 매칭 업데이트
          match.team1 = team1
          match.team2 = team2
          match.representative = courtRepresentative
        })
      }

      console.log(`라운드 ${round} 완료:`, {
        matchCount: roundMatches.length,
        restPlayers: restPlayers.length,
        matches: roundMatches.map(m => ({ court: m.court, team1: m.team1.map(p => p.name), team2: m.team2.map(p => p.name) }))
      })
      
      results.push({
        round,
        matches: roundMatches,
        restPlayers: restPlayers
      })
    }

    console.log('\n=== 최종 매칭 결과 ===')
    console.log('총 라운드 수:', results.length)
    console.log('전체 매칭 결과:', results)
    setMatchingResults(results)
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
        <p>{totalParticipants}명 기준, 최대 {maxCourts}코트, 5라운드 매칭 (라운드당 휴식 {restPlayersPerRound}명)</p>
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
                  // 휴식자 수는 최대 4명으로 제한 (참가자 수와 무관)
                  if (restPlayersPerRound > 4) {
                    setRestPlayersPerRound(4)
                  }
                }}
              >
                <option value={20}>20명</option>
                <option value={18}>18명</option>
                <option value={16}>16명</option>
                <option value={14}>14명</option>
                <option value={12}>12명</option>
                <option value={10}>10명</option>
                <option value={8}>8명</option>
              </select>
            </div>
            
            <div className="rest-count-selector">
              <label>라운드당 휴식자 수:</label>
              <select 
                value={restPlayersPerRound} 
                onChange={(e) => {
                  const newRestCount = Math.min(4, parseInt(e.target.value))
                  setRestPlayersPerRound(newRestCount)
                }}
              >
                {Array.from({length: 5}, (_, i) => (
                  <option key={i} value={i}>{i}명</option>
                ))}
              </select>
            </div>
            
            <div className="court-count-selector">
              <label>최대 코트 수:</label>
              <select 
                value={maxCourts} 
                onChange={(e) => {
                  const newCourtCount = parseInt(e.target.value)
                  setMaxCourts(newCourtCount)
                }}
              >
                <option value={1}>1코트</option>
                <option value={2}>2코트</option>
                <option value={3}>3코트</option>
                <option value={4}>4코트</option>
              </select>
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
            <h2>매칭 결과</h2>
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