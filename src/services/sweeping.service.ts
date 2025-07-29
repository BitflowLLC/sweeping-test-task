import { NotEnoughGasError, NotEnoughTokenError, SimulatedWalletService, WalletId } from './wallet.service';

export interface SweepingService {
  /**
   * Sweep all funds from the user wallet to a specified address.
   * @param fromWalletId - Wallet to sweep from
   * @param toAddress - Target address for sweeping funds
   * @returns {Promise<SweepResult>}
   */
  sweepAll(walletIds: WalletId[], toAddress: WalletId): Promise<void>;
}

export class TaskSweepingService implements SweepingService {

  constructor(
    private walletService: SimulatedWalletService,
    private mainWalletId: string,
  ) { }

  async sweepAll(walletIds: WalletId[], toWalletId: WalletId): Promise<void> {
    // TODO: implement sweeping algorithm
    const GAS_FEE = this.walletService['gasFee']; // e.g., 0.01
    for (const walletId of walletIds) {
      const ethBalance = this.walletService.getBalance(walletId, 'ETH');
      const usdtBalance = this.walletService.getBalance(walletId, 'USDT');
      // Skip if USDT is zero
      if (usdtBalance <= 0) { continue; }

      try {        
        if (ethBalance < GAS_FEE) { // not enough ETH
          
          const topUpAmount = GAS_FEE - ethBalance;
          const mainEth = this.walletService.getBalance(toWalletId, 'ETH');
          
          if (mainEth < topUpAmount) { continue; }
          this.walletService.send(toWalletId, walletId, 'ETH', topUpAmount);
        }
        // Now sweep USDT only
        this.walletService.send(walletId, toWalletId, 'USDT', usdtBalance);
      } catch (error) {
        if (error instanceof NotEnoughGasError) {
          continue;
        } else if(error instanceof NotEnoughTokenError) {
          continue;
        } else {
          throw error;
        }
      }
    }
  }
}
