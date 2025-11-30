
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { TransactionType, ActivityType, TaxCategory } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

const modelName = 'gemini-2.5-flash';

// Schema for categorizing a single transaction
const categorizationSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    suggestedType: { type: Type.STRING, enum: Object.values(TransactionType) },
    suggestedActivity: { type: Type.STRING, enum: Object.values(ActivityType) },
    suggestedTaxCategory: { type: Type.STRING, enum: Object.values(TaxCategory) },
    reasoning: { type: Type.STRING }
  },
  required: ['suggestedType', 'suggestedActivity', 'suggestedTaxCategory', 'reasoning']
};

// Schema for extracting multiple transactions from a document
const documentParseSchema: Schema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      date: { type: Type.STRING, description: "Datum transakce ve formátu YYYY-MM-DD" },
      description: { type: Type.STRING, description: "Popis transakce nebo název protistrany" },
      amount: { type: Type.NUMBER, description: "Částka (kladná pro vše)" },
      type: { type: Type.STRING, enum: Object.values(TransactionType), description: "Příjem nebo Výdaj" },
      variableSymbol: { type: Type.STRING, description: "Variabilní symbol, pokud existuje", nullable: true },
      suggestedActivity: { type: Type.STRING, enum: Object.values(ActivityType) },
      suggestedTaxCategory: { type: Type.STRING, enum: Object.values(TaxCategory) }
    },
    required: ['date', 'description', 'amount', 'type', 'suggestedActivity', 'suggestedTaxCategory']
  }
};

export const categorizeTransaction = async (description: string, language: string = 'cs') => {
  if (!apiKey) return null;

  try {
    const langInstruction = language === 'en' 
      ? "You are an accounting assistant for Czech non-profits. Respond in JSON." 
      : "Jsi účetní asistent pro české neziskovky.";

    const response = await ai.models.generateContent({
      model: modelName,
      contents: `Analyze this transaction: "${description}". Determine type, activity (Main/Secondary), and tax category under Czech law.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: categorizationSchema,
        systemInstruction: langInstruction
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response text");
    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini categorization failed:", error);
    return null;
  }
};

export const parseDocument = async (base64Data: string, mimeType: string) => {
  if (!apiKey) throw new Error("API Key is missing.");

  try {
    const parts: any[] = [];
    if (base64Data) {
        parts.push({
            inlineData: {
                mimeType: mimeType,
                data: base64Data
            }
        });
    }
    parts.push({ text: "Analyzuj tento dokument. Extrahuj transakce. Datum YYYY-MM-DD." });

    const response = await ai.models.generateContent({
      model: modelName,
      contents: { parts: parts },
      config: {
        responseMimeType: "application/json",
        responseSchema: documentParseSchema,
        systemInstruction: "OCR and Accounting extraction."
      }
    });

    const text = response.text;
    if (!text) return [];
    return JSON.parse(text);
  } catch (error) {
    console.error("Document parsing failed:", error);
    throw error;
  }
};

export const parseTextData = async (dataString: string) => {
  if (!apiKey) throw new Error("API Key is missing.");
  // Keeping this simple for now, can add language later
  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: `Analyze CSV/Excel data. Extract transactions. Date YYYY-MM-DD.\nDATA:\n${dataString.substring(0, 30000)}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: documentParseSchema,
        systemInstruction: "Expert accounting system."
      }
    });
    return JSON.parse(response.text || "[]");
  } catch (error) { return []; }
};

export const getAccountingAdvice = async (query: string, context: string, language: string = 'cs') => {
  if (!apiKey) return language === 'en' ? "Please set API Key." : "Pro využití AI poradce prosím nastavte API klíč.";

  try {
    const prompt = language === 'en' 
      ? `User asks: "${query}". Context: ${context}. Answer in English. You are an expert on Czech Non-profit law.`
      : `Uživatel se ptá: "${query}". Kontext: ${context}. Jsi expert na účetnictví a daně českých neziskovek.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt
    });
    return response.text;
  } catch (error) {
    return "Error / Chyba.";
  }
};

export const checkLegislativeUpdates = async (language: string = 'cs') => {
  if (!apiKey) return "API Key missing.";
  try {
    const prompt = language === 'en'
      ? "What are the current legislative updates for Czech non-profits (Associations) for this year? Be concise."
      : "Jaké jsou aktuální legislativní novinky pro české neziskové organizace pro tento rok?";

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
    });
    return response.text;
  } catch (error) { return "Error."; }
};

export const generateMeetingMinutes = async (data: any, language: string = 'cs') => {
  if (!apiKey) return "API Key missing.";
  // Logic mostly remains language neutral or defaults to Czech as it generates Czech legal docs
  // But we can wrap instructions
  const prompt = `Vytvoř formální text Zápisu z schůze. Datum: ${data.date}. Body: ${data.points}.`;
  
  const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt
  });
  return response.text;
};

export const getAssistantResponse = async (message: string, currentView: string, imageBase64?: string, language: string = 'cs') => {
  if (!apiKey) return language === 'en' ? "Please provide API Key." : "Pro chat prosím zadejte API klíč.";

  const systemInstruction = language === 'en' 
    ? `You are a guide for 'NonProfitPro' app. Current view: ${currentView}. Help the user with the app and Czech non-profit accounting. Answer in English.`
    : `Jsi průvodce aplikací 'NeziskovkaPro'. Aktuální pohled: ${currentView}. Pomáhej uživateli. Odpovídej česky.`;

  try {
    const parts: any[] = [];
    if (imageBase64) {
      const match = imageBase64.match(/^data:([^;]+);base64,(.+)$/);
      parts.push({ inlineData: { mimeType: match ? match[1] : "image/png", data: match ? match[2] : imageBase64 } });
    }
    parts.push({ text: message });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts: parts },
      config: { systemInstruction }
    });
    return response.text;
  } catch (error) {
    return "Error.";
  }
};
