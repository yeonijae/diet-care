# GitHub 및 Vercel 배포 가이드

## 1. GitHub에 코드 올리기

### 1-1. GitHub 저장소 생성
1. [GitHub](https://github.com) 로그인
2. 우측 상단 `+` 버튼 → `New repository` 클릭
3. 저장소 설정:
   - Repository name: `diet-care` (또는 원하는 이름)
   - Description: "DietCare AI - 다이어트 환자 관리 및 AI 식단 분석 솔루션"
   - Public 또는 Private 선택
   - **README, .gitignore, license는 체크하지 않음** (이미 로컬에 있음)
4. `Create repository` 클릭

### 1-2. 로컬 저장소를 GitHub에 푸시

터미널에서 다음 명령어를 실행하세요:

```bash
cd diet-care

# GitHub 저장소 연결 (YOUR_USERNAME을 본인 GitHub 아이디로 변경)
git remote add origin https://github.com/YOUR_USERNAME/diet-care.git

# 기본 브랜치 이름을 main으로 변경
git branch -M main

# GitHub에 푸시
git push -u origin main
```

**예시:**
```bash
git remote add origin https://github.com/crimm/diet-care.git
git branch -M main
git push -u origin main
```

GitHub 인증이 필요한 경우:
- GitHub 웹사이트에서 `Settings` > `Developer settings` > `Personal access tokens` > `Tokens (classic)`
- `Generate new token (classic)` 클릭
- `repo` 권한 체크
- 생성된 토큰을 비밀번호 대신 사용

---

## 2. Vercel로 배포하기

### 2-1. Vercel 계정 생성 및 연결
1. [Vercel](https://vercel.com) 접속
2. `Sign Up` → GitHub 계정으로 로그인
3. GitHub 연동 승인

### 2-2. 프로젝트 가져오기
1. Vercel 대시보드에서 `Add New...` → `Project` 클릭
2. GitHub 저장소 목록에서 `diet-care` 선택
3. `Import` 클릭

### 2-3. 프로젝트 설정
**Framework Preset:** Vite (자동 감지됨)

**Root Directory:** `./` (기본값)

**Build Command:** `npm run build` (자동 설정됨)

**Output Directory:** `dist` (자동 설정됨)

### 2-4. 환경 변수 설정
`Environment Variables` 섹션에서 다음을 추가:

| Name | Value |
|------|-------|
| `GEMINI_API_KEY` | `AIzaSyAj2ufaqJo0nfO1Coqvw9tEUN_bqU13VGw` |
| `VITE_SUPABASE_URL` | `https://fzcggeytecbcpvqunkah.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (전체 키) |
| `VITE_KAKAO_JAVASCRIPT_KEY` | 카카오 JavaScript 키 (아래 섹션 참조) |

**중요:**
- 프로덕션에서는 `.env.local` 파일의 키를 사용하지 마세요
- 보안을 위해 별도의 프로덕션 API 키를 발급받는 것을 권장합니다

#### 카카오 JavaScript 키 발급 방법
1. [카카오 Developers](https://developers.kakao.com) 접속 및 로그인
2. `내 애플리케이션` → `애플리케이션 추가하기` 클릭
3. 앱 이름 입력 (예: "연이재한의원 식단관리")
4. 생성된 앱 선택 → `앱 키` 섹션에서 `JavaScript 키` 복사
5. `플랫폼 설정` → `Web 플랫폼 등록`
   - 사이트 도메인: `http://localhost:3005` (개발용)
   - 사이트 도메인: Vercel 배포 URL (프로덕션용)
6. `카카오 로그인` → `활성화 설정` ON
7. `Redirect URI` 등록:
   - `http://localhost:3005` (개발용)
   - Vercel 배포 URL (프로덕션용)
8. `동의항목` 설정:
   - 필수: 닉네임, 프로필 이미지
   - 선택: 카카오계정(이메일), 전화번호

### 2-5. 배포
1. `Deploy` 버튼 클릭
2. 빌드 진행 상황 확인 (약 1-2분 소요)
3. 배포 완료 후 제공되는 URL로 접속

**배포 URL 예시:** `https://diet-care.vercel.app` 또는 `https://diet-care-xxx.vercel.app`

---

## 3. 배포 후 Supabase 설정

### 3-1. kakao_id 컬럼 추가
프로젝트의 `supabase-add-kakao-id.sql` 파일을 실행하여 데이터베이스 스키마를 업데이트하세요:

1. Supabase 대시보드 → `SQL Editor`
2. `New Query` 클릭
3. `supabase-add-kakao-id.sql` 파일의 내용을 복사하여 붙여넣기
4. `Run` 버튼 클릭

이 스크립트는 다음을 수행합니다:
- `patients` 테이블에 `kakao_id` 컬럼 추가
- `kakao_id`에 대한 인덱스 생성
- RLS 정책 업데이트 (카카오 로그인 지원)

**참고:** 이미 simplified RLS policies를 사용 중이라면 (allow all for anon), 정책 업데이트 부분은 건너뛰어도 됩니다.

### 3-2. CORS 설정
1. Supabase 대시보드 → `Settings` → `API`
2. `CORS Allowed Origins`에 Vercel URL 추가:
   ```
   https://diet-care.vercel.app
   https://diet-care-*.vercel.app
   ```

### 3-3. Redirect URLs 설정 (선택사항)
1. Supabase 대시보드 → `Authentication` → `URL Configuration`
2. `Site URL`: Vercel 배포 URL 입력
3. `Redirect URLs`: Vercel 도메인 추가

---

## 4. 자동 배포 설정

GitHub에 푸시할 때마다 Vercel이 자동으로 재배포됩니다:

```bash
# 코드 수정 후
git add .
git commit -m "업데이트 내용"
git push origin main
```

Vercel이 자동으로:
1. 코드 변경 감지
2. 빌드 실행
3. 새 버전 배포
4. URL은 동일하게 유지

---

## 5. 커스텀 도메인 설정 (선택사항)

### Vercel에서 도메인 연결
1. Vercel 프로젝트 → `Settings` → `Domains`
2. 본인 소유 도메인 입력 (예: `dietcare.com`)
3. DNS 레코드 추가 (Vercel이 안내)
4. 도메인 인증 완료

---

## 6. 배포 체크리스트

배포 후 다음을 확인하세요:

- [ ] 카카오 로그인 기능 테스트
- [ ] 카카오 로그인 후 자동 로그인 확인
- [ ] 전화번호 가입 기능 테스트
- [ ] 관리자 로그인 및 승인 기능
- [ ] 식단 사진 업로드 및 AI 분석
- [ ] 체중 기록 기능
- [ ] 모바일 반응형 디자인
- [ ] Supabase 데이터 저장 확인
- [ ] 이미지 Storage 업로드 확인
- [ ] kakao_id 컬럼이 patients 테이블에 추가되었는지 확인

---

## 7. 문제 해결

### 빌드 실패
- **오류:** `Module not found`
  - **해결:** `package.json`에 모든 의존성이 포함되어 있는지 확인
  - 로컬에서 `npm install` 후 다시 푸시

### 환경 변수 오류
- **오류:** `Missing Supabase environment variables`
  - **해결:** Vercel 환경 변수에 `VITE_` 접두사가 포함되어 있는지 확인
  - 변수 추가 후 재배포 필요

### CORS 오류
- **오류:** `Access to fetch blocked by CORS policy`
  - **해결:** Supabase 설정에서 Vercel URL을 허용 목록에 추가

### 이미지 업로드 실패
- **오류:** Storage 정책 오류
  - **해결:** Supabase Storage 버킷이 Public으로 설정되어 있는지 확인
  - RLS 정책이 올바르게 적용되어 있는지 확인

---

## 8. 성능 최적화 팁

### Vercel 설정
- **캐싱:** 정적 파일 자동 캐싱 (기본 활성화)
- **이미지 최적화:** Vercel Image Optimization 활용 가능

### Supabase 설정
- **Connection Pooling:** 많은 동시 접속 시 활성화
- **Database Indexes:** 자주 조회하는 컬럼에 인덱스 생성

---

## 9. 유용한 명령어

```bash
# 로컬 빌드 테스트
npm run build
npm run preview

# Git 상태 확인
git status

# 최신 코드 가져오기
git pull origin main

# 새 브랜치 생성
git checkout -b feature/new-feature

# 브랜치 병합
git checkout main
git merge feature/new-feature
```

---

## 10. 추가 리소스

- [Vercel 문서](https://vercel.com/docs)
- [Vite 배포 가이드](https://vitejs.dev/guide/static-deploy.html)
- [Supabase 문서](https://supabase.com/docs)
- [GitHub 가이드](https://docs.github.com/en)

---

## 배포 완료!

축하합니다! DietCare 앱이 성공적으로 배포되었습니다.

**다음 단계:**
- 모바일 기기에서 접속 테스트
- 실제 환자 데이터로 테스트
- 피드백 수집 및 개선
- 추가 기능 개발

문제가 발생하면 Vercel 대시보드의 로그를 확인하거나, GitHub Issues를 활용하세요.
