import React, { useState } from 'react';
import { Button } from '../components/Button';
import { Monitor, Lock } from 'lucide-react';

interface AdminLoginPageProps {
  onLogin: (password: string) => void;
  onBack: () => void;
}

export const AdminLoginPage: React.FC<AdminLoginPageProps> = ({ onLogin, onBack }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // 간단한 비밀번호 체크 (프로덕션에서는 Supabase Auth 사용)
    if (password === 'admin1234') {
      onLogin(password);
    } else {
      setError('비밀번호가 올바르지 않습니다.');
      setPassword('');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="w-full max-w-md">
        <button
          onClick={onBack}
          className="mb-6 text-gray-500 hover:text-gray-800 transition-colors"
        >
          ← 돌아가기
        </button>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-gray-900 rounded-2xl flex items-center justify-center text-white mb-4">
              <Monitor size={32} />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">관리자 로그인</h1>
            <p className="text-gray-500 text-sm mt-2">연이재한의원 식단관리</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Lock size={16} className="inline mr-1" />
                비밀번호
              </label>
              <input
                type="password"
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none"
                placeholder="관리자 비밀번호 입력"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
              />
              {error && (
                <p className="mt-2 text-sm text-red-600">{error}</p>
              )}
            </div>

            <div className="pt-4">
              <Button type="submit" fullWidth className="bg-gray-900 hover:bg-gray-800">
                로그인
              </Button>
            </div>
          </form>

          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500 text-center">
              데모 비밀번호: <code className="bg-gray-200 px-2 py-1 rounded">admin1234</code>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
