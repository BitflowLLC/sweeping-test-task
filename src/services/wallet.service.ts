export class NotEnoughGasError extends Error {}
export class NotEnoughTokenError extends Error {}

export type SupportedToken = 'ETH' | 'USDT';
export type WalletId = string;

export interface Wallet {
  id: WalletId;
  balances: Record<SupportedToken, number>;
}

export class SimulatedWalletService {
  private wallets: Map<string, Wallet> = new Map();
  private readonly gasFee: number;
  private readonly gasToken: SupportedToken;

  constructor(gasFee: number = 0.01, gasToken: SupportedToken = 'ETH') {
    this.gasFee = gasFee;
    this.gasToken = gasToken;
  }

  createWallet(ethBalance: number = 0, usdtBalance: number = 0): Wallet {
    const id = Math.random().toString(36).substring(2, 15);
    const wallet = { id, balances: { ETH: ethBalance, USDT: usdtBalance } };
    this.wallets.set(id, wallet);
    return wallet;
  }

  getBalance(walletId: string, token: SupportedToken): number {
    return this.wallets.get(walletId)?.balances[token] ?? 0;
  }

  send(
    sourceId: WalletId,
    targetId: WalletId,
    token: SupportedToken,
    amount: number,
  ): number {
    const sourceWallet = this.wallets.get(sourceId);
    if (!sourceWallet) throw new Error('Wallet not found');
    if (sourceWallet.balances[this.gasToken] < this.gasFee) {
      throw new NotEnoughGasError(`Not enough ${this.gasToken} for gas`);
    }
    if (
      token == this.gasToken &&
      sourceWallet.balances[this.gasToken] < this.gasFee + amount
    ) {
      throw new NotEnoughTokenError(`Insufficient ${token} balance`);
    }

    if (sourceWallet.balances[token] <= amount) {
      throw new NotEnoughTokenError(`Insufficient ${token} balance`);
    }
    const targetWallet = this.wallets.get(targetId);
    if (!targetWallet) throw new Error('Target wallet not found');

    sourceWallet.balances[this.gasToken] -= this.gasFee;
    sourceWallet.balances[token] -= amount;
    targetWallet.balances[token] += amount;

    return amount;
  }
}
