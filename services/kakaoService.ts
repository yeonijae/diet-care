// Kakao Login Service
declare global {
  interface Window {
    Kakao: any;
  }
}

export interface KakaoUserInfo {
  id: string;
  kakao_account: {
    profile?: {
      nickname: string;
      profile_image_url?: string;
    };
    email?: string;
    phone_number?: string;
  };
}

// Initialize Kakao SDK
export const initKakao = () => {
  console.log('🔧 Initializing Kakao SDK...');
  console.log('window.Kakao exists:', !!window.Kakao);

  if (!window.Kakao) {
    console.error('❌ Kakao SDK not loaded. Check if script is included in index.html');
    return;
  }

  if (window.Kakao.isInitialized()) {
    console.log('✅ Kakao SDK already initialized');
    return;
  }

  const kakaoKey = import.meta.env.VITE_KAKAO_JAVASCRIPT_KEY;
  console.log('Kakao Key exists:', !!kakaoKey);
  console.log('Kakao Key (first 10 chars):', kakaoKey?.substring(0, 10));

  if (!kakaoKey || kakaoKey === 'your_kakao_javascript_key_here') {
    console.error('❌ Kakao JavaScript Key is missing or not configured');
    console.error('Please set VITE_KAKAO_JAVASCRIPT_KEY in .env.local');
    alert('카카오 로그인 설정이 필요합니다.\n관리자에게 문의하세요.');
    return;
  }

  try {
    window.Kakao.init(kakaoKey);
    console.log('✅ Kakao SDK initialized successfully:', window.Kakao.isInitialized());
  } catch (error) {
    console.error('❌ Failed to initialize Kakao SDK:', error);
  }
};

// Kakao Login
export const loginWithKakao = (): Promise<KakaoUserInfo> => {
  return new Promise((resolve, reject) => {
    console.log('🔐 Attempting Kakao login...');

    if (!window.Kakao) {
      const error = new Error('Kakao SDK not loaded');
      console.error('❌', error);
      reject(error);
      return;
    }

    if (!window.Kakao.isInitialized()) {
      const error = new Error('Kakao SDK not initialized. Call initKakao() first.');
      console.error('❌', error);
      reject(error);
      return;
    }

    window.Kakao.Auth.login({
      success: (authObj: any) => {
        console.log('✅ Kakao login success:', authObj);

        // Get user info
        window.Kakao.API.request({
          url: '/v2/user/me',
          success: (res: KakaoUserInfo) => {
            console.log('✅ Kakao user info received:', res);

            // Save to localStorage for auto-login
            localStorage.setItem('kakao_user_id', res.id.toString());
            localStorage.setItem('kakao_access_token', authObj.access_token);

            resolve(res);
          },
          fail: (error: any) => {
            console.error('❌ Failed to get user info:', error);
            reject(new Error(`사용자 정보를 가져올 수 없습니다: ${error.msg || 'Unknown error'}`));
          }
        });
      },
      fail: (error: any) => {
        console.error('❌ Kakao login failed:', error);
        reject(new Error(`카카오 로그인 실패: ${error.error || error.msg || 'Unknown error'}`));
      }
    });
  });
};

// Logout
export const logoutKakao = () => {
  if (window.Kakao && window.Kakao.Auth) {
    window.Kakao.Auth.logout(() => {
      console.log('Kakao logout success');
      localStorage.removeItem('kakao_user_id');
      localStorage.removeItem('kakao_access_token');
    });
  }
};

// Check if user is logged in
export const isKakaoLoggedIn = (): boolean => {
  const kakaoUserId = localStorage.getItem('kakao_user_id');
  const kakaoToken = localStorage.getItem('kakao_access_token');
  return !!(kakaoUserId && kakaoToken);
};

// Get saved Kakao user ID
export const getSavedKakaoUserId = (): string | null => {
  return localStorage.getItem('kakao_user_id');
};

// Get user info from token (for auto-login)
export const getKakaoUserInfo = (): Promise<KakaoUserInfo> => {
  return new Promise((resolve, reject) => {
    if (!window.Kakao || !isKakaoLoggedIn()) {
      reject(new Error('Not logged in'));
      return;
    }

    window.Kakao.API.request({
      url: '/v2/user/me',
      success: (res: KakaoUserInfo) => {
        resolve(res);
      },
      fail: (error: any) => {
        // Token expired, clear and require re-login
        localStorage.removeItem('kakao_user_id');
        localStorage.removeItem('kakao_access_token');
        reject(error);
      }
    });
  });
};
