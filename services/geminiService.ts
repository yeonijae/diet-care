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
    const imageData = base64Image.split(',')[1] || base64Image;

    const response = await fetch('/api/analyze-image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ imageData }),
    });

    if (!response.ok) {
      throw new Error('API request failed');
    }

    return await response.json();
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
    const response = await fetch('/api/analyze-text', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      throw new Error('API request failed');
    }

    return await response.json();
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
    const response = await fetch('/api/estimate-calories', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ foodName }),
    });

    if (!response.ok) {
      throw new Error('API request failed');
    }

    const result = await response.json();
    return result.calories || 0;
  } catch (error) {
    console.error("Error estimating calories:", error);
    return 0;
  }
};
