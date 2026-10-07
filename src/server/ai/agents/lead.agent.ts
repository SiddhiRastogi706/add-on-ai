import { LeadItem } from '../../../shared/types';

export class LeadAgent {
  static scoreAndPrioritize(lead: {
    name: string;
    email: string;
    company?: string;
    source: string;
    messageOrNote?: string;
  }): {
    score: number;
    priority: 'HOT' | 'WARM' | 'COLD';
    suggestedAction: string;
  } {
    let score = 50;
    const msg = (lead.messageOrNote || '').toLowerCase();

    // Source weighting
    if (lead.source.includes('Google Ads') || lead.source.includes('Search')) score += 15;
    if (lead.company && lead.company.trim().length > 2) score += 10;
    if (lead.email && !lead.email.includes('gmail.com') && !lead.email.includes('yahoo.com')) score += 15; // Business domain

    // Intent signals in message
    if (msg.includes('urgent') || msg.includes('asap') || msg.includes('pricing') || msg.includes('budget')) {
      score += 15;
    }
    if (msg.includes('just looking') || msg.includes('student') || msg.includes('free tier only')) {
      score -= 20;
    }

    score = Math.min(100, Math.max(15, score));

    let priority: 'HOT' | 'WARM' | 'COLD' = 'WARM';
    let suggestedAction = 'Send personalized follow-up email and product demo link within 24 hours.';

    if (score >= 80) {
      priority = 'HOT';
      suggestedAction = 'Trigger immediate VIP executive outreach. Offer priority strategy consultation within 2 business hours.';
    } else if (score < 45) {
      priority = 'COLD';
      suggestedAction = 'Enroll in automated 4-week nurture email drip campaign highlighting educational case studies.';
    }

    return { score, priority, suggestedAction };
  }
}
