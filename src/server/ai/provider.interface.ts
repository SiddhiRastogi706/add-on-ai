export interface AICompletionOptions {
  temperature?: number;
  maxTokens?: number;
  model?: string;
  timeout?: number;
  responseMimeType?: string;
}

export interface IAIProvider {
  name: string;
  generateText(prompt: string, systemPrompt?: string, options?: AICompletionOptions): Promise<string>;
  generateJson<T>(prompt: string, systemPrompt?: string, options?: AICompletionOptions): Promise<T>;
}
