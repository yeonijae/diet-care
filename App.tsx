import React, { useState, useEffect } from 'react';
import { Router } from './Router';
import { PatientDashboard } from './components/PatientDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { PatientLandingPage } from './pages/PatientLandingPage';
import { AdminLoginPage } from './pages/AdminLoginPage';
import { Button } from './components/Button';
import { Patient } from './types';
import { Clock, Loader2, UserPlus } from 'lucide-react';
import {
  getDeviceId,
  createPatient,
  getPatientByDeviceId,
  getPatientByKakaoId,
  getPatientByPhoneAndBirthdate,
  getAllPatients,
  updatePatient,
  subscribeToPatientUpdates
} from './services/supabaseService';
import { isKakaoLoggedIn, getSavedKakaoUserId, getKakaoUserInfo } from './services/kakaoService';

const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [patients, setPatients] = useState<Patient[]>([]);

  // Patient state
  const [patientView, setPatientView] = useState<'landing' | 'login' | 'signup' | 'pending' | 'dashboard'>('landing');
  const [currentPatient, setCurrentPatient] = useState<Patient | null>(null);
  const [signupForm, setSignupForm] = useState({ name: '', phone: '', birthdate: '', age: '', weight: '', target: '' });
  const [loginForm, setLoginForm] = useState({ name: '', phone: '', birthdate: '' });

  // Admin state
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);

  // Load patient data on mount (환자 자동 로그인)
  useEffect(() => {
    const loadPatientData = async () => {
      setIsLoading(true);

      let patient = null;

      // First, check if user has Kakao login
      if (isKakaoLoggedIn()) {
        const kakaoUserId = getSavedKakaoUserId();
        if (kakaoUserId) {
          patient = await getPatientByKakaoId(kakaoUserId);
        }
      }

      // If no Kakao patient, check device ID
      if (!patient) {
        const deviceId = getDeviceId();
        patient = await getPatientByDeviceId(deviceId);
      }

      if (patient) {
        if (patient.status === 'ACTIVE') {
          setCurrentPatient(patient);
          setPatientView('dashboard');
        } else if (patient.status === 'PENDING') {
          setPatientView('pending');
        } else if (patient.status === 'REJECTED') {
          localStorage.removeItem('dietcare_device_id');
          setPatientView('landing');
        }
      } else {
        setPatientView('landing');
      }

      setIsLoading(false);
    };

    loadPatientData();
  }, []);

  // Check admin login status
  useEffect(() => {
    const adminToken = localStorage.getItem('dietcare_admin_token');
    if (adminToken === 'admin_logged_in') {
      setIsAdminLoggedIn(true);
      loadAllPatients();
    }
  }, []);

  // Real-time updates for admin
  useEffect(() => {
    if (isAdminLoggedIn) {
      const unsubscribe = subscribeToPatientUpdates(() => {
        loadAllPatients();
      });
      return () => unsubscribe();
    }
  }, [isAdminLoggedIn]);

  const loadAllPatients = async () => {
    const allPatients = await getAllPatients();
    setPatients(allPatients);
  };

  const handlePatientSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const deviceId = getDeviceId();
    const kakaoId = localStorage.getItem('dietcare_kakao_id');

    const newPatientData: any = {
      deviceId: deviceId,
      status: 'PENDING',
      name: signupForm.name,
      phoneNumber: signupForm.phone,
      birthdate: signupForm.birthdate || undefined,
      joinedAt: new Date().toISOString(),
      age: parseInt(signupForm.age) || 0,
      currentWeight: parseFloat(signupForm.weight) || 0,
      startWeight: parseFloat(signupForm.weight) || 0,
      targetWeight: parseFloat(signupForm.target) || 0,
    };

    // Add kakao_id if exists
    if (kakaoId) {
      newPatientData.kakaoId = kakaoId;
    }

    const createdPatient = await createPatient(newPatientData);

    if (createdPatient) {
      setPatientView('pending');
      // Clear the temporary kakao_id from localStorage
      localStorage.removeItem('dietcare_kakao_id');
    } else {
      alert('가입 신청에 실패했습니다. 다시 시도해주세요.');
    }

    setIsLoading(false);
  };

  const handleSimpleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Try to find existing patient
    const patient = await getPatientByPhoneAndBirthdate(
      loginForm.phone,
      loginForm.name,
      loginForm.birthdate
    );

    if (patient) {
      // Found existing patient - update device ID and log in
      const deviceId = getDeviceId();
      if (patient.deviceId !== deviceId) {
        // Update device ID to current device
        await updatePatient(patient.id, { ...patient, deviceId });
      }

      if (patient.status === 'ACTIVE') {
        setCurrentPatient(patient);
        setPatientView('dashboard');
      } else if (patient.status === 'PENDING') {
        setPatientView('pending');
      } else if (patient.status === 'REJECTED') {
        alert('가입이 거부되었습니다. 관리자에게 문의하세요.');
        setPatientView('landing');
      }
    } else {
      // No existing patient - go to signup with pre-filled data
      setSignupForm({
        name: loginForm.name,
        phone: loginForm.phone,
        birthdate: loginForm.birthdate,
        age: '',
        weight: '',
        target: ''
      });
      setPatientView('signup');
    }

    setIsLoading(false);
  };

  const handlePatientUpdate = async (updatedPatient: Patient) => {
    const success = await updatePatient(updatedPatient.id, updatedPatient);
    if (success) {
      setPatients(prev => prev.map(p => p.id === updatedPatient.id ? updatedPatient : p));

      if (currentPatient && currentPatient.id === updatedPatient.id) {
        const refreshedPatient = await getPatientByDeviceId(getDeviceId());
        if (refreshedPatient) {
          setCurrentPatient(refreshedPatient);
        }
      }
    }
  };

  const handleAdminLogin = (password: string) => {
    localStorage.setItem('dietcare_admin_token', 'admin_logged_in');
    setIsAdminLoggedIn(true);
    loadAllPatients();
  };

  const handleAdminLogout = () => {
    localStorage.removeItem('dietcare_admin_token');
    setIsAdminLoggedIn(false);
    setPatients([]);
  };

  const handleKakaoLogin = async (kakaoId: string, nickname: string, phone?: string) => {
    setIsLoading(true);

    // Check if patient exists with this kakao_id
    let patient = await getPatientByKakaoId(kakaoId);

    // Also check by device ID in case patient was created before Kakao login
    if (!patient) {
      const deviceId = getDeviceId();
      patient = await getPatientByDeviceId(deviceId);
    }

    if (patient) {
      // Existing patient - check status
      if (patient.status === 'ACTIVE') {
        setCurrentPatient(patient);
        setPatientView('dashboard');
      } else if (patient.status === 'PENDING') {
        setPatientView('pending');
      } else if (patient.status === 'REJECTED') {
        localStorage.removeItem('dietcare_device_id');
        setPatientView('landing');
      }
    } else {
      // New patient - pre-fill signup form with Kakao data and save kakao_id
      setSignupForm({
        name: nickname,
        phone: phone || '',
        birthdate: '',
        age: '',
        weight: '',
        target: ''
      });
      // Save kakao_id to localStorage so we can use it in signup
      localStorage.setItem('dietcare_kakao_id', kakaoId);
      setPatientView('signup');
    }

    setIsLoading(false);
  };

  return (
    <Router>
      {(route, setRoute) => {
        // Loading screen
        if (isLoading && route === 'patient') {
          return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-brand-50 to-white">
              <Loader2 className="animate-spin text-brand-600 mb-4" size={48} />
              <p className="text-gray-600">로딩 중...</p>
            </div>
          );
        }

        // Admin routes
        if (route === 'admin') {
          if (!isAdminLoggedIn) {
            return <AdminLoginPage onLogin={handleAdminLogin} onBack={() => setRoute('patient')} />;
          }
          return (
            <AdminDashboard
              patients={patients}
              onUpdatePatient={handlePatientUpdate}
              onLogout={handleAdminLogout}
            />
          );
        }

        // Patient routes
        if (patientView === 'landing') {
          return <PatientLandingPage
            onStartSignup={() => setPatientView('signup')}
            onStartLogin={() => setPatientView('login')}
            onKakaoLogin={handleKakaoLogin}
          />;
        }

        if (patientView === 'login') {
          return (
            <div className="min-h-screen flex flex-col bg-white p-6">
              <div className="max-w-md mx-auto w-full">
                <button onClick={() => setPatientView('landing')} className="mb-6 text-gray-500 hover:text-gray-800">
                  ← 돌아가기
                </button>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">간편 로그인/가입</h1>
                <p className="text-gray-500 mb-8 text-sm">
                  기존 환자는 자동 로그인되고, 신규 환자는 추가 정보 입력 후 가입 신청됩니다.
                </p>

                <form onSubmit={handleSimpleLogin} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">이름</label>
                    <input
                      required
                      type="text"
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none"
                      placeholder="홍길동"
                      value={loginForm.name}
                      onChange={e => setLoginForm({ ...loginForm, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">휴대폰 번호</label>
                    <input
                      required
                      type="tel"
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none"
                      placeholder="010-1234-5678"
                      value={loginForm.phone}
                      onChange={e => setLoginForm({ ...loginForm, phone: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">생년월일</label>
                    <input
                      required
                      type="date"
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none"
                      value={loginForm.birthdate}
                      onChange={e => setLoginForm({ ...loginForm, birthdate: e.target.value })}
                    />
                    <p className="text-xs text-gray-500 mt-1">본인 확인용으로 사용됩니다</p>
                  </div>

                  <div className="pt-4">
                    <Button type="submit" fullWidth className="bg-brand-600">
                      <Smartphone size={18} /> 계속하기
                    </Button>
                  </div>
                </form>

                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <p className="text-xs text-blue-800">
                    <strong>기존 환자:</strong> 정보가 일치하면 자동 로그인됩니다.<br/>
                    <strong>신규 환자:</strong> 추가 정보 입력 후 가입 신청이 진행됩니다.
                  </p>
                </div>
              </div>
            </div>
          );
        }

        if (patientView === 'signup') {
          return (
            <div className="min-h-screen flex flex-col bg-white p-6">
              <div className="max-w-md mx-auto w-full">
                <button onClick={() => setPatientView('landing')} className="mb-6 text-gray-500 hover:text-gray-800">
                  ← 돌아가기
                </button>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">환자 등록 신청</h1>
                <p className="text-gray-500 mb-8 text-sm">관리자의 승인 후 서비스를 이용하실 수 있습니다.</p>

                <form onSubmit={handlePatientSignup} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">이름</label>
                    <input required type="text" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none" placeholder="홍길동"
                      value={signupForm.name} onChange={e => setSignupForm({ ...signupForm, name: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">휴대폰 번호</label>
                    <input required type="tel" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none" placeholder="010-1234-5678"
                      value={signupForm.phone} onChange={e => setSignupForm({ ...signupForm, phone: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">생년월일 (선택)</label>
                    <input type="date" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none"
                      value={signupForm.birthdate} onChange={e => setSignupForm({ ...signupForm, birthdate: e.target.value })} />
                    <p className="text-xs text-gray-500 mt-1">다음에 다른 기기에서 로그인할 때 사용됩니다</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">나이</label>
                      <input required type="number" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none" placeholder="30"
                        value={signupForm.age} onChange={e => setSignupForm({ ...signupForm, age: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">현재 체중 (kg)</label>
                      <input required type="number" step="0.1" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none" placeholder="60.5"
                        value={signupForm.weight} onChange={e => setSignupForm({ ...signupForm, weight: e.target.value })} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">목표 체중 (kg)</label>
                    <input required type="number" step="0.1" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none" placeholder="55"
                      value={signupForm.target} onChange={e => setSignupForm({ ...signupForm, target: e.target.value })} />
                  </div>

                  <div className="pt-4">
                    <Button type="submit" fullWidth className="bg-brand-600">
                      <UserPlus size={18} /> 가입 신청하기
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          );
        }

        if (patientView === 'pending') {
          return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-white p-6 text-center">
              <div className="w-20 h-20 bg-yellow-50 rounded-full flex items-center justify-center text-yellow-500 mb-6">
                <Clock size={40} />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">승인 대기 중</h2>
              <p className="text-gray-500 max-w-xs mx-auto mb-8">
                관리자가 가입 요청을 확인하고 있습니다.<br />
                승인이 완료되면 앱이 자동으로 활성화됩니다.
              </p>
              <div className="text-xs text-gray-400 bg-gray-50 p-4 rounded-lg max-w-sm">
                팁: 관리자 화면에서 승인 버튼을 누르면<br />즉시 이 화면이 대시보드로 변경됩니다.
              </div>
              <button onClick={() => setPatientView('landing')} className="mt-12 text-gray-400 text-sm underline">
                초기 화면으로 돌아가기
              </button>
            </div>
          );
        }

        if (patientView === 'dashboard' && currentPatient) {
          return (
            <PatientDashboard
              patient={currentPatient}
              onUpdatePatient={handlePatientUpdate}
              onLogout={() => {
                setCurrentPatient(null);
                setPatientView('landing');
              }}
            />
          );
        }

        return null;
      }}
    </Router>
  );
};

export default App;
