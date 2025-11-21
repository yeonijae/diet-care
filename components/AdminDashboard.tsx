import React, { useState } from 'react';
import { Patient } from '../types';
import { Button } from './Button';
import { Users, Search, Calendar, ChevronRight, ArrowLeft, PieChart, Activity, LayoutGrid, List, ChevronLeft, UserPlus, Check, X, Trash2 } from 'lucide-react';
import { deletePatient } from '../services/supabaseService';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';

interface AdminDashboardProps {
  patients: Patient[];
  onUpdatePatient: (updatedPatient: Patient) => void; // Add update handler
  onLogout: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ patients, onUpdatePatient, onLogout }) => {
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [mealViewMode, setMealViewMode] = useState<'list' | 'calendar'>('list');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [tab, setTab] = useState<'active' | 'pending'>('active');

  const selectedPatient = patients.find(p => p.id === selectedPatientId);

  const pendingPatients = patients.filter(p => p.status === 'PENDING');
  const activePatients = patients.filter(p => p.status === 'ACTIVE');

  const displayedPatients = tab === 'active' ? activePatients : pendingPatients;
  
  const filteredPatients = displayedPatients.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.phoneNumber.includes(searchTerm)
  );

  // Calendar Logic for Admin
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const days = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    return { days, firstDay, year, month };
  };

  const changeMonth = (delta: number) => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + delta, 1));
  };

  const { days, firstDay, year, month } = getDaysInMonth(currentMonth);

  const handleApprove = async (patient: Patient) => {
    if (window.confirm(`${patient.name}님의 가입을 승인하시겠습니까?`)) {
      await onUpdatePatient({ ...patient, status: 'ACTIVE' });
      // Refresh the patient list after approval
      window.location.reload();
    }
  };

  const handleReject = async (patient: Patient) => {
    if (window.confirm(`${patient.name}님의 가입 요청을 거절(삭제)하시겠습니까?`)) {
      await onUpdatePatient({ ...patient, status: 'REJECTED' });
      // Refresh the patient list after rejection
      window.location.reload();
    }
  };

  const handleDeletePatient = async (patient: Patient) => {
    if (window.confirm(`정말로 ${patient.name}님을 삭제하시겠습니까?\n\n⚠️ 모든 체중 기록과 식단 기록이 함께 삭제됩니다.\n이 작업은 되돌릴 수 없습니다.`)) {
      const success = await deletePatient(patient.id);
      if (success) {
        alert('환자가 삭제되었습니다.');
        window.location.reload();
      } else {
        alert('삭제에 실패했습니다.');
      }
    }
  };

  return (
    <div className="h-full flex bg-gray-100 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col hidden md:flex">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-2 text-brand-600">
            <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">연</div>
            <span className="text-lg font-bold tracking-tight">연이재한의원</span>
          </div>
        </div>
        
        <div className="p-4">
          {/* Tab Switcher */}
          <div className="flex bg-gray-100 p-1 rounded-xl mb-4">
            <button
              onClick={() => { setTab('active'); setSelectedPatientId(null); }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${tab === 'active' ? 'bg-white text-brand-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              관리중 ({activePatients.length})
            </button>
            <button
              onClick={() => { setTab('pending'); setSelectedPatientId(null); }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all relative ${tab === 'pending' ? 'bg-white text-brand-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              가입요청 ({pendingPatients.length})
              {pendingPatients.length > 0 && <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />}
            </button>
          </div>

          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder={tab === 'active' ? "환자 검색..." : "요청자 검색..."}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="space-y-1 overflow-y-auto max-h-[calc(100vh-250px)]">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-2">
              {tab === 'active' ? '환자 목록' : '가입 대기 목록'}
            </h3>
            {filteredPatients.length === 0 && (
              <div className="text-center py-4 text-gray-400 text-xs">검색 결과가 없습니다.</div>
            )}
            {filteredPatients.map(patient => (
              <button
                key={patient.id}
                onClick={() => {
                  setSelectedPatientId(patient.id);
                  setMealViewMode('list'); 
                }}
                className={`w-full text-left px-3 py-2 rounded-lg flex items-center justify-between text-sm transition-colors ${
                  selectedPatientId === patient.id 
                    ? 'bg-brand-50 text-brand-700 font-medium' 
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${patient.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-200 text-gray-500'}`}>
                    {patient.name[0]}
                  </div>
                  <div>
                    <div className="leading-none mb-1">{patient.name}</div>
                    <div className="text-[10px] text-gray-400">{patient.phoneNumber}</div>
                  </div>
                </div>
                {selectedPatientId === patient.id && <ChevronRight size={16} />}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-auto p-4 border-t border-gray-200">
          <Button variant="ghost" fullWidth onClick={onLogout}>로그아웃</Button>
        </div>
      </aside>

      {/* Mobile Header (only visible on small screens) */}
      <div className="md:hidden fixed inset-x-0 top-0 bg-white z-20 p-4 border-b flex justify-between items-center">
         <span className="font-bold text-brand-600">연이재한의원 관리자</span>
         <Button variant="ghost" onClick={onLogout} className="!p-2 text-xs">로그아웃</Button>
      </div>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative pt-14 md:pt-0">
        {!selectedPatient ? (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-8 text-center">
            {tab === 'active' ? (
              <>
                <Users size={48} className="mb-4 opacity-20" />
                <h2 className="text-xl font-semibold text-gray-600">환자를 선택해주세요</h2>
                <p className="max-w-md mt-2 text-sm">좌측 목록에서 환자를 선택하여 상세 정보를 확인하세요.</p>
              </>
            ) : (
              <>
                 <UserPlus size={48} className="mb-4 opacity-20" />
                 <h2 className="text-xl font-semibold text-gray-600">가입 요청 관리</h2>
                 <p className="max-w-md mt-2 text-sm">가입을 요청한 환자들의 목록입니다. <br/>좌측에서 선택하여 승인 처리해주세요.</p>
              </>
            )}
            
             {/* Mobile view list fallback */}
            <div className="md:hidden mt-8 w-full max-w-sm text-left">
               <div className="flex gap-2 mb-4">
                 <button onClick={() => setTab('active')} className={`flex-1 py-2 text-sm font-bold rounded-lg border ${tab === 'active' ? 'bg-brand-50 border-brand-200 text-brand-600' : 'bg-white border-gray-200'}`}>관리중</button>
                 <button onClick={() => setTab('pending')} className={`flex-1 py-2 text-sm font-bold rounded-lg border ${tab === 'pending' ? 'bg-brand-50 border-brand-200 text-brand-600' : 'bg-white border-gray-200'}`}>가입요청 ({pendingPatients.length})</button>
               </div>
               <div className="bg-white rounded-lg shadow divide-y">
                  {filteredPatients.map(p => (
                     <div key={p.id} onClick={() => setSelectedPatientId(p.id)} className="p-4 flex justify-between items-center active:bg-gray-50">
                        <div>
                          <div className="font-bold">{p.name}</div>
                          <div className="text-xs text-gray-500">{p.phoneNumber}</div>
                        </div>
                        <ChevronRight size={16} className="text-gray-400" />
                     </div>
                  ))}
               </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8">
            {/* Pending Approval View */}
            {selectedPatient.status === 'PENDING' ? (
               <div className="max-w-2xl mx-auto bg-white p-8 rounded-2xl shadow-sm border border-gray-200 text-center">
                  <div className="w-20 h-20 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center mx-auto mb-6">
                     <UserPlus size={40} />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">{selectedPatient.name}</h2>
                  <p className="text-gray-500 mb-8">{selectedPatient.phoneNumber}</p>
                  
                  <div className="grid grid-cols-2 gap-4 text-left bg-gray-50 p-6 rounded-xl mb-8">
                     <div>
                        <span className="text-xs text-gray-400 block mb-1">나이</span>
                        <span className="font-medium">{selectedPatient.age}세</span>
                     </div>
                     <div>
                        <span className="text-xs text-gray-400 block mb-1">가입 요청일</span>
                        <span className="font-medium">{new Date(selectedPatient.joinedAt).toLocaleDateString()}</span>
                     </div>
                     <div>
                        <span className="text-xs text-gray-400 block mb-1">현재 체중</span>
                        <span className="font-medium">{selectedPatient.currentWeight}kg</span>
                     </div>
                     <div>
                        <span className="text-xs text-gray-400 block mb-1">목표 체중</span>
                        <span className="font-medium">{selectedPatient.targetWeight}kg</span>
                     </div>
                  </div>

                  <div className="flex gap-3">
                     <Button variant="danger" fullWidth onClick={() => handleReject(selectedPatient)}>
                        <X size={18} /> 거절하기
                     </Button>
                     <Button variant="primary" fullWidth onClick={() => handleApprove(selectedPatient)}>
                        <Check size={18} /> 승인하기
                     </Button>
                  </div>
               </div>
            ) : (
            // Active Patient Detail View
            <>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <button className="md:hidden" onClick={() => setSelectedPatientId(null)}>
                  <ArrowLeft size={20} />
                </button>
                <div>
                   <h1 className="text-2xl font-bold text-gray-900">{selectedPatient.name}</h1>
                   <p className="text-sm text-gray-500">
                      나이: {selectedPatient.age}세 | {selectedPatient.phoneNumber}
                   </p>
                </div>
                <button
                  onClick={() => handleDeletePatient(selectedPatient)}
                  className="ml-2 p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  title="환자 삭제"
                >
                  <Trash2 size={20} />
                </button>
              </div>
              <div className="flex gap-4">
                <div className="bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-200 text-center">
                   <span className="text-xs text-gray-500 block">시작 체중</span>
                   <span className="font-semibold text-gray-700">{selectedPatient.startWeight} kg</span>
                </div>
                <div className="bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-200 text-center">
                   <span className="text-xs text-gray-500 block">현재 체중</span>
                   <span className={`font-bold ${selectedPatient.currentWeight < selectedPatient.startWeight ? 'text-green-600' : 'text-red-600'}`}>
                      {selectedPatient.currentWeight} kg
                   </span>
                </div>
              </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
               {/* Weight Chart */}
               <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 lg:col-span-2">
                 <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <Activity size={18} className="text-brand-600" />
                    체중 변화 추이
                 </h3>
                 <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                       <LineChart data={selectedPatient.weightLogs}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                          <XAxis 
                            dataKey="date" 
                            tickFormatter={(val) => val.slice(5)} 
                            stroke="#9ca3af"
                            fontSize={12}
                            tickMargin={10}
                          />
                          <YAxis domain={['auto', 'auto']} stroke="#9ca3af" fontSize={12} />
                          <Tooltip 
                             contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                          />
                          <Legend />
                          <Line 
                            name="체중"
                            type="monotone" 
                            dataKey="weight" 
                            stroke="#16a34a" 
                            strokeWidth={3} 
                            dot={{ r: 4, fill: '#16a34a', strokeWidth: 2, stroke: '#fff' }} 
                            activeDot={{ r: 6 }}
                          />
                       </LineChart>
                    </ResponsiveContainer>
                 </div>
               </div>

               {/* Quick Stats */}
               <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                 <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <PieChart size={18} className="text-brand-600" />
                    요약
                 </h3>
                 <div className="space-y-4">
                    <div className="flex justify-between items-center pb-3 border-b border-gray-50">
                       <span className="text-gray-600 text-sm">총 감량</span>
                       <span className="font-bold text-lg">{(selectedPatient.startWeight - selectedPatient.currentWeight).toFixed(1)} kg</span>
                    </div>
                    <div className="flex justify-between items-center pb-3 border-b border-gray-50">
                       <span className="text-gray-600 text-sm">목표 체중</span>
                       <span className="font-bold text-lg">{selectedPatient.targetWeight} kg</span>
                    </div>
                    <div className="flex justify-between items-center pb-3 border-b border-gray-50">
                       <span className="text-gray-600 text-sm">남은 목표</span>
                       <span className="font-bold text-lg">{(selectedPatient.currentWeight - selectedPatient.targetWeight).toFixed(1)} kg</span>
                    </div>
                 </div>
               </div>
            </div>

            {/* Meal Gallery / Calendar */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
               <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                 <h3 className="font-bold text-gray-800 flex items-center gap-2">
                    <Calendar size={18} className="text-brand-600" />
                    식단 기록
                 </h3>
                 <div className="flex bg-gray-100 p-1 rounded-lg self-end sm:self-auto">
                    <button 
                        onClick={() => setMealViewMode('list')}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${mealViewMode === 'list' ? 'bg-white shadow text-brand-600' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <List size={14} /> 목록
                    </button>
                    <button 
                         onClick={() => setMealViewMode('calendar')}
                         className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${mealViewMode === 'calendar' ? 'bg-white shadow text-brand-600' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <LayoutGrid size={14} /> 월간
                    </button>
                 </div>
               </div>
               
               {mealViewMode === 'list' ? (
                 selectedPatient.mealLogs.length === 0 ? (
                    <div className="text-center py-12 text-gray-400 bg-gray-50 rounded-lg border border-dashed">
                       아직 기록된 식단이 없습니다.
                    </div>
                 ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                       {selectedPatient.mealLogs.map(meal => (
                          <div key={meal.id} className="border border-gray-100 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                             <div className="relative h-48 bg-gray-100">
                                <img src={meal.imageUrl} alt={meal.foodName} className="w-full h-full object-cover" />
                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                                   <span className="text-white font-bold">{meal.foodName}</span>
                                </div>
                             </div>
                             <div className="p-4">
                                <div className="flex justify-between items-center mb-2">
                                   <span className="text-xs text-gray-500">{new Date(meal.date).toLocaleString()}</span>
                                   <span className="text-sm font-semibold text-brand-600">{meal.calories} kcal</span>
                                </div>
                                <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded-md">{meal.analysis}</p>
                             </div>
                          </div>
                       ))}
                    </div>
                 )
               ) : (
                 <div className="animate-in fade-in duration-200">
                    {/* Calendar View */}
                    <div className="flex justify-center items-center gap-4 mb-6">
                        <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-gray-100 rounded-full"><ChevronLeft size={20} /></button>
                        <h3 className="text-xl font-bold text-gray-800">{year}년 {month + 1}월</h3>
                        <button onClick={() => changeMonth(1)} className="p-2 hover:bg-gray-100 rounded-full"><ChevronRight size={20} /></button>
                    </div>
                    
                    <div className="grid grid-cols-7 border-b border-gray-200">
                      {['일', '월', '화', '수', '목', '금', '토'].map((day, i) => (
                        <div key={day} className={`text-center py-2 text-sm font-bold ${i === 0 ? 'text-red-500' : 'text-gray-600'}`}>
                          {day}
                        </div>
                      ))}
                    </div>
                    
                    <div className="grid grid-cols-7 auto-rows-fr border-l border-gray-200">
                      {Array.from({ length: firstDay }).map((_, i) => (
                        <div key={`empty-${i}`} className="bg-gray-50 border-b border-r border-gray-200 h-32 lg:h-40" />
                      ))}
                      
                      {Array.from({ length: days }).map((_, i) => {
                        const day = i + 1;
                        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                        const dailyMeals = selectedPatient.mealLogs.filter(log => {
                           const logDate = log.date.includes('T') ? log.date.split('T')[0] : log.date;
                           return logDate === dateStr;
                        });
                        const dailyTotalCalories = dailyMeals.reduce((sum, log) => sum + log.calories, 0);
                        
                        return (
                          <div key={day} className="border-b border-r border-gray-200 h-32 lg:h-40 p-1 lg:p-2 overflow-hidden hover:bg-gray-50 transition-colors relative group">
                             <div className="flex justify-between items-start mb-1">
                                <span className={`inline-block w-6 h-6 text-center leading-6 rounded-full text-sm ${new Date().toISOString().split('T')[0] === dateStr ? 'bg-brand-600 text-white font-bold' : 'text-gray-700'}`}>
                                  {day}
                                </span>
                                {dailyTotalCalories > 0 && (
                                   <span className="text-xs font-bold text-brand-600 bg-brand-50 px-1.5 py-0.5 rounded-full">
                                      {dailyTotalCalories} kcal
                                   </span>
                                )}
                             </div>
                             
                             <div className="grid grid-cols-2 gap-1 h-[calc(100%-28px)] overflow-hidden content-start">
                               {dailyMeals.map(meal => (
                                 <div key={meal.id} className="relative aspect-square rounded-md overflow-hidden border border-gray-100 group/meal">
                                   <img src={meal.imageUrl} alt={meal.foodName} className="w-full h-full object-cover" />
                                   <div className="absolute inset-0 bg-black/0 group-hover/meal:bg-black/20 transition-colors flex items-center justify-center">
                                      <span className="text-[10px] text-white bg-black/60 px-1 rounded opacity-0 group-hover/meal:opacity-100 truncate max-w-[90%]">{meal.calories}</span>
                                   </div>
                                 </div>
                               ))}
                             </div>
                          </div>
                        );
                      })}
                    </div>
                 </div>
               )}
            </div>
            </>
            )}
          </div>
        )}
      </main>
    </div>
  );
};