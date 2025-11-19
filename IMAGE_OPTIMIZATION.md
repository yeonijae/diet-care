# 이미지 용량 최적화 가이드

## ✅ 현재 적용된 최적화

### 1. 이미지 압축 (compressImage)
**위치:** `services/geminiService.ts`

현재 설정:
```typescript
- 최대 해상도: 800x800px
- JPEG 품질: 0.7 (70%)
- 포맷: JPEG
```

**예상 용량 절감:** 원본 대비 70-90% 감소

예시:
- 원본 (3000x4000px, 5MB) → 압축 (800x1067px, ~200-500KB)
- 원본 (1920x1080px, 2MB) → 압축 (800x450px, ~100-200KB)

---

## 🚀 추가 최적화 방법

### 2. 압축 품질 조정

**더 공격적인 압축이 필요하다면:**

`services/geminiService.ts` 파일의 52번 줄을 수정:

```typescript
// 현재
const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);

// 옵션 1: 더 작은 파일 (품질 약간 저하)
const compressedBase64 = canvas.toDataURL('image/jpeg', 0.6);

// 옵션 2: 훨씬 작은 파일 (품질 눈에 띄게 저하)
const compressedBase64 = canvas.toDataURL('image/jpeg', 0.5);
```

**권장:** 0.6 ~ 0.7 사이 (음식 사진은 품질이 중요함)

---

### 3. 해상도 조정

**모바일 환경에서 더 작은 이미지가 필요하다면:**

`services/geminiService.ts` 파일의 22-23번 줄을 수정:

```typescript
// 현재 (800x800)
const MAX_WIDTH = 800;
const MAX_HEIGHT = 800;

// 옵션 1: 더 작게 (600x600)
const MAX_WIDTH = 600;
const MAX_HEIGHT = 600;

// 옵션 2: 훨씬 작게 (400x400) - 추천하지 않음
const MAX_WIDTH = 400;
const MAX_HEIGHT = 400;
```

**권장:** 600-800px (AI 분석 품질 유지를 위해)

---

### 4. WebP 포맷 사용 (고급)

WebP는 JPEG보다 20-30% 더 작은 파일 크기를 제공합니다.

**장점:**
- 더 작은 파일 크기
- 더 빠른 로딩

**단점:**
- 구형 브라우저 미지원 (Safari < 14, IE 미지원)

**구현 방법:**

```typescript
// geminiService.ts의 compressImage 함수 수정
const canvas = document.createElement('canvas');
// ... 캔버스 설정 ...

// WebP 지원 확인
const supportsWebP = canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;

if (supportsWebP) {
  const compressedBase64 = canvas.toDataURL('image/webp', 0.7);
  resolve(compressedBase64);
} else {
  const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
  resolve(compressedBase64);
}
```

---

### 5. 점진적 업로드 (Progressive JPEG)

브라우저에서 Canvas API는 자동으로 baseline JPEG를 생성합니다.
Progressive JPEG를 사용하려면 서버 사이드 처리가 필요합니다.

**Supabase Edge Function 예시:**

```typescript
// functions/compress-image/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { Image } from 'https://deno.land/x/imagescript@1.2.15/mod.ts';

serve(async (req) => {
  const formData = await req.formData();
  const file = formData.get('file');

  const image = await Image.decode(await file.arrayBuffer());
  image.resize(800, Image.RESIZE_AUTO);

  const compressed = await image.encodeJPEG(70); // Progressive JPEG

  return new Response(compressed, {
    headers: { 'Content-Type': 'image/jpeg' },
  });
});
```

---

## 📊 용량 비교

| 방법 | 파일 크기 | 품질 | 구현 난이도 |
|------|-----------|------|-------------|
| **원본 (적용 전)** | 3-8MB | 최고 | - |
| **현재 (JPEG 0.7, 800px)** | 200-500KB | 우수 | ✅ 완료 |
| JPEG 0.6, 800px | 150-400KB | 양호 | 쉬움 |
| JPEG 0.7, 600px | 120-300KB | 양호 | 쉬움 |
| WebP 0.7, 800px | 150-350KB | 우수 | 중간 |
| WebP 0.7, 600px | 100-250KB | 양호 | 중간 |

---

## 🎯 권장 설정

### 현재 프로젝트에 최적:

```typescript
// services/geminiService.ts

const MAX_WIDTH = 800;   // 충분한 품질
const MAX_HEIGHT = 800;
const QUALITY = 0.7;     // 70% 품질

canvas.toDataURL('image/jpeg', QUALITY);
```

**이유:**
1. ✅ AI 분석에 충분한 해상도
2. ✅ 모바일 화면에 적합
3. ✅ 70-90% 용량 절감
4. ✅ 빠른 업로드 속도
5. ✅ Supabase 무료 티어에 적합

---

## 💾 Supabase Storage 제한

### 무료 티어
- 스토리지: 1GB
- 전송량: 2GB/월

### 예상 사용량 (현재 최적화 적용 시)
- 이미지당 평균: ~300KB
- 1GB로 약 **3,300장** 저장 가능
- 하루 10명 환자, 각 3장 촬영 시: **110일** 사용 가능

### Pro 플랜 ($25/월)
- 스토리지: 100GB
- 전송량: 200GB/월
- 약 **330,000장** 저장 가능

---

## 🔧 추가 최적화 팁

### 1. 오래된 이미지 정리
```sql
-- 90일 이상 된 이미지 삭제
DELETE FROM meal_logs
WHERE date < NOW() - INTERVAL '90 days';
```

### 2. Storage Lifecycle 설정
Supabase 대시보드에서:
- Storage → meal-images → Policies
- 자동 삭제 규칙 설정 (예: 180일 후 삭제)

### 3. CDN 활용
Supabase Storage는 자동으로 CDN을 사용하므로 추가 설정 불필요

### 4. 이미지 레이지 로딩
현재 구현에는 브라우저 기본 레이지 로딩 사용:
```tsx
<img src={imageUrl} loading="lazy" />
```

---

## 🧪 테스트 방법

### 파일 크기 확인
```typescript
// 압축 전
console.log('원본 크기:', (file.size / 1024 / 1024).toFixed(2), 'MB');

// 압축 후
const compressedBase64 = await compressImage(file);
const sizeInBytes = (compressedBase64.length * 3) / 4; // base64는 33% 더 큼
console.log('압축 후 크기:', (sizeInBytes / 1024).toFixed(2), 'KB');
```

### Chrome DevTools
1. Network 탭 열기
2. 이미지 업로드
3. "meal-images" 요청 확인
4. Size 컬럼에서 전송된 크기 확인

---

## 🚨 주의사항

1. **너무 공격적인 압축은 피하세요**
   - AI 분석 정확도 저하
   - 음식 식별 어려움

2. **해상도를 너무 낮추지 마세요**
   - 600px 미만: AI 분석 품질 저하 가능
   - 800px 권장

3. **압축 전후 비교 테스트**
   - 다양한 음식 사진으로 테스트
   - AI 분석 정확도 확인

---

## 📝 현재 구현 요약

✅ **적용 완료:**
- 800x800px 최대 해상도
- JPEG 70% 품질
- Storage에 압축된 이미지 저장
- AI 분석에도 압축된 이미지 사용

💡 **예상 효과:**
- 원본 5MB → 압축 후 ~300KB (94% 절감)
- 1GB로 3,300장 저장 가능
- 빠른 업로드 및 로딩 속도

🎉 **추가 설정 불필요!**
현재 설정이 대부분의 사용 사례에 최적입니다.
