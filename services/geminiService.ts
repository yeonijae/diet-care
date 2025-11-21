import { GoogleGenAI, Type } from "@google/genai";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

export interface FoodAnalysisResult {
  foodName: string;
  calories: number;
  analysis: string;
}

// Helper to compress image before sending/storing
export const compressImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        // Resize logic: Max dimension 800px to save space
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error("Could not get canvas context"));
          return;
        }
        
        ctx.drawImage(img, 0, 0, width, height);
        
        // Compress to JPEG with 0.7 quality
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
        resolve(compressedBase64);
      };
      img.onerror = (error) => reject(error);
    };
    reader.onerror = (error) => reject(error);
  });
};

export const analyzeFoodImage = async (base64Image: string): Promise<FoodAnalysisResult> => {
  try {
    // Clean the base64 string if it contains the header
    const data = base64Image.split(',')[1] || base64Image;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: data
            }
          },
          {
            text: "이 음식 사진을 분석해주세요. 음식 이름, 추정 칼로리, 그리고 다이어트 환자를 위한 짧은 영양학적 조언(analysis)을 한국어로 제공해주세요."
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            foodName: { type: Type.STRING, description: "음식의 이름" },
            calories: { type: Type.NUMBER, description: "추정 칼로리 (숫자만)" },
            analysis: { type: Type.STRING, description: "영양 성분 분석 및 다이어트 조언 (한 문장)" }
          },
          required: ["foodName", "calories", "analysis"]
        }
      }
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error("No response from AI");
    }

    return JSON.parse(resultText) as FoodAnalysisResult;

  } catch (error) {
    console.error("Error analyzing food:", error);
    return {
      foodName: "분석 실패",
      calories: 0,
      analysis: "이미지를 분석할 수 없습니다. 다시 시도해주세요."
    };
  }
};

export const analyzeFoodText = async (text: string): Promise<FoodAnalysisResult> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          {
            text: `다음 음식 내용을 분석해주세요: "${text}". 
            음식 이름(foodName), 총 추정 칼로리(calories, 숫자만), 그리고 다이어트 환자를 위한 짧은 영양학적 조언(analysis)을 한국어로 제공해주세요.
            만약 입력된 텍스트가 음식이 아니라면 calories는 0으로, analysis는 '음식 정보를 정확히 입력해주세요'라고 응답하세요.`
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            foodName: { type: Type.STRING, description: "음식의 이름 (예: 닭가슴살 샐러드)" },
            calories: { type: Type.NUMBER, description: "추정 총 칼로리 (숫자)" },
            analysis: { type: Type.STRING, description: "영양 성분 분석 및 다이어트 조언" }
          },
          required: ["foodName", "calories", "analysis"]
        }
      }
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error("No response from AI");
    }

    return JSON.parse(resultText) as FoodAnalysisResult;

  } catch (error) {
    console.error("Error analyzing food text:", error);
    return {
      foodName: "분석 실패",
      calories: 0,
      analysis: "텍스트를 분석할 수 없습니다. 다시 시도해주세요."
    };
  }
};

// Estimate calories from food name only
export const estimateCalories = async (foodName: string): Promise<number> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          {
            text: `"${foodName}"의 1인분 기준 예상 칼로리를 숫자로만 알려주세요.
            일반적인 한국 음식점/가정식 기준으로 추정해주세요.
            예: 김치찌개 -> 300, 삼겹살 1인분 -> 550`
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            calories: { type: Type.NUMBER, description: "추정 칼로리 (숫자만)" }
          },
          required: ["calories"]
        }
      }
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error("No response from AI");
    }

    const result = JSON.parse(resultText);
    return result.calories || 0;

  } catch (error) {
    console.error("Error estimating calories:", error);
    return 0;
  }
};