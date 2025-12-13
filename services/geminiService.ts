import { GoogleGenAI } from "@google/genai";
import { Schedule, Doctor } from "../types";

// In a real production app, ensure this is set.
// For this demo context, we assume the environment variable is injected.
const API_KEY = process.env.API_KEY || ''; 

let ai: GoogleGenAI | null = null;

try {
    if (API_KEY) {
        ai = new GoogleGenAI({ apiKey: API_KEY });
    }
} catch (error) {
    console.error("Failed to initialize Gemini Client", error);
}

export const generateScheduleSummary = async (schedules: Schedule[], doctors: Doctor[], userQuery: string): Promise<string> => {
    if (!ai) return "عذراً، خدمة المساعد الذكي غير متوفرة حالياً (مفتاح API مفقود).";

    // Prepare context data
    const doctorMap = new Map(doctors.map(d => [d.id, d]));
    
    const scheduleContext = schedules.map(s => {
        const doc = doctorMap.get(s.doctor_id);
        return `- الدكتور ${doc?.name || 'غير معروف'} (${doc?.specialty}): ${s.day_of_week} من ${s.start_time} إلى ${s.end_time} ${s.is_cancelled ? '(ملغى)' : ''}`;
    }).join('\n');

    const prompt = `
    أنت مساعد ذكي لمركز أم النور الطبي.
    مهمتك مساعدة المرضى في معرفة مواعيد الأطباء.
    
    إليك جدول المواعيد الحالي:
    ${scheduleContext}

    قواعد الإجابة:
    1. أجب باللغة العربية فقط.
    2. كن مهذباً ومختصراً.
    3. استخدم المعلومات الواردة في الجدول أعلاه فقط.
    4. إذا كان الموعد ملغى، أخبر المريض بذلك بوضوح.

    سؤال المريض: ${userQuery}
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text || "لم أتمكن من فهم السؤال، يرجى المحاولة مرة أخرى.";
    } catch (error) {
        console.error("Gemini API Error:", error);
        return "حدث خطأ أثناء الاتصال بالمساعد الذكي.";
    }
};