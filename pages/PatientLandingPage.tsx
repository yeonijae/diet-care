import React from 'react';
import { Smartphone, UserPlus } from 'lucide-react';

interface PatientLandingPageProps {
  onStartSignup: () => void;
}

export const PatientLandingPage: React.FC<PatientLandingPageProps> = ({ onStartSignup }) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-brand-50 to-white p-6">
      <div className="w-full max-w-md space-y-8 text-center">
        <div className="space-y-2">
          <div className="w-20 h-20 bg-brand-600 rounded-3xl flex items-center justify-center text-white text-4xl font-bold mx-auto shadow-xl shadow-brand-200 mb-6">
            D
          </div>
          <h1 className="text-4xl font-bold text-gray-900 tracking-tight">DietCare AI</h1>
          <p className="text-gray-500 text-lg">AI 기반 식단 관리 서비스</p>
        </div>

        <div className="pt-8">
          <button
            onClick={onStartSignup}
            className="group relative w-full flex items-center justify-center p-6 bg-brand-600 hover:bg-brand-700 rounded-2xl shadow-lg hover:shadow-xl transition-all text-white"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                <UserPlus size={28} />
              </div>
              <div className="text-left">
                <h3 className="font-bold text-xl">시작하기</h3>
                <p className="text-sm text-brand-100">식단 기록을 시작하세요</p>
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
