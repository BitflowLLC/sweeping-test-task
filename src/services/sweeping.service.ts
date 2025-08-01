import { SimulatedWalletService, WalletId } from './wallet.service';

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
    let gasFee = this.walletService['gasFee']
    let gasToken = this.walletService['gasToken']

    for (let walletId of walletIds) {

      let ethBalance = this.walletService.getBalance(walletId, 'ETH');
      let usdtBalance = this.walletService.getBalance(walletId, 'USDT');

      if (gasToken === 'ETH') {
        let usdtDone = false

        try {
          // first check if there is USDT balance, 
          if (usdtBalance > 0) {
            if (ethBalance >= gasFee) {
              this.walletService.send(walletId, toWalletId, 'USDT', usdtBalance);
            } else {
              // not enough ETH, try to get from main wallet 
              let amountToGet = gasFee - ethBalance;
              const mainEthBalance = this.walletService.getBalance(toWalletId, 'ETH');

              if (mainEthBalance >= (gasFee + amountToGet)) {
                this.walletService.send(toWalletId, walletId, 'ETH', amountToGet);
                this.walletService.send(walletId, toWalletId, 'USDT', usdtBalance);
              }
            }
            usdtDone = true;
          }
          // now send ETH
          if (usdtDone) {
            // update gas balance, as previous was used in USDT transfer
            ethBalance = this.walletService.getBalance(walletId, 'ETH'); // repeating ..
          }
          if (ethBalance > 0) {
            // check if has gas fee for ETH transfer
            if (ethBalance >= gasFee) {
              this.walletService.send(walletId, toWalletId, 'ETH', ethBalance);
            } else {
              // not enough ETH, try to get from main wallet 
              let amountToGet = gasFee - ethBalance;
              const mainEthBalance = this.walletService.getBalance(toWalletId, 'ETH');

              if (mainEthBalance >= (gasFee + amountToGet)) {
                this.walletService.send(toWalletId, walletId, 'ETH', amountToGet);
                this.walletService.send(walletId, toWalletId, 'ETH', (ethBalance + amountToGet));
              } else {
                console.warn(`Not enough ETH to top up gas for wallet ${walletId}`);
                continue; // Skip this wallet if no ETH available
              }
            }
          }
        } catch (error) {
          console.error(`Failed to sweep ETH for wallet ${walletId}:`, error);
          continue;
        }

      } else {
        console.error(`Invalid Gas Token found`);
        continue;
      }
    }
  }
}