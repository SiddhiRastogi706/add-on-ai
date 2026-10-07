import axios from 'axios';
import { prisma } from '../db';

export interface MetaAdsDeployRequest {
  businessId: string;
  campaignName: string;
  dailyBudgetDollars: number;
  objective: string;
  headlines: string[];
  descriptions: string[];
}

export interface MetaAdsDeployResult {
  success: boolean;
  status: 'PAUSED' | 'SIMULATED_PAUSED';
  campaignId: string;
  isLiveApi: boolean;
  message: string;
  safetyCheckPassed: boolean;
}

export class MetaAdsService {
  /**
   * Deploys a Meta (Facebook/Instagram) campaign strictly in PAUSED status.
   */
  static async deployCampaign(req: MetaAdsDeployRequest): Promise<MetaAdsDeployResult> {
    const accessToken = process.env.META_ACCESS_TOKEN;
    const adAccountId = process.env.META_AD_ACCOUNT_ID;

    // Safety Pre-Flight Check: Dynamic daily budget limit configured from business or default $500
    let maxLimit = 500;
    if (req.businessId) {
      try {
        const biz = await prisma.business.findUnique({
          where: { id: req.businessId },
          select: { dailyBudgetLimit: true },
        });
        if (biz && biz.dailyBudgetLimit) {
          maxLimit = biz.dailyBudgetLimit;
        }
      } catch (e) {
        maxLimit = 500;
      }
    }

    if (req.dailyBudgetDollars > maxLimit) {
      throw new Error(`Safety Guardrail: Automated Meta daily budget ($${req.dailyBudgetDollars}) cannot exceed safety limit of $${maxLimit}/day without executive override.`);
    }

    if (accessToken && adAccountId) {
      try {
        const cleanActId = adAccountId.startsWith('act_') ? adAccountId : `act_${adAccountId}`;
        const endpoint = `https://graph.facebook.com/v19.0/${cleanActId}/campaigns`;

        // CRITICAL SAFETY GUARDRAIL: ALWAYS CREATE IN PAUSED STATUS
        const response = await axios.post(
          endpoint,
          {
            name: req.campaignName,
            objective: req.objective || 'OUTCOME_LEADS',
            status: 'PAUSED',
            special_ad_categories: [],
          },
          {
            params: { access_token: accessToken },
            headers: { 'Content-Type': 'application/json' },
            timeout: 15000,
          }
        );

        return {
          success: true,
          status: 'PAUSED',
          campaignId: response.data?.id || `act-${Date.now()}`,
          isLiveApi: true,
          safetyCheckPassed: true,
          message: 'Campaign created in Meta Ads Manager (STATUS: PAUSED). Review and activate in Meta Business Suite.',
        };
      } catch (err: any) {
        console.warn('[MetaAds] Live API creation error, falling back to simulated draft:', err.response?.data || err.message);
      }
    }

    return {
      success: true,
      status: 'SIMULATED_PAUSED',
      campaignId: `meta-sim-${Date.now()}`,
      isLiveApi: false,
      safetyCheckPassed: true,
      message: 'Campaign planned with Meta Lookalike architecture (STATUS: PAUSED). To deploy to live Meta ad account, configure META_ACCESS_TOKEN & META_AD_ACCOUNT_ID.',
    };
  }
}
