import { GoogleGenAI } from "@google/genai";
import { Appointment } from "../types";

const initGenAI = () => {
  if (!process.env.API_KEY) {
    console.warn("Gemini API Key missing");
    return null;
  }
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const generateDailySummary = async (appointments: Appointment[]): Promise<string> => {
  const ai = initGenAI();
  if (!ai) return "Gemini API Key is missing. Please set it in the environment.";

  try {
    const today = new Date().toISOString().split('T')[0];
    const todayAppointments = appointments.filter(a => a.date === today);
    
    if (todayAppointments.length === 0) return "No appointments scheduled for today.";

    const prompt = `
      You are a medical receptionist assistant. Summarize the following schedule for today (${today}).
      Highlight the total number of patients, any conflicts (if times overlap), and a breakdown of status.
      
      Data: ${JSON.stringify(todayAppointments.map(a => ({ 
        time: a.time, 
        patient: a.patient_name, 
        status: a.status,
        notes: a.notes 
      })))}
      
      Keep the tone professional and concise.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    return response.text || "Could not generate summary.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Error generating summary.";
  }
};

export const askAssistant = async (question: string): Promise<string> => {
    const ai = initGenAI();
    if (!ai) return "API Key missing.";

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `You are a helpful assistant for Omelnour Medical Center. Answer this query concisely: ${question}`,
        });
        return response.text || "No response";
    } catch (e) {
        return "Error connecting to AI assistant.";
    }
}