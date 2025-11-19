import { Patient } from './types';

const generateDates = (days: number) => {
  const dates = [];
  for (let i = days; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().split('T')[0]);
  }
  return dates;
};

const dates = generateDates(14);

export const MOCK_PATIENTS: Patient[] = [
  {
    id: 'p1',
    deviceId: 'mock-device-id-1', // Simulated existing device
    status: 'ACTIVE',
    name: '김철수',
    phoneNumber: '010-1234-5678',
    joinedAt: new Date().toISOString(),
    age: 34,
    startWeight: 95,
    currentWeight: 88.5,
    targetWeight: 75,
    weightLogs: dates.map((d, i) => ({
      id: `w-${i}`,
      date: d,
      weight: 95 - (i * 0.5) + (Math.random() * 0.4 - 0.2)
    })),
    mealLogs: [
      {
        id: 'm1',
        date: new Date().toISOString(),
        imageUrl: 'https://picsum.photos/400/300',
        foodName: '닭가슴살 샐러드',
        calories: 350,
        analysis: '탄수화물이 적고 단백질이 풍부한 훌륭한 식단입니다.'
      }
    ]
  },
  {
    id: 'p2',
    status: 'ACTIVE',
    name: '이영희',
    phoneNumber: '010-9876-5432',
    joinedAt: new Date().toISOString(),
    age: 28,
    startWeight: 65,
    currentWeight: 61.2,
    targetWeight: 55,
    weightLogs: dates.map((d, i) => ({
      id: `w-${i}`,
      date: d,
      weight: 65 - (i * 0.3)
    })),
    mealLogs: []
  },
  {
    id: 'p3',
    status: 'PENDING', // Simulated pending user
    name: '박민수 (승인대기)',
    phoneNumber: '010-5555-7777',
    joinedAt: new Date().toISOString(),
    age: 41,
    startWeight: 102,
    currentWeight: 102,
    targetWeight: 80,
    weightLogs: [],
    mealLogs: []
  }
];