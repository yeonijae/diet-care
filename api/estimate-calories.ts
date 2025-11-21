import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { foodName } = req.body;

    if (!foodName) {
      return res.status(400).json({ error: "Food name is required" });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: SchemaType.OBJECT,
          properties: {
            calories: { type: SchemaType.NUMBER, description: "추정 칼로리 (숫자만)" },
          },
          required: ["calories"],
        },
      },
    });

    const result = await model.generateContent(
      `"${foodName}"의 1인분 기준 예상 칼로리를 숫자로만 알려주세요.
      일반적인 한국 음식점/가정식 기준으로 추정해주세요.
      예: 김치찌개 -> 300, 삼겹살 1인분 -> 550`
    );

    const responseText = result.response.text();
    if (!responseText) {
      throw new Error("No response from AI");
    }

    const parsed = JSON.parse(responseText);
    return res.status(200).json({ calories: parsed.calories || 0 });
  } catch (error: any) {
    console.error("Error estimating calories:", error);
    return res.status(500).json({
      calories: 0,
      error: error?.message || "Unknown error",
      apiKeyExists: !!process.env.GEMINI_API_KEY
    });
  }
}
