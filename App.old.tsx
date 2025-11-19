import React, { useState, useEffect } from 'react';
import { PatientDashboard } from './components/PatientDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { Button } from './components/Button';
import { Patient, UserRole } from './types';
import { Smartphone, Monitor, UserPlus, Clock, Loader2 } from 'lucide-react';
import {
  getDeviceId,
  createPatient,
  getPatientByDeviceId,
  getAllPatients,
  updatePatient,
  subscribeToPatientUpdates
} from './services/supabaseService';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<{ role: UserRole, id?: string } | null>(null);
  const [view, setView] = useState<'landing' | 'signup' | 'pending' | 'app'>('landing');
  const [isLoading, setIsLoading] = useState(true);

  // Signup State
  const [signupForm, setSignupForm] = useState({ name: '', phone: '', age: '', weight: '', target: '' });

  // Patients state from Supabase
  const [patients, setPatients] = useState<Patient[]>([]);

  // Load patient data on mount
  useEffect(() => {
    const loadPatientData = async () => {
      setIsLoading(true);
      const deviceId = getDeviceId();

      // Try to get patient by device ID
      const patient = await getPatientByDeviceId(deviceId);

      if (patient) {
        if (patient.status === 'ACTIVE') {
          setCurrentUser({ role: UserRole.PATIENT, id: patient.id });
          setPatients([patient]);
          setView('app');
        } else if (patient.status === 'PENDING') {
          setView('pending');
        } else if (patient.status === 'REJECTED') {
          localStorage.removeItem('dietcare_device_id');
          setView('landing');
        }
      } else {
        setView('landing');
      }

      setIsLoading(false);
    };

    loadPatientData();
  }, []);

  // Real-time updates subscription for admin
  useEffect(() => {
    if (currentUser?.role === UserRole.ADMIN) {
      const unsubscribe = subscribeToPatientUpdates(() => {
        // Reload patients when changes occur
        loadAllPatients();
      });
      return () => unsubscribe();
    }
  }, [currentUser]);

  const loadAllPatients = async () => {
    const allPatients = await getAllPatients();
    setPatients(allPatients);
  };

  const handlePatientUpdate = async (updatedPatient: Patient) => {
    const success = await updatePatient(updatedPatient.id, updatedPatient);
    if (success) {
      setPatients(prev => prev.map(p => p.id === updatedPatient.id ? updatedPatient : p));

      // If current user is a patient, reload their data
      if (currentUser?.role === UserRole.PATIENT && currentUser.id === updatedPatient.id) {
        const refreshedPatient = await getPatientByDeviceId(getDeviceId());
        if (refreshedPatient) {
          setPatients([refreshedPatient]);
        }
      }
    }
  };

  const handleAdminLogin = async () => {
    setIsLoading(true);
    const allPatients = await getAllPatients();
    setPatients(allPatients);
    setCurrentUser({ role: UserRole.ADMIN });
    setView('app');
    setIsLoading(false);
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const deviceId = getDeviceId();

    const newPatientData: Omit<Patient, 'id' | 'weightLogs' | 'mealLogs'> = {
      deviceId: deviceId,
      status: 'PENDING',
      name: signupForm.name,
      phoneNumber: signupForm.phone,
      joinedAt: new Date().toISOString(),
      age: parseInt(signupForm.age) || 0,
      currentWeight: parseFloat(signupForm.weight) || 0,
      startWeight: parseFloat(signupForm.weight) || 0,
      targetWeight: parseFloat(signupForm.target) || 0,
    };

    const createdPatient = await createPatient(newPatientData);

    if (createdPatient) {
      setView('pending');
    } else {
      alert('가입 신청에 실패했습니다. 다시 시도해주세요.');
    }

    setIsLoading(false);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setPatients([]);
    setView('landing');
  };

  // Show loading screen
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-brand-50 to-white">
        <Loader2 className="animate-spin text-brand-600 mb-4" size={48} />
        <p className="text-gray-600">로딩 중...</p>
      </div>
    );
  }

  // Landing Page
  if (view === 'landing') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-brand-50 to-white p-6">
        <div className="w-full max-w-md space-y-8 text-center">
          <div className="space-y-2">
            <div className="w-16 h-16 bg-brand-600 rounded-2xl flex items-center justify-center text-white text-3xl font-bold mx-auto shadow-lg shadow-brand-200 mb-4">
              D
            </div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">DietCare AI</h1>
            <p className="text-gray-500">다이어트 환자 관리 및 AI 식단 분석 솔루션</p>
          </div>

          <div className="grid grid-cols-1 gap-4 mt-8">
            <button 
              onClick={() => setView('signup')}
              className="group relative flex items-center p-6 bg-white border-2 border-gray-100 rounded-2xl hover:border-brand-500 hover:shadow-lg transition-all text-left"
            >
              <div className="w-12 h-12 bg-brand-100 rounded-full flex items-center justify-center text-brand-600 mr-4 group-hover:scale-110 transition-transform">
                <Smartphone size={24} />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">환자용 시작하기</h3>
                <p className="text-sm text-gray-500">식단 기록을 시작하려면 가입하세요.</p>
              </div>
            </button>

            <button 
              onClick={handleAdminLogin}
              className="group relative flex items-center p-6 bg-white border-2 border-gray-100 rounded-2xl hover:border-brand-500 hover:shadow-lg transition-all text-left"
            >
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 mr-4 group-hover:scale-110 transition-transform">
                <Monitor size={24} />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">관리자 로그인</h3>
                <p className="text-sm text-gray-500">환자 현황 대시보드 (데모용)</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Sign Up Form
  if (view === 'signup') {
    return (
      <div className="min-h-screen flex flex-col bg-white p-6">
         <div className="max-w-md mx-auto w-full">
            <button onClick={() => setView('landing')} className="mb-6 text-gray-500 hover:text-gray-800">
              &larr; 돌아가기
            </button>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">환자 등록 신청</h1>
            <p className="text-gray-500 mb-8 text-sm">관리자의 승인 후 서비스를 이용하실 수 있습니다.</p>

            <form onSubmit={handleSignupSubmit} className="space-y-4">
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">이름</label>
                 <input required type="text" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none" placeholder="홍길동" 
                   value={signupForm.name} onChange={e => setSignupForm({...signupForm, name: e.target.value})} />
               </div>
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">휴대폰 번호</label>
                 <input required type="tel" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none" placeholder="010-1234-5678" 
                   value={signupForm.phone} onChange={e => setSignupForm({...signupForm, phone: e.target.value})} />
               </div>
               <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">나이</label>
                    <input required type="number" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none" placeholder="30" 
                      value={signupForm.age} onChange={e => setSignupForm({...signupForm, age: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">현재 체중 (kg)</label>
                    <input required type="number" step="0.1" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none" placeholder="60.5" 
                      value={signupForm.weight} onChange={e => setSignupForm({...signupForm, weight: e.target.value})} />
                  </div>
               </div>
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">목표 체중 (kg)</label>
                 <input required type="number" step="0.1" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none" placeholder="55" 
                   value={signupForm.target} onChange={e => setSignupForm({...signupForm, target: e.target.value})} />
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

  // Pending Screen
  if (view === 'pending') {
     return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-white p-6 text-center">
           <div className="w-20 h-20 bg-yellow-50 rounded-full flex items-center justify-center text-yellow-500 mb-6">
              <Clock size={40} />
           </div>
           <h2 className="text-2xl font-bold text-gray-900 mb-2">승인 대기 중</h2>
           <p className="text-gray-500 max-w-xs mx-auto mb-8">
              관리자가 가입 요청을 확인하고 있습니다.<br/>
              승인이 완료되면 앱이 자동으로 활성화됩니다.
           </p>
           <div className="text-xs text-gray-400 bg-gray-50 p-4 rounded-lg max-w-sm">
              팁: 관리자 화면에서 승인 버튼을 누르면<br/>즉시 이 화면이 대시보드로 변경됩니다.
           </div>
           <button onClick={() => setView('landing')} className="mt-12 text-gray-400 text-sm underline">
              초기 화면으로 돌아가기
           </button>
        </div>
     );
  }

  // Authenticated Views
  const activePatient = patients.find(p => p.id === currentUser?.id);

  if (currentUser?.role === UserRole.PATIENT && activePatient) {
    return (
      <PatientDashboard 
        patient={activePatient} 
        onUpdatePatient={handlePatientUpdate}
        onLogout={handleLogout}
      />
    );
  }

  if (currentUser?.role === UserRole.ADMIN) {
    return (
      <AdminDashboard 
        patients={patients}
        onUpdatePatient={handlePatientUpdate}
        onLogout={handleLogout}
      />
    );
  }

  return null;
};

export default App;