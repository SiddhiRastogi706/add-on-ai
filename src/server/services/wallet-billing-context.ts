import { AsyncLocalStorage } from 'async_hooks';

interface WalletBillingContext {
  organizationId: string;
}

export const walletBillingContext = new AsyncLocalStorage<WalletBillingContext>();
