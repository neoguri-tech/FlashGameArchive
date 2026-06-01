# Neoguri Shared Backend

GitHub Pages에서 실행되는 정적 게임들이 Firebase를 공통으로 쓰기 위한 얇은 레이어입니다.

## 원칙

- 공통 모듈은 Firebase 초기화, 로그인, 공통 이벤트, 범용 리더보드, 범용 방 동기화만 담당합니다.
- 게임별 점수 계산, 저장 데이터, 멀티플레이 룰, 특수 DB 구조는 각 게임 폴더에 둡니다.
- 사이트 전체 통계는 게임별 임의 필드를 직접 읽지 않고 공통 이벤트에서 파생합니다.
- Firebase 실패 시 로컬 플레이 가능한 게임은 계속 실행되어야 합니다.

## 공통 Firestore 경로

```text
users/{uid}
  publicName
  displayName
  email
  photoURL
users/{uid}/games/{gameId}

platform/events/items/{eventId}
platform/gameStats/games/{gameId}

games/{gameId}/leaderboards/{leaderboardId}/entries/{entryId}
```

## 공통 Realtime Database 경로

```text
rooms/{gameId}/{roomId}
```

## 새 게임 권장 사용법

```js
import { trackGameStart, trackGameEnd } from "../../shared/backend/eventsApi.js";

const session = await trackGameStart({
  gameId: "my_game",
  mode: "normal",
});

await trackGameEnd({
  gameId: "my_game",
  sessionId: session.sessionId,
  result: "finished",
  durationMs: 58200,
});
```

## 공개 닉네임

Google 계정 이름은 공개 UI에 직접 쓰지 않습니다. 리더보드, 멀티플레이 방, 홈 로그인 상태에는 `users/{uid}.publicName`을 우선 사용합니다.

```js
import { getUserProfile, updatePublicName } from "../../shared/backend/profileApi.js";

const profile = await getUserProfile();
await updatePublicName("네오구리");
```

## 로그인 정책

기본 플레이는 로그인 없이 가능합니다. 기록 저장, 리더보드, 닉네임, 멀티플레이처럼 사용자 식별이 필요한 기능은 Google 로그인을 우선 사용합니다. Anonymous Auth는 기존 임시 계정 호환과 향후 빠른 입장 기능을 위해 내부 API로 남겨두지만, 기본 UI에서는 노출하지 않습니다.

## 리더보드

리더보드는 정렬용 `sortValue`만 공통입니다. 자세한 데이터는 게임별 `payload`에 둡니다.

```js
await submitLeaderboardEntry({
  gameId: "my_game",
  leaderboardId: "high_score",
  sortValue: 12800,
  order: "desc",
  payload: {
    score: 12800,
    difficulty: "hard",
  },
});
```

## 게임별 자유 구역

게임이 특별한 데이터가 필요하면 `games/{gameId}/...` 아래에서 자유롭게 확장합니다. 다른 게임의 경로를 읽거나 쓰지 않는 것이 유일한 강한 규칙입니다.
