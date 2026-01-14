
import { GoogleGenAI, Type } from "@google/genai";

export const generateVillaDescription = async (villaName: string, location: string, features: string[]): Promise<{ short: string, long: string }> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `Act as a luxury hospitality copywriter for Peak Stay Destination. 
    Property: "${villaName}" in "${location}".
    Features: ${features.join(", ")}.
    
    Task:
    1. A short, punchy summary (max 150 chars).
    2. A detailed narrative describing architecture, vibe, and the "Peak Stay" experience (max 600 chars).
    
    Style: Sophisticated, architectural, inviting. Use terms like "curated sanctuary", "bespoke design", "legacy stay".`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            short: { type: Type.STRING },
            long: { type: Type.STRING }
          },
          required: ["short", "long"]
        }
      }
    });

    const result = JSON.parse(response.text || '{"short": "", "long": ""}');
    return {
      short: result.short || "A bespoke sanctuary where coastal minimalism meets unrivaled luxury.",
      long: result.long || "An exquisite private retreat offering a seamless blend of sophisticated design and tranquility."
    };
  } catch (error) {
    console.error("Gemini AI Error:", error);
    return {
      short: "An exquisite private retreat offering a seamless blend of sophisticated design.",
      long: "Experience the pinnacle of luxury in this hand-curated sanctuary, designed for those who seek privacy and elegance in equal measure."
    };
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
