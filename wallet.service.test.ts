// tests/SimulatedWalletService.test.ts

import {
  SimulatedWalletService,
  NotEnoughGasError,
  NotEnoughTokenError,
  SupportedToken,
  WalletId,
} from '../src/services/wallet.service';

import { describe, expect, beforeEach, test } from '@jest/globals';

describe('SimulatedWalletService', () => {
  let walletService: SimulatedWalletService;
  let walletAId: WalletId;
  let walletBId: WalletId;

  beforeEach(() => {
    walletService = new SimulatedWalletService(0.01, 'ETH');
    const walletA = walletService.createWallet(0.05, 100); // HAS gas and tokens
    const walletB = walletService.createWallet(0.02, 50);
    walletAId = walletA.id;
    walletBId = walletB.id;
  });

  test('send transfers the correct amount and deducts gas fee', () => {
    const token: SupportedToken = 'USDT';
    const sendAmount = 20;

    const sent = walletService.send(walletAId, walletBId, token, sendAmount);

    expect(sent).toBe(sendAmount);

    // Source wallet balances after send
    expect(walletService.getBalance(walletAId, token)).toBe(80); // 100 - 20
    expect(walletService.getBalance(walletAId, 'ETH')).toBeCloseTo(0.04); // 0.05 - 0.01 gas fee

    // Target wallet balances after receiving
    expect(walletService.getBalance(walletBId, token)).toBe(70); // 50 + 20
  });

  test('send throws NotEnoughGasError if source lacks gas token balance', () => {
    // Create wallet with zero ETH gas
    const poorWallet = walletService.createWallet(0, 100);
    expect(() =>
      walletService.send(poorWallet.id, walletBId, 'USDT', 10),
    ).toThrow(NotEnoughGasError);
  });

  test('send throws NotEnoughTokenError if source lacks token balance', () => {
    expect(
      () => walletService.send(walletAId, walletBId, 'USDT', 200), // source has only 100
    ).toThrow(NotEnoughTokenError);
  });

  test('send throws error if source wallet does not exist', () => {
    expect(() =>
      walletService.send('nonexistent', walletBId, 'USDT', 10),
    ).toThrow('Wallet not found');
  });

  test('send throws error if target wallet does not exist', () => {
    expect(() =>
      walletService.send(walletAId, 'nonexistent', 'USDT', 10),
    ).toThrow('Target wallet not found');
  });

  test.each([
    [0.009, false], // gas less than fee -> error
    [0.01, true], // exactly gas fee -> send allowed
    [0.02, true], // more than gas fee -> send allowed
  ])(
    'gas fee validation: wallet gas %p leads to send success %p',
    (ethBalance, shouldSucceed) => {
      const sender = walletService.createWallet(ethBalance, 50);
      const receiver = walletService.createWallet(0.05, 0);
      if (shouldSucceed) {
        expect(() =>
          walletService.send(sender.id, receiver.id, 'USDT', 10),
        ).not.toThrow();
      } else {
        expect(() =>
          walletService.send(sender.id, receiver.id, 'USDT', 10),
        ).toThrow(NotEnoughGasError);
      }
    },
  );
});
