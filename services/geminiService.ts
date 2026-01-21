
import { GoogleGenAI, Type } from "@google/genai";

/**
 * Helper to clean AI response string and ensure it's valid JSON
 */
const cleanJsonResponse = (text: string | undefined): string => {
  if (!text) return "{}";
  // Remove markdown code blocks if present
  let cleaned = text.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s+/, "").replace(/\s+```$/, "");
  }
  return cleaned;
};

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
      contents: [{ parts: [{ text: prompt }] }],
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

    const cleanedText = cleanJsonResponse(response.text);
    const result = JSON.parse(cleanedText || '{"short": "", "long": ""}');
    
    return {
      short: result.short || "A bespoke sanctuary where coastal minimalism meets unrivaled luxury.",
      long: result.long || "An exquisite private retreat offering a seamless blend of sophisticated design and tranquility."
    };
  } catch (error) {
    console.error("Gemini Description Error:", error);
    return {
      short: "An exquisite private retreat offering a seamless blend of sophisticated design.",
      long: "Experience the pinnacle of luxury in this hand-curated sanctuary, designed for those who seek privacy and elegance in equal measure."
    };
  }
};

/**
 * Generates descriptions based on a custom creative prompt
 */
export const generateCustomNarrative = async (villaName: string, instruction: string): Promise<{ short: string, long: string }> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `Act as a luxury hospitality copywriter. 
    Property: "${villaName}".
    Creative Instruction: "${instruction}".
    
    Task:
    1. A short, punchy summary (max 150 chars).
    2. A detailed narrative reflecting the instruction (max 600 chars).
    
    Return the data as a clean JSON object.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ parts: [{ text: prompt }] }],
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

    const cleanedText = cleanJsonResponse(response.text);
    return JSON.parse(cleanedText || '{"short": "", "long": ""}');
  } catch (error) {
    console.error("Gemini Custom Narrative Error:", error);
    throw error;
  }
};

/**
 * Parses a natural language prompt to generate a structured Villa object.
 */
export const generateVillaFromPrompt = async (userInput: string): Promise<any> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `Generate a complete structured luxury villa profile based on this description: "${userInput}". 
      Estimate counts if not explicitly mentioned (e.g., 3BHK usually has 3-4 bathrooms and capacity of 6-10).
      Return the data as a clean JSON object.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ parts: [{ text: prompt }] }],
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

    const cleanedText = cleanJsonResponse(response.text);
    if (!cleanedText || cleanedText === "{}") return null;

    return JSON.parse(cleanedText);
  } catch (error) {
    console.error("Gemini Drafting Error:", error);
    return null;
  }
};
