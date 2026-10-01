// Wallet balance math. Pure (no React Native imports) so it can be unit tested.
import type { Account, Ledger } from './store';

/** Money in minus money out for one wallet, excluding its base. */
export function movement(accountId: string, { incomes, expenses, transfers }: Ledger): number {
  let n = 0;
  for (const i of incomes) if (i.accountId === accountId) n += i.amount;
  for (const e of expenses) if (e.accountId === accountId) n -= e.amount;
  for (const t of transfers) {
    if (t.fromId === accountId) n -= t.amount;
    if (t.toId === accountId) n += t.amount;
  }
  return n;
}

export function balanceOf(a: Pick<Account, 'id' | 'base'>, ledger: Ledger): number {
  return Math.round((a.base + movement(a.id, ledger)) * 100) / 100;
}

/** The base that makes a wallet's balance come out to exactly `target`. */
export function baseFor(accountId: string, target: number, ledger: Ledger): number {
  return target - movement(accountId, ledger);
}
