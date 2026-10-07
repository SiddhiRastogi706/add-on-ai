import { prisma } from '../db';

export class MemoryService {
  static async recordMemory(
    businessId: string,
    memoryType: 'BRAND_PREFERENCE' | 'REJECTED_TOPIC' | 'APPROVED_STYLE' | 'WINNING_HOOK' | 'CAMPAIGN_LESSON',
    key: string,
    value: string,
    confidence: number = 1.0
  ) {
    return prisma.aIMemory.upsert({
      where: {
        id: `${businessId}_${key}`,
      },
      update: {
        value,
        confidence,
        updatedAt: new Date(),
      },
      create: {
        id: `${businessId}_${key}`,
        businessId,
        memoryType,
        key,
        value,
        confidence,
      },
    });
  }

  static async getBusinessContextPrompt(businessId: string): Promise<string> {
    const memories = await prisma.aIMemory.findMany({
      where: { businessId },
      take: 20,
      orderBy: { updatedAt: 'desc' },
    });

    if (memories.length === 0) return '';

    const lines = memories.map((m) => `- [${m.memoryType}] ${m.key}: ${m.value}`);
    return `\n### Persistent Business Memory & Feedback History:\n${lines.join('\n')}\n`;
  }
}
