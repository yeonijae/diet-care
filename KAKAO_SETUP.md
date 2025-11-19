# 카카오 로그인 설정 가이드

## 🔧 카카오 로그인이 작동하지 않을 때

### 1단계: 브라우저 콘솔 확인

1. 브라우저에서 **F12** 키를 눌러 개발자 도구 열기
2. **Console** 탭으로 이동
3. 페이지 새로고침
4. 콘솔에 표시되는 메시지 확인:

#### 예상 메시지들:

**✅ 정상 작동:**
```
🔧 Initializing Kakao SDK...
window.Kakao exists: true
Kakao Key exists: true
Kakao Key (first 10 chars): 1234567890
✅ Kakao SDK initialized successfully: true
```

**❌ JavaScript 키가 없는 경우:**
```
❌ Kakao JavaScript Key is missing or not configured
Please set VITE_KAKAO_JAVASCRIPT_KEY in .env.local
```
→ **해결책**: 아래 "2단계: JavaScript 키 발급" 참조

**❌ SDK가 로드되지 않은 경우:**
```
❌ Kakao SDK not loaded. Check if script is included in index.html
```
→ **해결책**: `index.html`에 카카오 스크립트가 있는지 확인
```html
<script src="https://developers.kakao.com/sdk/js/kakao.min.js"></script>
```

---

## 2단계: 카카오 JavaScript 키 발급

### A. 카카오 Developers 계정 생성

1. https://developers.kakao.com 접속
2. **로그인** (카카오톡 계정으로)
3. 첫 방문이라면 약관 동의 후 개발자 등록

### B. 애플리케이션 생성

1. **내 애플리케이션** 메뉴 클릭
2. **애플리케이션 추가하기** 버튼 클릭
3. 앱 정보 입력:
   - **앱 이름**: `연이재한의원 식단관리` (또는 원하는 이름)
   - **사업자명**: 한의원 이름
   - **카테고리**: 의료/건강
4. **저장** 클릭

### C. JavaScript 키 복사

1. 생성된 앱 클릭
2. 좌측 메뉴 **앱 설정** → **앱 키** 클릭
3. **JavaScript 키** 복사 (예: `1234567890abcdef1234567890abcdef`)

### D. 환경 변수에 키 추가

프로젝트 루트의 `.env.local` 파일 열기:

```env
# 기존 내용...

# Kakao Configuration
VITE_KAKAO_JAVASCRIPT_KEY=여기에_복사한_JavaScript_키_붙여넣기
```

**예시:**
```env
VITE_KAKAO_JAVASCRIPT_KEY=1234567890abcdef1234567890abcdef
```

**주의:**
- 따옴표 없이 키만 입력
- 앞뒤 공백 없이 입력
- `.env.local` 파일은 Git에 커밋하지 않음 (이미 .gitignore에 포함됨)

### E. 개발 서버 재시작

키를 추가한 후 반드시 개발 서버를 재시작해야 합니다:

```bash
# Ctrl+C로 서버 중지 후
npm run dev
```

---

## 3단계: 플랫폼 등록

### A. Web 플랫폼 등록

1. 카카오 Developers 앱 페이지
2. 좌측 메뉴 **앱 설정** → **플랫폼** 클릭
3. **Web 플랫폼 등록** 버튼 클릭
4. 사이트 도메인 입력:
   ```
   http://localhost:3005
   ```
   (포트 번호는 실제 사용 중인 포트로 변경)
5. **저장** 클릭

### B. 배포 후 도메인 추가

Vercel에 배포한 경우:

1. **Web 플랫폼 등록** 다시 클릭
2. Vercel 도메인 추가:
   ```
   https://your-app.vercel.app
   ```
3. **저장** 클릭

---

## 4단계: 카카오 로그인 활성화

### A. 카카오 로그인 설정

1. 좌측 메뉴 **제품 설정** → **카카오 로그인** 클릭
2. **카카오 로그인 활성화** 토글 **ON**
3. **상태**: 활성화됨으로 변경 확인

### B. Redirect URI 등록

1. 같은 페이지에서 아래로 스크롤
2. **Redirect URI** 섹션에서 **Redirect URI 등록** 클릭
3. 개발용 URI 입력:
   ```
   http://localhost:3005
   ```
4. **저장** 클릭

배포 후:
5. **Redirect URI 등록** 다시 클릭
6. 프로덕션 URI 입력:
   ```
   https://your-app.vercel.app
   ```
7. **저장** 클릭

---

## 5단계: 동의항목 설정

### A. 필수 동의항목

1. 좌측 메뉴 **제품 설정** → **카카오 로그인** → **동의항목** 클릭
2. 필수 항목 (기본 제공):
   - ✅ **닉네임** (필수)
   - ✅ **프로필 이미지** (선택)

