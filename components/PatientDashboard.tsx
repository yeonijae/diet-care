import React, { useState, useRef } from 'react';
import { Patient, MealLog } from '../types';
import { Button } from './Button';
import { analyzeFoodImage, analyzeFoodText, compressImage, estimateCalories } from '../services/geminiService';
import { addWeightLog, addMealLog, uploadMealImage, updateMealLog, deleteMealLog } from '../services/supabaseService';
import { extractPhotoTimestamp } from '../services/exifService';
import { Camera, Plus, TrendingDown, TrendingUp, Utensils, Activity, Loader2, ChevronLeft, ChevronRight, FileText, Image, Search, Trash2 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface PatientDashboardProps {
  patient: Patient;
  onUpdatePatient: (updatedPatient: Patient) => void;
  onLogout: () => void;
}

export const PatientDashboard: React.FC<PatientDashboardProps> = ({ patient, onUpdatePatient, onLogout }) => {
  const [activeTab, setActiveTab] = useState<'home' | 'log'>('home');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [newWeight, setNewWeight] = useState('');
  
  // Input Mode State
  const [inputMode, setInputMode] = useState<'camera' | 'text'>('camera');
  const [textInput, setTextInput] = useState('');

  // Manual Input State (when AI analysis fails)
  const [showManualInput, setShowManualInput] = useState(false);
  const [pendingImageData, setPendingImageData] = useState<{
    imageUrl: string;
    photoTimestamp: string;
    uploadedAt: string;
  } | null>(null);
  const [manualFoodName, setManualFoodName] = useState('');
  const [manualMemo, setManualMemo] = useState('');

  // Edit Meal State (for editing existing meals)
  const [showEditMeal, setShowEditMeal] = useState(false);
  const [editingMeal, setEditingMeal] = useState<MealLog | null>(null);
  const [editFoodName, setEditFoodName] = useState('');
  const [editCalories, setEditCalories] = useState('');
  const [editMealTime, setEditMealTime] = useState('');
  const [isEstimatingCalories, setIsEstimatingCalories] = useState(false);

  // Calendar State
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const handleWeightSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWeight) return;

    const weight = parseFloat(newWeight);
    const newLogData = {
      date: new Date().toISOString().split('T')[0],
      weight
    };

    const savedLog = await addWeightLog(patient.id, newLogData);

    if (savedLog) {
      const updatedPatient = {
        ...patient,
        currentWeight: weight,
        weightLogs: [...patient.weightLogs, savedLog]
      };

      onUpdatePatient(updatedPatient);
      setNewWeight('');
      alert('체중이 기록되었습니다!');
    } else {
      alert('체중 기록에 실패했습니다.');
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsAnalyzing(true);
    try {
      // Extract photo capture time from EXIF data (before compression)
      const photoTimestamp = await extractPhotoTimestamp(file);
      const uploadedAt = new Date().toISOString();

      // Compress image first (reduces size by ~70-90%)
      const compressedBase64 = await compressImage(file);

      // Upload compressed image to Supabase Storage
      const imageUrl = await uploadMealImage(compressedBase64, patient.id);
      if (!imageUrl) {
        throw new Error('Image upload failed');
      }

      // Try AI analysis
      let analysis;
      try {
        analysis = await analyzeFoodImage(compressedBase64);
      } catch (aiError) {
        console.error('AI analysis failed:', aiError);
        // Show manual input modal
        setIsAnalyzing(false);
        setPendingImageData({ imageUrl, photoTimestamp, uploadedAt });
        setManualFoodName('');
        setManualMemo('');
        setShowManualInput(true);
        return;
      }

      const newMealData = {
        date: photoTimestamp, // Photo capture time from EXIF or current time
        uploadedAt: uploadedAt, // When the photo was uploaded
        imageUrl: imageUrl, // Use Supabase Storage URL (compressed)
        foodName: analysis.foodName,
        calories: analysis.calories,
        analysis: analysis.analysis
      };

      const savedMeal = await addMealLog(patient.id, newMealData);

      if (savedMeal) {
        const updatedPatient = {
          ...patient,
          mealLogs: [savedMeal, ...patient.mealLogs]
        };
        onUpdatePatient(updatedPatient);

        // Switch to log tab and select the date of the photo
        setActiveTab('log');
        const photoDate = photoTimestamp.split('T')[0];
        setSelectedDate(photoDate);
        // Also change calendar month to show the photo date
        setCurrentMonth(new Date(photoDate));
      } else {
        throw new Error('Meal log save failed');
      }

      setIsAnalyzing(false);
    } catch (error) {
      console.error(error);
      setIsAnalyzing(false);
      alert('이미지 업로드에 실패했습니다.');
    }
  };

  // Handle manual input submission when AI fails
  const handleManualSubmit = async () => {
    if (!pendingImageData || !manualFoodName.trim()) {
      alert('음식 이름을 입력해주세요.');
      return;
    }

    setIsAnalyzing(true);
    try {
      const newMealData = {
        date: pendingImageData.photoTimestamp,
        uploadedAt: pendingImageData.uploadedAt,
        imageUrl: pendingImageData.imageUrl,
        foodName: manualFoodName.trim(),
        calories: 0, // Unknown calories
        analysis: manualMemo.trim() || '(직접 입력)'
      };

      const savedMeal = await addMealLog(patient.id, newMealData);

      if (savedMeal) {
        const updatedPatient = {
          ...patient,
          mealLogs: [savedMeal, ...patient.mealLogs]
        };
        onUpdatePatient(updatedPatient);

        // Switch to log tab and select the date of the photo
        setActiveTab('log');
        const photoDate = pendingImageData.photoTimestamp.split('T')[0];
        setSelectedDate(photoDate);
        setCurrentMonth(new Date(photoDate));
      }

      // Reset manual input state
      setShowManualInput(false);
      setPendingImageData(null);
      setManualFoodName('');
      setManualMemo('');
      setIsAnalyzing(false);
    } catch (error) {
      console.error(error);
      setIsAnalyzing(false);
      alert('저장에 실패했습니다.');
    }
  };

  // Cancel manual input
  const handleManualCancel = () => {
    setShowManualInput(false);
    setPendingImageData(null);
    setManualFoodName('');
    setManualMemo('');
  };

  // Open edit modal for a meal (especially for failed analysis meals)
  const handleMealClick = (meal: MealLog) => {
    setEditingMeal(meal);
    setEditFoodName(meal.foodName);
    setEditCalories(meal.calories.toString());
    // Extract time from date (HH:MM format)
    const mealDate = new Date(meal.date);
    const hours = String(mealDate.getHours()).padStart(2, '0');
    const minutes = String(mealDate.getMinutes()).padStart(2, '0');
    setEditMealTime(`${hours}:${minutes}`);
    setShowEditMeal(true);
  };

  // Save edited meal
  const handleEditSave = async () => {
    if (!editingMeal || !editFoodName.trim()) {
      alert('음식 이름을 입력해주세요.');
      return;
    }

    setIsAnalyzing(true);
    try {
      // Parse the new date/time
      const originalDate = new Date(editingMeal.date);
      const [hours, minutes] = editMealTime.split(':').map(Number);
      const newDate = new Date(originalDate);
      newDate.setHours(hours, minutes, 0, 0);

      const updates = {
        date: newDate.toISOString(),
        foodName: editFoodName.trim(),
        calories: parseInt(editCalories) || 0,
        analysis: editingMeal.analysis === '(직접 입력)' ? '(수정됨)' : editingMeal.analysis
      };

      const updatedMeal = await updateMealLog(editingMeal.id, updates);

      if (updatedMeal) {
        // Update local state
        const updatedMealLogs = patient.mealLogs.map(m =>
          m.id === editingMeal.id ? updatedMeal : m
        );
        onUpdatePatient({ ...patient, mealLogs: updatedMealLogs });
      }

      setShowEditMeal(false);
      setEditingMeal(null);
      setIsAnalyzing(false);
    } catch (error) {
      console.error(error);
      setIsAnalyzing(false);
      alert('저장에 실패했습니다.');
    }
  };

  // Cancel edit
  const handleEditCancel = () => {
    setShowEditMeal(false);
    setEditingMeal(null);
  };

  // Estimate calories from food name using AI
  const handleEstimateCalories = async () => {
    if (!editFoodName.trim()) {
      alert('음식 이름을 먼저 입력해주세요.');
      return;
    }

    setIsEstimatingCalories(true);
    try {
      const calories = await estimateCalories(editFoodName.trim());
      if (calories > 0) {
        setEditCalories(calories.toString());
      } else {
        alert('칼로리를 추정할 수 없습니다. 직접 입력해주세요.');
      }
    } catch (error) {
      console.error('Error estimating calories:', error);
      alert('칼로리 추정에 실패했습니다.');
    }
    setIsEstimatingCalories(false);
  };

  // Delete meal
  const handleDeleteMeal = async () => {
    if (!editingMeal) return;

    const confirmed = window.confirm('이 식단 기록을 삭제하시겠습니까?');
    if (!confirmed) return;

    setIsAnalyzing(true);
    try {
      const success = await deleteMealLog(editingMeal.id);

      if (success) {
        // Remove from local state
        const updatedMealLogs = patient.mealLogs.filter(m => m.id !== editingMeal.id);
        onUpdatePatient({ ...patient, mealLogs: updatedMealLogs });
        setShowEditMeal(false);
        setEditingMeal(null);
      } else {
        alert('삭제에 실패했습니다.');
      }
    } catch (error) {
      console.error(error);
      alert('삭제에 실패했습니다.');
    }
    setIsAnalyzing(false);
  };

  const handleTextSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim()) return;

    setIsAnalyzing(true);
    try {
      const analysis = await analyzeFoodText(textInput);

      const newMealData = {
        date: new Date().toISOString(),
        imageUrl: 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?q=80&w=400&auto=format&fit=crop',
        foodName: analysis.foodName,
        calories: analysis.calories,
        analysis: analysis.analysis
      };

      const savedMeal = await addMealLog(patient.id, newMealData);

      if (savedMeal) {
        const updatedPatient = {
          ...patient,
          mealLogs: [savedMeal, ...patient.mealLogs]
        };
        onUpdatePatient(updatedPatient);
        setTextInput('');

        // Switch to log tab and select today
        setActiveTab('log');
        setSelectedDate(new Date().toISOString().split('T')[0]);
      } else {
        throw new Error('Meal log save failed');
      }

      setIsAnalyzing(false);
    } catch (error) {
      console.error(error);
      setIsAnalyzing(false);
      alert('텍스트 분석에 실패했습니다.');
    }
  };

  const weightDiff = patient.currentWeight - patient.startWeight;

  // Calendar Logic
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const days = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    return { days, firstDay, year, month };
  };

  const { days, firstDay, year, month } = getDaysInMonth(currentMonth);

  const changeMonth = (delta: number) => {
    setCurrentMonth(new Date(year, month + delta, 1));
  };

  const filteredLogs = patient.mealLogs.filter(log => {
    // Handle potentially different date formats (ISO vs YYYY-MM-DD)
    const logDate = log.date.includes('T') ? log.date.split('T')[0] : log.date;
    return logDate === selectedDate;
  });

  // Calculate daily summary for the selected date
  const dailyTotalCalories = filteredLogs.reduce((sum, log) => sum + log.calories, 0);

  return (
    <div className="h-full flex flex-col bg-gray-50 max-w-md mx-auto shadow-2xl overflow-hidden relative">
      {/* Header */}
      <header className="bg-white px-6 py-4 border-b flex justify-between items-center sticky top-0 z-10">
        <div>
          <h1 className="text-xl font-bold text-gray-800">안녕하세요, {patient.name}님</h1>
          <p className="text-xs text-gray-500">오늘도 건강한 하루 되세요!</p>
        </div>
        <Button variant="ghost" onClick={onLogout} className="!px-2 !py-1 text-xs">로그아웃</Button>
      </header>

      {/* Content Scroll Area */}
      <main className="flex-1 overflow-y-auto pb-24 no-scrollbar bg-gray-50">
        
        {activeTab === 'home' && (
          <div className="p-4 space-y-6">
            {/* Weight Card */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex justify-between items-end mb-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">현재 체중</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold text-gray-900">{patient.currentWeight}</span>
                    <span className="text-gray-500">kg</span>
                  </div>
                </div>
                <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${weightDiff <= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {weightDiff <= 0 ? <TrendingDown size={16} /> : <TrendingUp size={16} />}
                  {Math.abs(weightDiff).toFixed(1)}kg
                </div>
              </div>
              
              <div className="h-32 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={patient.weightLogs.slice(-7)}>
                    <XAxis dataKey="date" hide />
                    <YAxis domain={['dataMin - 1', 'dataMax + 1']} hide />
                    <Tooltip 
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      formatter={(value: number) => [`${value}kg`]}
                      labelStyle={{ display: 'none' }}
                    />
                    <Line type="monotone" dataKey="weight" stroke="#16a34a" strokeWidth={3} dot={{ r: 4, fill: '#16a34a' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <form onSubmit={handleWeightSubmit} className="mt-4 flex gap-2">
                <input 
                  type="number" 
                  step="0.1" 
                  placeholder="체중 입력 (kg)" 
                  className="flex-1 px-4 py-2 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  value={newWeight}
                  onChange={(e) => setNewWeight(e.target.value)}
                />
                <Button type="submit" className="!py-2">기록</Button>
              </form>
            </div>

            {/* Meal Recording Section (Tabbed) */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="flex border-b border-gray-100">
                <button
                  onClick={() => setInputMode('camera')}
                  className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                    inputMode === 'camera' ? 'text-brand-600 bg-brand-50/50' : 'text-gray-400 hover:bg-gray-50'
                  }`}
                >
                  <Camera size={18} />
                  사진으로 기록
                </button>
                <div className="w-px bg-gray-100" />
                <button
                  onClick={() => setInputMode('text')}
                  className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                    inputMode === 'text' ? 'text-brand-600 bg-brand-50/50' : 'text-gray-400 hover:bg-gray-50'
                  }`}
                >
                  <FileText size={18} />
                  글로 기록
                </button>
              </div>

              <div className="p-5">
                {inputMode === 'camera' ? (
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-6">
                      음식 사진을 촬영하거나 앨범에서 선택하면<br/>AI가 자동으로 영양소를 분석합니다.
                    </p>

                    {/* Camera Input */}
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      ref={cameraInputRef}
                      onChange={handleImageUpload}
                    />

                    {/* Gallery Input */}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      ref={galleryInputRef}
                      onChange={handleImageUpload}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      {/* Camera Button */}
                      <button
                        onClick={() => cameraInputRef.current?.click()}
                        disabled={isAnalyzing}
                        className="flex flex-col items-center justify-center p-6 bg-gradient-to-br from-brand-600 to-brand-500 hover:from-brand-700 hover:to-brand-600 rounded-2xl shadow-lg shadow-brand-200 text-white transition-all hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
                      >
                        <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-3">
                          <Camera size={32} />
                        </div>
                        <span className="text-sm font-semibold">카메라</span>
                      </button>

                      {/* Gallery Button */}
                      <button
                        onClick={() => galleryInputRef.current?.click()}
                        disabled={isAnalyzing}
                        className="flex flex-col items-center justify-center p-6 bg-gradient-to-br from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 rounded-2xl shadow-lg shadow-purple-200 text-white transition-all hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
                      >
                        <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-3">
                          <Image size={32} />
                        </div>
                        <span className="text-sm font-semibold">앨범</span>
                      </button>
                    </div>

                    {isAnalyzing && (
                      <div className="mt-4 flex items-center justify-center text-brand-600">
                        <Loader2 className="animate-spin mr-2" size={20} />
                        <span className="text-sm font-medium">분석중...</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <form onSubmit={handleTextSubmit}>
                    <textarea
                      className="w-full p-4 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm min-h-[120px] mb-4 resize-none placeholder-gray-400"
                      placeholder="예: 닭가슴살 150g, 현미밥 1공기, 아몬드 5알&#13;&#10;자세히 적을수록 정확도가 올라갑니다."
                      value={textInput}
                      onChange={(e) => setTextInput(e.target.value)}
                    />
                    <Button
                      type="submit"
                      disabled={isAnalyzing || !textInput.trim()}
                      fullWidth
                      className="bg-brand-600"
                    >
                      {isAnalyzing ? (
                        <><Loader2 className="animate-spin" /> 분석중...</>
                      ) : (
                        <>분석 및 기록하기</>
                      )}
                    </Button>
                  </form>
                )}
              </div>
            </div>

            {/* Recent Meals (Home Preview) */}
            <div>
              <div className="flex justify-between items-end mb-3 px-1">
                <h3 className="font-bold text-gray-800">최근 식단</h3>
                <button onClick={() => setActiveTab('log')} className="text-xs text-brand-600 font-medium">전체보기</button>
              </div>
              <div className="space-y-3">
                {patient.mealLogs.length === 0 ? (
                  <div className="text-center py-8 text-gray-400 bg-white rounded-xl border border-dashed">
                    기록된 식단이 없습니다.
                  </div>
                ) : (
                  patient.mealLogs.slice(0, 3).map((meal) => (
                    <div key={meal.id} className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 flex gap-3">
                      <img src={meal.imageUrl} alt={meal.foodName} className="w-20 h-20 rounded-lg object-cover flex-shrink-0 bg-gray-200" />
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <h4 className="font-bold text-gray-900 truncate">{meal.foodName}</h4>
                          <span className="text-xs font-medium bg-gray-100 px-2 py-1 rounded-md text-gray-600">
                            {meal.calories} kcal
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">{meal.analysis}</p>
                        <p className="text-xs text-gray-400 mt-2">
                          {new Date(meal.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'log' && (
          <div className="flex flex-col min-h-full">
            <div className="bg-white p-4 pb-6 shadow-sm border-b border-gray-100 sticky top-0 z-0">
              {/* Calendar Header */}
              <div className="flex justify-between items-center mb-6">
                <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <ChevronLeft size={20} className="text-gray-600" />
                </button>
                <h2 className="text-lg font-bold text-gray-900">
                  {year}년 {month + 1}월
                </h2>
                <button onClick={() => changeMonth(1)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <ChevronRight size={20} className="text-gray-600" />
                </button>
              </div>

              {/* Days Grid */}
              <div>
                <div className="grid grid-cols-7 text-center mb-2">
                  {['일', '월', '화', '수', '목', '금', '토'].map(d => (
                    <div key={d} className="text-xs font-medium text-gray-400">{d}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-y-4 gap-x-1">
                  {Array.from({ length: firstDay }).map((_, i) => (
                    <div key={`empty-${i}`} />
                  ))}
                  {Array.from({ length: days }).map((_, i) => {
                    const day = i + 1;
                    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                    // Filter meals for this specific day to calculate total calories
                    const dayMeals = patient.mealLogs.filter(log => {
                       const logDate = log.date.includes('T') ? log.date.split('T')[0] : log.date;
                       return logDate === dateStr;
                    });
                    const totalCalories = dayMeals.reduce((sum, meal) => sum + meal.calories, 0);
                    
                    const isSelected = dateStr === selectedDate;
                    const isToday = dateStr === new Date().toISOString().split('T')[0];

                    return (
                      <div key={day} className="flex flex-col items-center">
                        <button
                          onClick={() => setSelectedDate(dateStr)}
                          className={`
                            w-9 h-9 rounded-full flex items-center justify-center text-sm transition-all relative
                            ${isSelected ? 'bg-brand-600 text-white shadow-md shadow-brand-200' : 'text-gray-700 hover:bg-gray-50'}
                            ${isToday && !isSelected ? 'border border-brand-200 text-brand-600 font-bold' : ''}
                          `}
                        >
                          {day}
                        </button>
                        {totalCalories > 0 && (
                          <span className={`text-[10px] mt-1 font-medium tracking-tighter ${isSelected ? 'text-brand-600 font-bold' : 'text-gray-400'}`}>
                            {totalCalories}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Selected Date List */}
            <div className="flex-1 p-4 bg-gray-50">
              <div className="flex justify-between items-center mb-3 ml-1">
                <h3 className="text-sm font-bold text-gray-500">
                  {parseInt(selectedDate.split('-')[1])}월 {parseInt(selectedDate.split('-')[2])}일의 기록
                </h3>
                {dailyTotalCalories > 0 && (
                  <span className="text-sm font-bold text-brand-600">
                    총 {dailyTotalCalories} kcal
                  </span>
                )}
              </div>
              
              {filteredLogs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                  <Utensils size={32} className="mb-2 opacity-20" />
                  <p className="text-sm">이 날의 식단 기록이 없습니다.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredLogs.map(meal => {
                    const isFailedAnalysis = meal.calories === 0 || meal.analysis === '(직접 입력)' || meal.analysis === '(수정됨)';
                    return (
                      <div
                        key={meal.id}
                        onClick={() => handleMealClick(meal)}
                        className={`bg-white p-3 rounded-xl shadow-sm border flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300 cursor-pointer hover:shadow-md transition-shadow ${isFailedAnalysis ? 'border-amber-200 bg-amber-50/50' : 'border-gray-100'}`}
                      >
                        <img src={meal.imageUrl} alt={meal.foodName} className="w-20 h-20 rounded-lg object-cover flex-shrink-0 bg-gray-200" />
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start">
                            <h4 className="font-bold text-gray-900 truncate">{meal.foodName}</h4>
                            <span className={`text-xs font-medium px-2 py-1 rounded-md ${isFailedAnalysis ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'}`}>
                              {meal.calories} kcal
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1 line-clamp-2">{meal.analysis}</p>
                          <div className="flex justify-between items-center mt-2">
                            <p className="text-xs text-gray-400">
                              {new Date(meal.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </p>
                            {isFailedAnalysis && (
                              <span className="text-xs text-amber-600">탭하여 수정</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

      </main>

      {/* Manual Input Modal (when AI analysis fails) */}
      {showManualInput && pendingImageData && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-xl">
            <div className="p-4 bg-amber-50 border-b border-amber-100">
              <h3 className="font-bold text-amber-800">AI 분석 실패</h3>
              <p className="text-sm text-amber-600">사진 정보를 직접 입력해주세요.</p>
            </div>

            <div className="p-4">
              {/* Preview Image */}
              <div className="mb-4">
                <img
                  src={pendingImageData.imageUrl}
                  alt="업로드된 사진"
                  className="w-full h-40 object-cover rounded-lg"
                />
              </div>

              {/* Food Name Input */}
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  음식 이름 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={manualFoodName}
                  onChange={(e) => setManualFoodName(e.target.value)}
                  placeholder="예: 김치찌개, 샐러드"
                  className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
                />
              </div>

              {/* Memo Input */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  메모 (선택)
                </label>
                <textarea
                  value={manualMemo}
                  onChange={(e) => setManualMemo(e.target.value)}
                  placeholder="예: 점심 식사, 외식"
                  className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm resize-none"
                  rows={2}
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={handleManualCancel}
                  className="flex-1 py-3 px-4 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={handleManualSubmit}
                  disabled={isAnalyzing || !manualFoodName.trim()}
                  className="flex-1 py-3 px-4 bg-brand-600 text-white rounded-xl font-medium hover:bg-brand-700 transition-colors disabled:opacity-50"
                >
                  {isAnalyzing ? '저장 중...' : '저장'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Meal Modal */}
      {showEditMeal && editingMeal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-xl">
            <div className="p-4 bg-brand-50 border-b border-brand-100">
              <h3 className="font-bold text-brand-800">식단 정보 수정</h3>
              <p className="text-sm text-brand-600">식사 정보를 입력해주세요.</p>
            </div>

            <div className="p-4">
              {/* Preview Image */}
              <div className="mb-4">
                <img
                  src={editingMeal.imageUrl}
                  alt="식단 사진"
                  className="w-full h-40 object-cover rounded-lg"
                />
              </div>

              {/* Meal Time Input */}
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  식사 시간
                </label>
                <input
                  type="time"
                  value={editMealTime}
                  onChange={(e) => setEditMealTime(e.target.value)}
                  className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
                />
              </div>

              {/* Food Name Input */}
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  음식 이름 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editFoodName}
                  onChange={(e) => setEditFoodName(e.target.value)}
                  placeholder="예: 김치찌개, 샐러드"
                  className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
                />
              </div>

              {/* Calories Input with AI Estimate Button */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  예상 칼로리 (kcal)
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={editCalories}
                    onChange={(e) => setEditCalories(e.target.value)}
                    placeholder="예: 500"
                    className="flex-1 p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
                  />
                  <button
                    type="button"
                    onClick={handleEstimateCalories}
                    disabled={isEstimatingCalories || !editFoodName.trim()}
                    className="px-4 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                    title="AI로 칼로리 추정"
                  >
                    {isEstimatingCalories ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <Search size={18} />
                    )}
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  음식 이름 입력 후 돋보기 버튼을 누르면 AI가 칼로리를 추정합니다
                </p>
              </div>

              {/* Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={handleDeleteMeal}
                  disabled={isAnalyzing}
                  className="py-3 px-4 bg-red-100 text-red-600 rounded-xl font-medium hover:bg-red-200 transition-colors disabled:opacity-50"
                  title="삭제"
                >
                  <Trash2 size={20} />
                </button>
                <button
                  onClick={handleEditCancel}
                  className="flex-1 py-3 px-4 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={handleEditSave}
                  disabled={isAnalyzing || !editFoodName.trim()}
                  className="flex-1 py-3 px-4 bg-brand-600 text-white rounded-xl font-medium hover:bg-brand-700 transition-colors disabled:opacity-50"
                >
                  {isAnalyzing ? '저장 중...' : '저장'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Nav */}
      <nav className="absolute bottom-0 w-full bg-white border-t border-gray-200 px-6 py-3 flex justify-between items-center pb-safe">
        <button 
          onClick={() => setActiveTab('home')}
          className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'home' ? 'text-brand-600' : 'text-gray-400'}`}
        >
          <Activity size={24} />
          <span className="text-[10px] font-medium">대시보드</span>
        </button>
        
        <div className="w-px h-8 bg-gray-200" />

        <button 
           onClick={() => {
             setActiveTab('home');
             // We can focus the input or open the camera immediately here if needed
             // For now just going to home is enough as the input is prominent
           }}
           className="flex flex-col items-center gap-1 text-gray-400 hover:text-brand-600 transition-colors"
        >
           <Plus size={24} />
           <span className="text-[10px] font-medium">빠른 기록</span>
        </button>

        <div className="w-px h-8 bg-gray-200" />

        <button 
          onClick={() => setActiveTab('log')}
          className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'log' ? 'text-brand-600' : 'text-gray-400'}`}
        >
          <Utensils size={24} />
          <span className="text-[10px] font-medium">식단 내역</span>
        </button>
      </nav>
    </div>
  );
};