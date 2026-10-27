import axios from 'axios';
import { IAIProvider, AICompletionOptions } from './provider.interface';
import { SmartMockProvider } from './smart-mock.provider';

export class GeminiProvider implements IAIProvider {
  name = 'Google Gemini AI';
  private apiKey: string;
  private primaryModel: string;
  private fallbackModels = ['gemini-flash-latest', 'gemini-3.5-flash-lite', 'gemini-3.7-flash', 'gemini-3.6-flash'];

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.GEMINI_API_KEY || '';
    this.primaryModel = process.env.GEMINI_MODEL || 'gemini-flash-latest';
  }

  private getEndpoint(model: string): string {
    return `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
  }

  async generateText(prompt: string, systemPrompt?: string, options?: AICompletionOptions): Promise<string> {
    if (!this.apiKey) {
      throw new Error('GEMINI_API_KEY is not configured');
    }

    const payload: any = {
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        temperature: options?.temperature ?? 0.7,
        maxOutputTokens: options?.maxTokens ?? 2048,
      },
    };

    if (options?.responseMimeType) {
      payload.generationConfig.responseMimeType = options.responseMimeType;
    }

    if (systemPrompt) {
      payload.systemInstruction = {
        parts: [{ text: systemPrompt }],
      };
    }

    const selectedModel = options?.model || this.primaryModel;
    const modelsToTry = [selectedModel, ...this.fallbackModels.filter((m) => m !== selectedModel)];
    let lastError: any = null;
    const timeout = options?.timeout ?? 12000;

    for (const model of modelsToTry) {
      let response;
      try {
        response = await axios.post(`${this.getEndpoint(model)}?key=${this.apiKey}`, payload, {
          headers: { 'Content-Type': 'application/json' },
          timeout,
        });
      } catch (err: any) {
        lastError = err;
        const status = err.response?.status;
        const msg = err.response?.data?.error?.message || err.message;
        // If model not found, high demand, rate-limited, or timeout, try next fallback model
        if (
          status === 404 ||
          status === 503 ||
          status === 429 ||
          msg.includes('not found') ||
          msg.includes('deprecated') ||
          msg.includes('high demand') ||
          msg.includes('timeout')
        ) {
          console.warn(`[GeminiProvider] Model ${model} unavailable (${msg}), attempting fallback model...`);
          continue;
        }
        throw new Error(`Google Gemini API Error (${model}): ${msg}`);
      }

      const candidates = response.data?.candidates;
      if (candidates && candidates.length > 0) {
        return candidates[0].content?.parts?.[0]?.text || '';
      }
    }

    console.warn(`[GeminiProvider] All remote Gemini models temporarily busy or rate-limited. Falling back to internal heuristic engine.`);
    const mock = new SmartMockProvider();
    return mock.generateText(prompt, systemPrompt, options);
  }

  async generateJson<T>(prompt: string, systemPrompt?: string, options?: AICompletionOptions): Promise<T> {
    const jsonPrompt = `${prompt}\n\nIMPORTANT: Return ONLY valid, parseable JSON with NO markdown code fences or conversational text.`;
    const jsonOptions: AICompletionOptions = {
      ...options,
      responseMimeType: 'application/json',
      maxTokens: options?.maxTokens ?? 2500,
      timeout: options?.timeout ?? 15000,
    };
    try {
      const raw = await this.generateText(jsonPrompt, systemPrompt, jsonOptions);
      
      // Clean up possible markdown fences
      let cleaned = raw.replace(/^```json/im, '').replace(/^```/m, '').replace(/```$/m, '').trim();
      // Clean potential trailing commas before closing braces/brackets
      cleaned = cleaned.replace(/,\s*([\]}])/g, '$1');
      
      return JSON.parse(cleaned) as T;
    } catch (err: any) {
      console.warn('[GeminiProvider] JSON generation parsing fallback:', err.message);
      // If parsing fails or generation fails, gracefully use SmartMock JSON
      const mock = new SmartMockProvider();
      return mock.generateJson<T>(prompt, systemPrompt, options);
    }
  }
}
