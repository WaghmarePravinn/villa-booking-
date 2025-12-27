
import { GoogleGenAI } from "@google/genai";

// Strictly follow Google GenAI SDK guidelines for initialization
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateVillaDescription = async (villaName: string, location: string, features: string[]): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Write a luxurious and compelling 3-sentence marketing description for a villa named "${villaName}" located in "${location}". Key features include: ${features.join(", ")}.`,
    });
    // response.text is a property that returns the generated text directly
    return response.text || "Experience unmatched luxury in this exquisite property.";
  } catch (error) {
    console.error("Gemini AI error:", error);
    return "Experience unmatched luxury in this exquisite property.";
  }
};