### B. 선택 동의항목 (추가 신청 필요)

식단관리 앱에 유용한 항목:

1. **카카오계정(이메일)**
   - 비즈니스 앱 전환 후 사용 가능
   - 또는 검수 신청

2. **전화번호**
   - 사업자 등록증 제출 필요
   - 검수 신청 후 승인 시 사용 가능

**참고:** 초기에는 닉네임만으로도 충분히 작동합니다.

---

## 6단계: 테스트

### A. 로컬 환경 테스트

1. 브라우저에서 http://localhost:3005 접속
2. **카카오로 시작하기** 버튼 클릭
3. 카카오 로그인 팝업 확인
4. 로그인 후 앱으로 돌아오는지 확인

### B. 테스트 계정

개발 단계에서는 카카오 Developers에 등록된 계정만 로그인 가능합니다.

**다른 사람도 테스트하려면:**

1. 카카오 Developers → **앱 설정** → **앱 팀 관리**
2. **팀원 초대** 클릭
3. 테스트할 사람의 카카오계정 이메일 입력
4. 역할: **테스터** 선택
5. 초대 완료

### C. 비즈니스 앱 전환 (선택)

모든 사용자가 로그인할 수 있게 하려면:

1. **앱 설정** → **비즈니스 설정**
2. 사업자 정보 입력
3. **비즈니스 앱으로 전환** 신청
4. 승인 대기 (1-3일 소요)

---

## 🚨 자주 발생하는 오류

### 오류 1: "KOE101: Kakao Login not enabled"

**원인:** 카카오 로그인이 활성화되지 않음

**해결:**
1. 카카오 Developers
2. **제품 설정** → **카카오 로그인**
3. **활성화** 토글 ON

### 오류 2: "KOE006: Invalid redirect URI"

**원인:** Redirect URI가 등록되지 않음

**해결:**
1. **제품 설정** → **카카오 로그인**
2. **Redirect URI** 섹션
3. 현재 사용 중인 도메인 등록

### 오류 3: "SDK not initialized"

**원인:** JavaScript 키가 잘못됨

**해결:**
1. `.env.local` 파일에서 키 확인
2. 카카오 Developers에서 JavaScript 키 다시 복사
3. 개발 서버 재시작

### 오류 4: "사용자 정보를 가져올 수 없습니다"

**원인:** 동의항목 설정 문제 또는 권한 부족

**해결:**
1. **동의항목** 설정 확인
2. 닉네임이 필수로 설정되어 있는지 확인
3. 테스터로 등록되어 있는지 확인

---

## 📋 체크리스트

배포 전 확인사항:

- [ ] JavaScript 키를 발급받았는가?
- [ ] `.env.local`에 키를 추가했는가?
- [ ] 개발 서버를 재시작했는가?
- [ ] Web 플랫폼을 등록했는가? (localhost)
- [ ] 카카오 로그인을 활성화했는가?
- [ ] Redirect URI를 등록했는가? (localhost)
- [ ] 브라우저 콘솔에서 초록색 체크마크를 확인했는가?
- [ ] 카카오 로그인 팝업이 뜨는가?
- [ ] 로그인 후 앱으로 돌아오는가?

배포 후 확인사항:

- [ ] Vercel 환경 변수에 VITE_KAKAO_JAVASCRIPT_KEY를 추가했는가?
- [ ] Web 플랫폼에 Vercel 도메인을 추가했는가?
- [ ] Redirect URI에 Vercel 도메인을 추가했는가?
- [ ] 비즈니스 앱으로 전환했는가? (모든 사용자가 로그인 가능)

---

## 💬 문제 해결

여전히 작동하지 않는다면:

1. **브라우저 콘솔 확인**
   - F12 → Console 탭
   - 빨간색 에러 메시지 확인
   - 스크린샷 찍기

2. **네트워크 탭 확인**
   - F12 → Network 탭
   - 카카오 로그인 시도
   - 실패한 요청 확인

3. **캐시 클리어**
   - Ctrl+Shift+Delete
   - 쿠키 및 캐시 삭제
   - 페이지 새로고침

4. **다른 브라우저 테스트**
   - Chrome, Edge, Safari 등

5. **카카오 개발자 지원**
   - https://devtalk.kakao.com
   - 카카오 개발자 포럼 질문

---

## 📞 추가 도움

- **카카오 Developers 문서**: https://developers.kakao.com/docs/latest/ko/kakaologin/common
- **카카오 개발자 포럼**: https://devtalk.kakao.com
- **프로젝트 이슈**: GitHub Issues 탭 활용
