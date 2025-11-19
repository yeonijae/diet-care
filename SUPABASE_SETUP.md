# Supabase 설정 가이드

DietCare 앱을 Supabase와 연결하여 환자가 모바일에서 기록한 데이터를 한의원(관리자)에서 실시간으로 확인할 수 있습니다.

## 1. Supabase 프로젝트 생성

1. [Supabase](https://supabase.com) 로그인
2. "New Project" 클릭
3. 프로젝트 이름, 데이터베이스 비밀번호, 리전 설정
4. 프로젝트 생성 완료 대기 (약 2분)

## 2. 데이터베이스 스키마 생성

1. Supabase 대시보드에서 **SQL Editor** 메뉴로 이동
2. "New Query" 클릭
3. `supabase-schema.sql` 파일의 내용을 전체 복사하여 붙여넣기
4. "Run" 버튼 클릭하여 실행

이 작업으로 다음이 생성됩니다:
- `patients` 테이블: 환자 정보
- `weight_logs` 테이블: 체중 기록
- `meal_logs` 테이블: 식단 기록
- `meal-images` Storage Bucket: 식단 사진 저장
- Row Level Security (RLS) 정책: 데이터 보안

## 3. 환경 변수 설정

1. Supabase 대시보드에서 **Settings** > **API** 메뉴로 이동
2. 다음 정보를 복사합니다:
   - **Project URL** (예: https://xxxxx.supabase.co)
   - **anon public** key

3. `.env.local` 파일을 열고 다음 정보를 입력합니다:

```env
GEMINI_API_KEY=your_gemini_api_key

# Supabase Configuration
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

## 4. Storage 버킷 확인

1. Supabase 대시보드에서 **Storage** 메뉴로 이동
2. `meal-images` 버킷이 생성되었는지 확인
3. 버킷이 없다면 다음 설정으로 생성:
   - Name: `meal-images`
   - Public: ✅ 체크
   - File size limit: 5MB
   - Allowed MIME types: `image/*`

## 5. 앱 실행

```bash
cd diet-care
npm install
npm run dev
```

## 사용 시나리오

### 환자 (모바일)
1. 앱 접속 → "환자용 시작하기" 클릭
2. 가입 정보 입력 (이름, 연락처, 나이, 체중, 목표 체중)
3. 가입 신청 완료 → "승인 대기" 화면 표시
4. 관리자 승인 후 → 자동으로 대시보드로 이동
5. 식단 사진 촬영 또는 텍스트로 음식 기록
6. AI가 자동으로 칼로리 분석 및 조언 제공
7. 체중 기록 및 그래프 확인

### 관리자 (PC/태블릿)
1. 앱 접속 → "관리자 로그인" 클릭
2. "가입요청" 탭에서 대기 중인 환자 확인
3. 환자 선택 → 승인 또는 거절
4. "관리중" 탭에서 활성 환자 목록 조회
5. 환자 선택 → 체중 변화 그래프, 식단 기록 확인
6. 목록/월간 캘린더 뷰로 식단 기록 확인

## 데이터 흐름

```
환자 모바일 → Supabase DB → 관리자 PC
     ↓
   식단 기록
     ↓
 Supabase Storage (이미지)
     ↓
 Gemini AI (분석)
     ↓
Supabase DB (결과 저장)
     ↓
관리자 실시간 조회
```

## 보안 설정 (RLS)

Row Level Security가 자동으로 적용되어:
- 환자는 자신의 데이터만 읽기/쓰기 가능
- 관리자(authenticated)는 모든 환자 데이터 읽기 가능
- 익명 사용자는 가입 신청만 가능

## 실시간 업데이트

관리자 대시보드는 Supabase Realtime을 사용하여:
- 환자가 식단을 기록하면 즉시 관리자 화면에 반영
- 체중 기록 시 그래프가 실시간으로 업데이트
- 새로운 가입 신청 시 알림 표시

## 트러블슈팅

### RLS 정책 오류
만약 "new row violates row-level security policy" 오류가 발생하면:
1. SQL Editor에서 RLS 정책을 다시 확인
2. `supabase-schema.sql`의 RLS 부분을 다시 실행

### 이미지 업로드 실패
1. Storage 버킷이 Public으로 설정되어 있는지 확인
2. 이미지 크기가 5MB 이하인지 확인
3. Storage 정책이 올바르게 설정되어 있는지 확인

### 환경 변수 인식 안됨
1. `.env.local` 파일이 프로젝트 루트에 있는지 확인
2. 변수명이 `VITE_`로 시작하는지 확인
3. 개발 서버 재시작: `npm run dev`

## 프로덕션 배포 시 주의사항

1. **인증 강화**: 현재는 데모용 간단한 인증이므로, 프로덕션에서는 Supabase Auth를 사용하세요
2. **환경 변수**: 배포 플랫폼(Vercel, Netlify 등)에 환경 변수를 등록하세요
3. **CORS 설정**: Supabase 대시보드에서 배포 도메인을 허용 목록에 추가하세요
4. **Rate Limiting**: API 호출 제한을 설정하여 남용을 방지하세요
5. **백업**: 정기적인 데이터베이스 백업을 설정하세요

## 추가 기능 제안

- [ ] 관리자 로그인 비밀번호 기능 강화
- [ ] 환자별 알림 기능 (목표 달성, 식단 기록 리마인더)
- [ ] 엑셀로 데이터 내보내기 기능
- [ ] 환자와 관리자 간 메시지 기능
- [ ] 식단 패턴 분석 및 추천 기능
