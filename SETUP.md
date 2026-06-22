# Voya 설정 가이드

## 1. Node.js 설치
https://nodejs.org → LTS 버전 설치

## 2. 의존성 설치
```bash
cd voya
npm install
```

## 3. 환경변수 설정
`.env.local.example`을 복사해서 `.env.local` 파일 생성:

```bash
cp .env.local.example .env.local
```

아래 API 키들을 발급받아 입력:

### Anthropic (Claude)
- https://console.anthropic.com → API Keys → Create
- `ANTHROPIC_API_KEY=sk-ant-...`

### Google Cloud (OAuth + Maps + Calendar)
1. https://console.cloud.google.com → 프로젝트 생성
2. APIs & Services → Enable APIs:
   - Maps JavaScript API
   - Directions API
   - Google Calendar API
   - Google+ API (OAuth)
3. Credentials → Create OAuth 2.0 Client ID
   - Authorized redirect URIs: `http://localhost:3000/api/auth/callback/google`
4. Credentials → Create API Key (Maps용)
   - `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`

### Ticketmaster (선택)
- https://developer.ticketmaster.com → My Apps → Create App
- `TICKETMASTER_API_KEY=...`

### NextAuth Secret
```bash
openssl rand -base64 32
```
- `NEXTAUTH_SECRET=생성된_랜덤값`

## 4. 로컬 실행
```bash
npm run dev
# → http://localhost:3000
```

## 5. Vercel 배포
```bash
npm install -g vercel
vercel login
vercel
# 환경변수 설정 → vercel.com → Project Settings → Environment Variables
```

## 기능 요약
- **입력 폼**: 날짜, 도시(최대 2), 고정 이벤트, 여행 스타일 선택
- **AI 일정 생성**: Claude Sonnet이 최적 동선+테마 맞춤 일정 생성
- **지도 시각화**: Google Maps에 번호 마커 + 동선 폴리라인 표시
- **예약 연결**: 아고다(호텔), 클룩(액티비티), Ticketmaster(공연)
- **캘린더 저장**: Google Calendar 이벤트 생성 링크
- **대화형 수정**: 채팅으로 "3일차 바꿔줘" 등 일정 수정
