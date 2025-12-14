import { GoogleGenAI } from "@google/genai";
import { Doctor } from "../types";

const SYSTEM_INSTRUCTION = `
أنت مساعد ذكي لمركز "أم النور الطبي".
دورك هو مساعدة المرضى والزوار في معرفة مواعيد الأطباء والإجابة عن الأسئلة العامة حول المركز.
تحدث باللغة العربية بلهجة ودودة ومهنية.
لديك حق الوصول إلى قائمة الأطباء وجداولهم الحالية. استخدم هذه المعلومات للإجابة بدقة.
إذا سألك شخص عن موعد طبيب، تحقق من البيانات المقدمة لك في السياق.
الأيام بالإنجليزية في البيانات، لكن يجب أن ترد بالعربية (Sunday = الأحد، إلخ).
`;

export class GeminiService {
  private ai: GoogleGenAI;
  private modelId = "gemini-2.5-flash";

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  async askAssistant(question: string, doctors: Doctor[]): Promise<string> {
    try {
      // Format context data
      const doctorsContext = doctors.map(d => 
        `الطبيب: ${d.name}, التخصص: ${d.specialty}, الحالة: ${d.isActive ? 'متاح' : 'اجازة'}, المواعيد: ${JSON.stringify(d.schedule)}`
      ).join('\n');

      const fullPrompt = `
      سياق البيانات الحالي للمركز:
      ${doctorsContext}

      سؤال المستخدم:
      ${question}
      `;

      const response = await this.ai.models.generateContent({
        model: this.modelId,
        contents: fullPrompt,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
        },
      });

      return response.text || "عذراً، لم أتمكن من الحصول على إجابة في الوقت الحالي.";
    } catch (error) {
      console.error("Gemini API Error:", error);
      return "حدث خطأ في الاتصال بالمساعد الذكي. يرجى المحاولة لاحقاً.";
    }
  }
}