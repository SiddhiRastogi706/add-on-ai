export interface SafetyValidationResult {
  isSafe: boolean;
  confidenceScore: number; // 0-100
  brandToneScore: number; // 0-100
  duplicateSimilarityScore: number; // 0-100 (lower is better)
  flaggedIssues: string[];
  requiresHumanApproval: boolean;
  disclaimer: string;
  validatedAt: string;
}

export class SafetyService {
  private static DISCLAIMER =
    'AI-generated recommendations and content may contain errors. Review important information before publishing or making business decisions.';

  private static SENSITIVE_KEYWORDS = [
    'guarantee 100%',
    'miracle cure',
    'guaranteed returns',
    'risk-free investment',
    'unlimited money',
    'illegal',
    'hack',
    'cheat',
    'secret trick',
  ];

  static validateContent(
    text: string,
    brandTone: string = 'Professional',
    existingContents: string[] = []
  ): SafetyValidationResult {
    const issues: string[] = [];
    const lower = text.toLowerCase();

    // 1. Policy & Sensitivity check
    for (const kw of this.SENSITIVE_KEYWORDS) {
      if (lower.includes(kw)) {
        issues.push(`Contains high-risk or prohibited claim: "${kw}"`);
      }
    }

    // 2. Fact / Overpromising detection
    if (lower.includes('always') || lower.includes('never fails') || lower.includes('guaranteed')) {
      issues.push('Contains superlative or non-verifiable certainty claims.');
    }

    // 3. Duplicate check against existing business content
    let highestSimilarity = 0;
    const wordsNew = new Set(lower.split(/\s+/).filter((w) => w.length > 4));
    for (const pastText of existingContents) {
      const pastWords = new Set(pastText.toLowerCase().split(/\s+/).filter((w) => w.length > 4));
      let intersection = 0;
      for (const w of wordsNew) {
        if (pastWords.has(w)) intersection++;
      }
      const similarity = wordsNew.size > 0 ? (intersection / wordsNew.size) * 100 : 0;
      if (similarity > highestSimilarity) highestSimilarity = similarity;
    }

    if (highestSimilarity > 75) {
      issues.push(`High content overlap (${Math.round(highestSimilarity)}%) with existing published materials.`);
    }

    // 4. Calculate scores
    const isSafe = issues.length === 0;
    const confidenceScore = Math.max(60, 96 - issues.length * 15 - Math.round(highestSimilarity * 0.1));
    const brandToneScore = issues.length > 0 ? 78 : 94;
    const requiresHumanApproval = !isSafe || highestSimilarity > 50;

    return {
      isSafe,
      confidenceScore,
      brandToneScore,
      duplicateSimilarityScore: Math.round(highestSimilarity),
      flaggedIssues: issues,
      requiresHumanApproval,
      disclaimer: this.DISCLAIMER,
      validatedAt: new Date().toISOString(),
    };
  }

  static getStandardDisclaimer(): string {
    return this.DISCLAIMER;
  }
}
