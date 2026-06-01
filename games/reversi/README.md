# Reversi Lab

변형 리버시를 얹기 위한 초안입니다. 로비에서 색, 플레이 방식, 컴퓨터 난이도, 랜덤 금지칸 수를 고른 뒤 시작합니다.

## 실행

브라우저에서 `lobby.html`을 열면 설정 후 실행됩니다. 정적 서버로 확인하려면 저장소 루트에서:

```bash
python -m http.server 8000
```

그 다음 `http://localhost:8000/games/reversi/lobby.html`를 엽니다.

## 현재 기능

- 클래식/금지칸 변형 8x8 리버시
- 로컬 2인 모드
- VS 컴퓨터 모드
- 초대 링크형 온라인 2인 대전
- 입문, 욕심쟁이, 전략가, 수읽기, 고수 컴퓨터 난이도
- 합법 수 표시
- 착수 기록과 실시간 점수
- 뒤집힘/착수 모션
- 로그인된 VS 컴퓨터 결과 저장
- VS 컴퓨터 최고 승리 리더보드

## 결과 저장과 리더보드

로그인하지 않은 플레이 결과는 저장하지 않습니다. 로그인한 상태에서 VS 컴퓨터 모드를 끝내면 `users/{uid}/games/reversi`에 누적 전적을 저장하고, 승리한 판만 `games/reversi/leaderboards/cpu_best_win` 리더보드에 제출합니다.

리더보드는 순수 승률 대신 최고 승리 점수로 시작합니다. 승률만 쓰면 1전 1승이 100%로 과대평가될 수 있어서, 현재는 난이도 기본점 + 승리 돌 차이 + 랜덤 금지칸 보너스를 반영합니다. 누적 전적에는 승/무/패와 승률도 같이 저장해두므로, 나중에 `최소 10판 이상 승률` 리더보드를 추가할 수 있습니다.

## 변형 룰을 위한 자리

- `CLASSIC_RULESET.randomBlockedCount`: 랜덤 구멍/벽 개수
- `CLASSIC_RULESET.blockedCells`: 고정 구멍/벽 좌표
- `players.*.powers`: 유저별 초능력 목록
- `players.*.specialStoneDeck`: 다음에 둘 특수 돌 큐
- `piece.kind`, `piece.modifiers`: 돌 단위 특수 효과

구멍/벽은 이미 수 계산에서 광선을 막도록 처리되어 있습니다. `randomBlockedCount`를 올리거나 `blockedCells`에 좌표를 넣으면 중앙 시작 돌을 보호한 채 막힌 칸이 반영됩니다.

## 멀티플레이 방향

GitHub Pages는 정적 호스팅이므로 자체 서버 로직은 둘 수 없습니다. 실시간 대전은 Firestore, Firebase Realtime Database, Supabase Realtime, Cloudflare Workers 같은 외부 백엔드에 방 상태를 저장하는 방식이 필요합니다.

현재 구현은 비공개 초대 링크형 방입니다.

- 플레이어 A가 온라인 방을 만들면 Firestore에 `games/reversi/rooms/{roomId}`를 생성합니다.
- 로비는 `games/reversi/lobby.html?room={roomId}` 또는 `games/reversi/index.html?room={roomId}` 형태의 공유 링크를 보여줍니다.
- 플레이어 B가 링크로 들어오면 빈 좌석에 참가하고, 흑/백 좌석이 차면 게임을 시작합니다.
- 공개 방 목록은 나중에 `status: waiting` 방만 모아 보여주는 형태로 추가합니다.
- 온라인 대전은 Google 로그인이 필요합니다. 로그인하지 않은 사용자는 로컬/컴퓨터 모드만 플레이합니다.

권장 데이터 구조:

```text
games/reversi/rooms/{roomId}
  status: waiting | playing | finished
  settings: { blockedCount, hostColor, rulesVersion }
  seats:
    black: { uid, publicName }
    white: { uid, publicName }
  state:
    board: ["........", "...wb...", ...]
    current: black | white
    gameOver: false
    moveHistory: [{ player, row, col, flipped, kind }]
    lastMove: { placedKey, flippedKeys, player }
    resultSummary: ...
    revision: 1
  presence/{uid}: { online, updatedAt }
  moves/{moveId}: { player, row, col, flipped, createdAt }
  createdAt
  updatedAt
```

캐주얼 대전은 클라이언트에서 합법 수를 계산하고 Firebase 보안 규칙으로 로그인/좌석/턴만 막아도 시작할 수 있습니다. 랭킹전처럼 부정행위 방지가 중요해지면 Cloud Functions나 Cloudflare Worker에서 착수 합법성을 검증하는 권위 서버 방식을 추가하는 편이 좋습니다.

현재 1차 버전은 클라이언트 검증 기반입니다. 한 수를 둘 때마다 8x8 보드 문자열, 현재 턴, 착수 기록, 마지막 수를 방 상태에 저장합니다. 방 목록을 전역으로 계속 구독하지 않고 개별 방만 구독하므로, 사용량은 동시 접속 수와 진행 중인 방 수에 거의 비례합니다.

대략적인 Firestore 사용량은 한 판당 방 생성 1회, 한 수당 방 문서 쓰기 1회, 플레이어별 실시간 문서 읽기 1회 정도를 예상합니다. 60수 게임이면 대략 쓰기 60~70회, 읽기 120~150회 수준입니다. 현재 구현은 한 수마다 방 상태를 통째로 갱신하므로 착수 기록이 길어질수록 후반 업데이트가 조금 커집니다. 트래픽이 커지면 `moveHistory`를 별도 `moves/{moveId}` append 구조로 빼고, 완료된 방을 삭제/아카이브하는 정리가 필요합니다.
