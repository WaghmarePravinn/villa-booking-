
import { GoogleGenAI } from "@google/genai";

export const generateVillaDescription = async (villaName: string, location: string, features: string[]): Promise<string> => {
  try {
    // Strictly follow Google GenAI SDK guidelines: Create a new instance right before making an API call.
    // This ensures the client always uses the most up-to-date API key from process.env.API_KEY.
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Write a luxurious and compelling 3-sentence marketing description for a villa named "${villaName}" located in "${location}". Key features include: ${features.join(", ")}.`,
    });
    // The response.text property returns the extracted string output directly.
    return response.text || "Experience unmatched luxury in this exquisite property.";
  } catch (error) {
    console.error("Gemini AI error:", error);
    return "Experience unmatched luxury in this exquisite property.";
  }
};
