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
  if (window.Kakao && !window.Kakao.isInitialized()) {
    const kakaoKey = import.meta.env.VITE_KAKAO_JAVASCRIPT_KEY;
    if (kakaoKey) {
      window.Kakao.init(kakaoKey);
      console.log('Kakao SDK initialized:', window.Kakao.isInitialized());
    } else {
      console.error('Kakao JavaScript Key is missing');
    }
  }
};

// Kakao Login
export const loginWithKakao = (): Promise<KakaoUserInfo> => {
  return new Promise((resolve, reject) => {
    if (!window.Kakao) {
      reject(new Error('Kakao SDK not loaded'));
      return;
    }

    window.Kakao.Auth.login({
      success: (authObj: any) => {
        console.log('Kakao login success:', authObj);

        // Get user info
        window.Kakao.API.request({
          url: '/v2/user/me',
          success: (res: KakaoUserInfo) => {
            console.log('Kakao user info:', res);

            // Save to localStorage for auto-login
            localStorage.setItem('kakao_user_id', res.id.toString());
            localStorage.setItem('kakao_access_token', authObj.access_token);

            resolve(res);
          },
          fail: (error: any) => {
            console.error('Failed to get user info:', error);
            reject(error);
          }
        });
      },
      fail: (error: any) => {
        console.error('Kakao login failed:', error);
        reject(error);
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
