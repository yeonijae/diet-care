import { GoogleGenAI, Type } from "@google/genai";
import type { VercelRequest, VercelResponse } from "@vercel/node";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { imageData } = req.body;

    if (!imageData) {
      return res.status(400).json({ error: "Image data is required" });
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: imageData,
            },
          },
          {
            text: "이 음식 사진을 분석해주세요. 음식 이름, 추정 칼로리, 그리고 다이어트 환자를 위한 짧은 영양학적 조언(analysis)을 한국어로 제공해주세요.",
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            foodName: { type: Type.STRING, description: "음식의 이름" },
            calories: { type: Type.NUMBER, description: "추정 칼로리 (숫자만)" },
            analysis: { type: Type.STRING, description: "영양 성분 분석 및 다이어트 조언 (한 문장)" },
          },
          required: ["foodName", "calories", "analysis"],
        },
      },
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error("No response from AI");
    }

    return res.status(200).json(JSON.parse(resultText));
  } catch (error) {
    console.error("Error analyzing food:", error);
    return res.status(500).json({
      foodName: "분석 실패",
      calories: 0,
      analysis: "이미지를 분석할 수 없습니다. 다시 시도해주세요.",
    });
  }
}
