# 🧳 우리 가족 여행

가족과 함께 여행 **계획**과 **기록**을 남기는 웹앱입니다. 휴대폰 브라우저에서 열고 "홈 화면에 추가"하면 앱처럼 쓸 수 있어요.

## 기능

| | |
|---|---|
| ➕ 여행 추가 | 목록 화면의 **+ 버튼**으로 여행지(이름·날짜·통화·예산·아이콘)를 추가 |
| 🗓️ 일정 | 날짜(Day 1, Day 2…)별로 장소를 추가하고 시간·메모 기록, 순서 변경. 날짜 미정 장소는 **⭐ 가고 싶은 곳**에 모아두기 |
| 📍 구글 지도 | 장소 이름으로 **구글 지도 검색** 후 바로 추가, 지도에 Day별 색깔 핀 표시, 장소별 "구글 지도에서 열기", 하루 동선 **길찾기** 링크 |
| 💰 경비 | 날짜별·장소별 지출 기록(금액, 분류, 낸 사람, 메모), 분류별 통계, 예산 대비, **1/N 정산**(누가 누구에게 얼마) |
| 📝 오늘의 기록 | 날짜마다 그날의 일기/메모 |
| 👨‍👩‍👧 가족 공유 | 여행마다 가족의 Google 이메일을 초대 → 같이 실시간 작성. 카카오톡으로 초대 메시지 보내기 |
| 📶 오프라인 | 해외에서 데이터가 끊겨도 기록되고, 연결되면 자동 동기화 |

## 바로 써보기 (체험 모드)

```bash
npm install
npm run dev
```

설정 없이 실행하면 **체험 모드**로, 이 기기 브라우저에만 저장됩니다. 가족 공유·지도 검색은 아래 설정 후 켜집니다.

## 설정하기

### 1) Firebase (로그인 + 가족 공유 저장소) — 무료 요금제로 충분

1. <https://console.firebase.google.com> 에서 프로젝트 만들기
2. **Authentication** > 시작하기 > 로그인 방법 > **Google** 사용 설정
3. **Firestore Database** > 데이터베이스 만들기 (프로덕션 모드, 위치 `asia-northeast3 (서울)` 권장)
4. Firestore > **규칙** 탭에 이 저장소의 [`firestore.rules`](./firestore.rules) 내용을 붙여넣고 게시
   (또는 `npx firebase-tools deploy --only firestore:rules`)
5. 프로젝트 설정 > 내 앱 > **웹 앱 추가** → 나오는 `firebaseConfig` 값을 `.env`에 입력
6. 배포한 뒤에는 Authentication > 설정 > **승인된 도메인**에 배포 주소(예: `아이디.github.io`)를 추가

### 2) Google 지도 (장소 검색 + 지도)

1. <https://console.cloud.google.com> 에서 (Firebase와 같은 프로젝트를 골라도 됩니다)
2. API 및 서비스 > 라이브러리에서 **Maps JavaScript API**, **Places API (New)** 사용 설정
3. 사용자 인증 정보 > API 키 만들기 → **애플리케이션 제한사항: 웹사이트**로 배포 주소와 `localhost`만 허용 (키 도용 방지)
4. (선택) 지도 관리 > 지도 ID 만들기(JavaScript, 벡터) → `VITE_GOOGLE_MAPS_MAP_ID`
5. 매월 무료 사용량이 있어 가족 여행 용도는 대부분 무료 범위 안입니다. (결제 계정 연결은 필요)

키가 없어도 장소는 직접 입력할 수 있고, "구글 지도에서 열기 / 길찾기" 링크는 그대로 동작합니다.

### 3) `.env` 만들기

```bash
cp .env.example .env
# 값 채우기
npm run dev
```

## 배포

**GitHub Pages (자동)** — `.github/workflows/deploy.yml` 포함
1. 저장소 Settings > Pages > Source: **GitHub Actions**
2. Settings > Secrets and variables > Actions > **Variables**에 `.env`와 같은 이름(`VITE_FIREBASE_API_KEY` 등)으로 값 추가
3. `main` 브랜치에 push → `https://<아이디>.github.io/travel/` 에 배포

**Firebase Hosting**
```bash
npm run build
npx firebase-tools deploy
```

> Firebase 웹 설정값과 (웹사이트 제한을 건) 지도 키는 브라우저에 노출되도록 설계된 값이라 공개돼도 괜찮습니다. 데이터 보호는 `firestore.rules`가 담당합니다.

## 가족 초대 방법

1. 여행 화면 > **가족** 탭 > 가족의 Google 계정 이메일 입력 후 **초대**
2. **초대 메시지 보내기**로 카톡/문자 전송
3. 가족이 링크를 열고 그 Google 계정으로 로그인하면 여행이 목록에 나타나고, 함께 수정할 수 있어요 (실시간 반영)

## 구조

```
src/
  App.jsx                 라우팅(#/trip/:id/:tab), 지도 API Provider
  store/                  데이터 계층: firebaseStore(공유) / localStore(체험 모드)
  components/
    TripList.jsx          여행 목록 + ➕ 버튼
    TripView.jsx          여행 화면 (일정·지도·경비·가족 탭)
    Itinerary.jsx         날짜별 일정, 장소 카드, 오늘의 기록
    PlaceModal.jsx        장소 추가/수정 (PlaceSearch: 구글 장소 검색)
    ExpenseModal.jsx      지출 기록
    Expenses.jsx          경비 통계·정산
    MapView.jsx           구글 지도 핀
    Members.jsx           가족 초대
firestore.rules           보안 규칙 (초대된 사람만 접근)
```

데이터 구조 (Firestore):
- `trips/{tripId}` — title, destination, startDate, endDate, currency, budget, ownerEmail, memberEmails[], members[]
- `trips/{tripId}/places/{id}` — name, address, lat, lng, googlePlaceId, day, time, order, memo
- `trips/{tripId}/expenses/{id}` — amount, category, title, date, placeId, paidBy, memo
- `trips/{tripId}/notes/{YYYY-MM-DD}` — text
