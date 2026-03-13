import { Injectable } from '@angular/core';
import { GoogleGenAI } from '@google/genai';

@Injectable({
  providedIn: 'root'
})
export class GeminiService {
  private ai: GoogleGenAI | null = null;

  constructor() {
    // In a real app, this key comes from env. 
    // We assume the environment provides process.env.API_KEY correctly.
    try {
        // @ts-ignore
        const key = process.env.API_KEY;
        if (key) {
            this.ai = new GoogleGenAI({ apiKey: key });
        }
    } catch (e) {
        console.error("Gemini API Key missing or invalid configuration");
    }
  }

  async draftReply(studentQuestion: string, context: string = "You are a helpful admin for an education app."): Promise<string> {
    if (!this.ai) return "AI Service Unavailable (Missing Key)";
    
    try {
      const model = 'gemini-2.5-flash';
      const prompt = `
        Context: ${context}
        Student Question: "${studentQuestion}"
        
        Task: Draft a professional, encouraging, and concise reply to the student. 
        If the question is about technical support, ask them to email support.
        If it's academic, provide a brief helpful pointer.
        Keep it under 50 words.
      `;

      const response = await this.ai.models.generateContent({
        model: model,
        contents: prompt
      });
      
      return response.text || "Could not generate reply.";
    } catch (error) {
      console.error("Gemini Error:", error);
      return "Error generating AI reply.";
    }
  }
}