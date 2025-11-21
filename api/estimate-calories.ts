import { GoogleGenAI, Type } from "@google/genai";
import type { VercelRequest, VercelResponse } from "@vercel/node";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { foodName } = req.body;

    if (!foodName) {
      return res.status(400).json({ error: "Food name is required" });
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          {
            text: `"${foodName}"의 1인분 기준 예상 칼로리를 숫자로만 알려주세요.
            일반적인 한국 음식점/가정식 기준으로 추정해주세요.
            예: 김치찌개 -> 300, 삼겹살 1인분 -> 550`,
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            calories: { type: Type.NUMBER, description: "추정 칼로리 (숫자만)" },
          },
          required: ["calories"],
        },
      },
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error("No response from AI");
    }

    const result = JSON.parse(resultText);
    return res.status(200).json({ calories: result.calories || 0 });
  } catch (error) {
    console.error("Error estimating calories:", error);
    return res.status(500).json({ calories: 0 });
  }
}
