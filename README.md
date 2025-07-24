# Sweeping Task

## Overview

This project implements an automated sweeping process for aggregating crypto assets (**USDT** and **ETH**) from a group of **N** Ethereum wallets into a primary (main) wallet

After sweeping, all **ETH** and **USDT** balances from auxiliary wallets will be consolidated into one main wallet, and the balances of the auxiliary wallets will be left at zero

## Problem Statement
1. **N** ethereum wallets are provided: **A1**, **A2**, ..., **An**
2. Each wallet may contain arbitrary amounts of **USDT** (**ERC-20**) and **ETH**
3. The main wallet is defined as **A1**
4. The goal is to transfer all **ETH** and **USDT** from **A2**, ..., **An** to **A1**
5. If an auxiliary wallet lacks sufficient **ETH** to cover transaction (gas) fees, it must be topped up from the main wallet before sweeping its assets

## Acceptance Criteria

1. SweepingService interface fully implemented
2. All tests pass successfully (`yarn test`)
3. Merge request is accepted and reviewed

## Environment set up:
```bash
yarn
yarn test
```

# Estimated Time
1 hour (estimated) for task completion