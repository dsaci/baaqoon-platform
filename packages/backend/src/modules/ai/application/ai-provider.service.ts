import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface AiMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AiGenerationResult {
  content: string;
  provider: string;
  model: string;
  tokensUsed?: number;
}

@Injectable()
export class AiProviderService {
  private readonly logger = new Logger(AiProviderService.name);

  constructor(private readonly config: ConfigService) {}

  private get provider(): string {
    return this.config.get<string>('AI_PROVIDER', 'openai_compatible');
  }

  private get baseUrl(): string {
    const custom = this.config.get<string>('AI_BASE_URL');
    if (custom) return custom;
    if (this.config.get<string>('OPENAI_API_KEY')) return 'https://api.openai.com/v1';
    if (this.config.get<string>('DEEPSEEK_API_KEY')) return 'https://api.deepseek.com/v1';
    if (this.config.get<string>('TOGETHER_API_KEY')) return 'https://api.together.xyz/v1';
    return 'https://api.groq.com/openai/v1';
  }

  private get apiKey(): string {
    return (
      this.config.get<string>('AI_API_KEY') ||
      this.config.get<string>('GROQ_API_KEY') ||
      this.config.get<string>('OPENAI_API_KEY') ||
      this.config.get<string>('DEEPSEEK_API_KEY') ||
      this.config.get<string>('TOGETHER_API_KEY') ||
      ''
    );
  }

  private get modelName(): string {
    const custom = this.config.get<string>('AI_MODEL_NAME');
    if (custom) return custom;
    if (this.config.get<string>('OPENAI_API_KEY')) return 'gpt-4o-mini';
    if (this.config.get<string>('DEEPSEEK_API_KEY')) return 'deepseek-chat';
    if (this.config.get<string>('TOGETHER_API_KEY')) return 'Qwen/Qwen2.5-72B-Instruct-Turbo';
    return 'llama-3.3-70b-versatile';
  }

  private get maxTokens(): number {
    return parseInt(this.config.get<string>('AI_MAX_TOKENS', '4096'));
  }

  private get temperature(): number {
    return parseFloat(this.config.get<string>('AI_TEMPERATURE', '0.3'));
  }

  async generateCompletion(messages: AiMessage[]): Promise<AiGenerationResult> {
    const provider = this.provider;

    if (provider === 'ollama') {
      return this.generateOllama(messages);
    }

    // Default: OpenAI-compatible (Groq, Together.ai, DeepSeek, Qwen, OpenAI, etc.)
    return this.generateOpenAICompatible(messages);
  }

  private async generateOpenAICompatible(messages: AiMessage[]): Promise<AiGenerationResult> {
    const url = `${this.baseUrl}/chat/completions`;
    const apiKey = this.apiKey;

    if (!apiKey) {
      throw new Error('AI_API_KEY غير مُعيَّن. يرجى إضافة مفتاح API في ملف .env');
    }

    this.logger.log(`Calling OpenAI-compatible API at ${url} with model ${this.modelName}`);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: this.modelName,
        messages,
        max_tokens: this.maxTokens,
        temperature: this.temperature,
        stream: false,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      this.logger.error(`AI API error ${response.status}: ${errorText}`);
      throw new Error(`فشل طلب الذكاء الاصطناعي: ${response.status} ${response.statusText}`);
    }

    const data = (await response.json()) as any;
    const content = data.choices?.[0]?.message?.content || '';
    const tokensUsed = data.usage?.total_tokens;

    return {
      content,
      provider: 'openai_compatible',
      model: this.modelName,
      tokensUsed,
    };
  }

  private async generateOllama(messages: AiMessage[]): Promise<AiGenerationResult> {
    const baseUrl = this.baseUrl || 'http://localhost:11434';
    const url = `${baseUrl}/api/chat`;

    this.logger.log(`Calling Ollama at ${url} with model ${this.modelName}`);

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.modelName,
        messages,
        stream: false,
        options: {
          temperature: this.temperature,
          num_predict: this.maxTokens,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`فشل Ollama: ${response.status} ${errorText}`);
    }

    const data = (await response.json()) as any;
    const content = data.message?.content || '';

    return {
      content,
      provider: 'ollama',
      model: this.modelName,
    };
  }

  /** Check if AI is available (for health checks) */
  isConfigured(): boolean {
    const provider = this.provider;
    if (provider === 'ollama') return !!this.baseUrl;
    return !!this.apiKey;
  }
}
