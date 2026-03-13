import 'dotenv/config';
import { afterEach, describe, expect, it } from 'vitest';
import { getAiRuntimeConfig } from '../utils/ai';
import { prepareSummaryPayload } from '../utils/ai-summary';

const originalEnv = { ...process.env };

afterEach(() => {
  process.env = { ...originalEnv };
});

describe('AI runtime config', () => {
  it('flags mismatched xAI provider settings early', () => {
    process.env = {
      ...originalEnv,
      AI_ENABLED: 'true',
      AI_PROVIDER: 'xai',
      AI_BASE_URL: 'https://api.openai.com/v1',
      AI_MODEL: 'grok-4-1-fast-non-reasoning',
      AI_API_KEY: 'sk-placeholder-key',
    };

    const config = getAiRuntimeConfig();

    expect(config.available).toBe(false);
    expect(config.issues.some((issue) => issue.includes('OpenAI'))).toBe(true);
    expect(config.issues.some((issue) => issue.includes('placeholder'))).toBe(true);
  });
});

describe('summary payload preparation', () => {
  it('compacts leads data into aggregate metrics and samples', () => {
    const result = prepareSummaryPayload('leads', [
      {
        name: 'Lead A',
        company: 'Acme',
        status: 'Nuevo',
        origin: 'Web',
        priority: 'Alta',
        estimatedValue: '1000',
        probability: 50,
      },
      {
        name: 'Lead B',
        company: 'Beta',
        status: 'Ganado',
        origin: 'Referral',
        priority: 'Media',
        estimatedValue: '500',
        probability: 100,
      },
    ]);

    expect(result.preparedPayloadBytes).toBeGreaterThan(0);
    expect(result.preparedData).toMatchObject({
      overview: {
        totalLeads: 2,
        totalEstimatedValue: 1500,
        weightedPipelineValue: 1000,
      },
    });
  });
});


