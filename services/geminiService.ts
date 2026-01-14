
import { GoogleGenAI, Type } from "@google/genai";

export const generateVillaDescription = async (villaName: string, location: string, features: string[]): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `Act as a luxury hospitality copywriter for Peak Stay Destination. 
    Write a sophisticated 3-sentence summary for: "${villaName}" in "${location}".
    Highlight these features: ${features.join(", ")}.
    Focus on architectural details like white brickwork, designer tiles, canopy beds, and the tranquility of private lap pools.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });

    return response.text || "A bespoke sanctuary where coastal minimalism meets unrivaled luxury.";
  } catch (error) {
    console.error("Gemini AI Error:", error);
    return "An exquisite private retreat offering a seamless blend of sophisticated design.";
  }
};

/**
 * Parses a natural language prompt to generate a structured Villa object.
 */
export const generateVillaFromPrompt = async (userInput: string): Promise<any> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: `Generate a complete structured luxury villa profile based on this description: "${userInput}". 
      Estimate counts if not explicitly mentioned (e.g., 3BHK usually has 3-4 bathrooms and capacity of 6-10).
      Return the data as a clean JSON object.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING, description: "Catchy luxury name for the villa" },
            location: { type: Type.STRING, description: "City and State (e.g. Anjuna, Goa)" },
            pricePerNight: { type: Type.NUMBER, description: "Estimated market price in INR" },
            bedrooms: { type: Type.NUMBER },
            bathrooms: { type: Type.NUMBER },
            capacity: { type: Type.NUMBER, description: "Max guests allowed" },
            amenities: { type: Type.ARRAY, items: { type: Type.STRING } },
            includedServices: { type: Type.ARRAY, items: { type: Type.STRING } },
            description: { type: Type.STRING, description: "Short engaging summary (max 150 chars)" },
            longDescription: { type: Type.STRING, description: "Detailed narrative describing architecture and vibe (max 500 chars)" },
            refundPolicy: { type: Type.STRING }
          },
          required: ["name", "location", "bedrooms", "pricePerNight", "bathrooms", "capacity"]
        }
      }
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Gemini Parsing Error:", error);
    return null;
  }
};
