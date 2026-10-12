import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { WalletService } from '../services/wallet.service';

const router = Router();

router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      return res.status(401).json({ error: 'Wallet requires an authenticated organization.' });
    }

    const wallet = await WalletService.getWallet(organizationId);
    res.json(wallet);
  } catch (err: any) {
    console.error('[Wallet] Failed to load wallet:', err.message);
    res.status(500).json({ error: 'Failed to load wallet balance.' });
  }
});

export default router;
