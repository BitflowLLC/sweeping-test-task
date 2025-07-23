import { TaskSweepingService } from '../src/services/sweeping.service';
import { SimulatedWalletService } from '../src/services/wallet.service';
import { describe, expect, it } from '@jest/globals';

describe('SweepingService - Extended Edge Cases', () => {
  it('should sweep all USDT into main wallet and handle all edge cases', async () => {
    const sweepGasFeeEth = 0.01;

    const walletService = new SimulatedWalletService(sweepGasFeeEth);

    const initialData: [number, number][] = [
      [0.1, 100], // Enough gas and tokens - should sweep
      [0.005, 80], // Not enough gas - no sweep
      [0.01, 50], // Exactly enough gas - should sweep
      [0.02, 0], // Enough gas but zero USDT - no sweep, no gas deducted
      [0.02, 5], // Enough gas, small tokens - should sweep
      [0, 200], // No gas, but tokens - no sweep
      [0.01, 0], // Exactly gas, zero token - no sweep
      [0.009, 10], // Just below gas, some token - no sweep
      [0.05, 1000], // Big balance, enough gas - sweep
    ];

    // Create wallets
    const wallets = initialData.map(([eth, usdt]) =>
      walletService.createWallet(eth, usdt),
    );

    // Create main wallet
    const mainWallet = walletService.createWallet(0, 0);

    // Sweeping service instance
    const sweepingService = new TaskSweepingService(
      walletService,
      mainWallet.id,
    );

    // Wallet ids to sweep from (excluding main)
    const walletIds = wallets.map((w) => w.id);

    // Perform sweeping
    await sweepingService.sweepAll(walletIds, mainWallet.id);

    // Helper to check if wallet should have swept:
    // condition: gas >= fee && USDT > 0
    const shouldSweep = (eth: number, usdt: number) =>
      eth >= sweepGasFeeEth && usdt > 0;

    // Track total swept USDT for main wallet verification
    let totalSwept = 0;

    for (let i = 0; i < wallets.length; i++) {
      const wallet = wallets[i];
      const [eth, usdt] = initialData[i];

      if (shouldSweep(eth, usdt)) {
        // Swept wallets should have zero USDT now
        expect(walletService.getBalance(wallet.id, 'USDT')).toBe(0);

        // ETH should be decreased by gas fee
        expect(walletService.getBalance(wallet.id, 'ETH')).toBeCloseTo(
          eth - sweepGasFeeEth,
          8,
        );

        totalSwept += usdt;
      } else {
        // Wallets that didn't sweep keep their original balances
        expect(walletService.getBalance(wallet.id, 'USDT')).toBe(usdt);

        // ETH balance unchanged for those that did not sweep (no gas fee)
        expect(walletService.getBalance(wallet.id, 'ETH')).toBeCloseTo(eth, 8);
      }
    }

    // Main wallet should have sum of swept USDT
    expect(walletService.getBalance(mainWallet.id, 'USDT')).toBe(totalSwept);

    // Main wallet ETH balance remains zero (assumption: no gas cost for receiving)
    expect(walletService.getBalance(mainWallet.id, 'ETH')).toBe(0);
  });
});
