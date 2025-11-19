import React, { useEffect } from 'react';
import { Smartphone, UserPlus } from 'lucide-react';
import { initKakao, loginWithKakao } from '../services/kakaoService';

interface PatientLandingPageProps {
  onStartSignup: () => void;
  onStartLogin: () => void;
  onKakaoLogin: (kakaoId: string, nickname: string, phone?: string) => void;
}

export const PatientLandingPage: React.FC<PatientLandingPageProps> = ({ onStartSignup, onStartLogin, onKakaoLogin }) => {
  useEffect(() => {
    // Initialize Kakao SDK
    initKakao();
  }, []);

  const handleKakaoLogin = async () => {
    try {
      const userInfo = await loginWithKakao();
      console.log('Received user info:', userInfo);

      const kakaoId = userInfo.id.toString();

      // Safely access nested properties with optional chaining
      const nickname = userInfo.kakao_account?.profile?.nickname ||
                       userInfo.properties?.nickname ||
                       '카카오 사용자';

      const phone = userInfo.kakao_account?.phone_number?.replace('+82 ', '0').replace(/-/g, '') || '';

      console.log('Extracted info:', { kakaoId, nickname, phone });

      onKakaoLogin(kakaoId, nickname, phone);
    } catch (error: any) {
      console.error('Kakao login error:', error);

      // Show detailed error message
      const errorMessage = error?.message || '카카오 로그인에 실패했습니다.';
      alert(`❌ ${errorMessage}\n\n브라우저 콘솔(F12)을 확인해주세요.`);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-brand-50 to-white p-6">
      <div className="w-full max-w-md space-y-8 text-center">
        <div className="space-y-2">
          <div className="w-20 h-20 bg-brand-600 rounded-3xl flex items-center justify-center text-white text-3xl font-bold mx-auto shadow-xl shadow-brand-200 mb-6">
            연
          </div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">연이재한의원</h1>
          <p className="text-gray-500 text-lg">식단관리 시스템</p>
        </div>

        <div className="pt-8 space-y-3">
          <button
            onClick={handleKakaoLogin}
            className="group relative w-full flex items-center justify-center p-5 bg-[#FEE500] hover:bg-[#FDD835] rounded-2xl shadow-lg hover:shadow-xl transition-all"
          >
            <div className="flex items-center gap-3">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 3C6.477 3 2 6.477 2 10.8c0 2.754 1.797 5.166 4.476 6.561-.192.696-.63 2.295-.72 2.652-.108.423.155.418.328.304.138-.092 2.163-1.44 2.967-1.98C9.936 18.6 10.955 18.6 12 18.6c5.523 0 10-3.477 10-7.8S17.523 3 12 3z" fill="#3C1E1E"/>
              </svg>
              <div className="text-left">
                <h3 className="font-bold text-lg text-[#3C1E1E]">카카오로 시작하기</h3>
              </div>
            </div>
          </button>

          <div className="relative flex items-center justify-center">
            <div className="border-t border-gray-300 w-full"></div>
            <span className="absolute bg-gradient-to-br from-brand-50 to-white px-3 text-sm text-gray-400">또는</span>
          </div>

          <button
            onClick={onStartLogin}
            className="group relative w-full flex items-center justify-center p-5 bg-brand-600 hover:bg-brand-700 rounded-2xl shadow-lg hover:shadow-xl transition-all text-white"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                <Smartphone size={24} />
              </div>
              <div className="text-left">
                <h3 className="font-bold text-lg">전화번호로 시작하기</h3>
                <p className="text-xs text-brand-100">기존 환자는 간편 로그인</p>
              </div>
            </div>
          </button>
        </div>

        <div className="pt-12 space-y-4">
          <div className="flex items-center gap-3 text-left">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Smartphone size={20} className="text-green-600" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">사진으로 간편 기록</h4>
              <p className="text-sm text-gray-500">음식 사진만 찍으면 AI가 자동 분석</p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-left">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">체중 변화 추적</h4>
              <p className="text-sm text-gray-500">목표 달성까지 함께합니다</p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-left">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">AI 영양 조언</h4>
              <p className="text-sm text-gray-500">맞춤형 식단 피드백</p>
            </div>
          </div>
        </div>

        <div className="pt-8">
          <p className="text-xs text-gray-400">
            관리자이신가요?{' '}
            <a href="#/admin" className="text-brand-600 hover:text-brand-700 underline">
              관리자 페이지로 이동
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};
