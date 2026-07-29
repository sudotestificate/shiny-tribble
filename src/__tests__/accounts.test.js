import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  validateAccount,
  createAccount,
  ACCOUNT_KINDS,
} from '../schema/account';
import {
  buildAccountTree,
  calculateAccountBalance,
  getReferencingTransactions,
} from '../accounts/AccountService';

describe('AccountService', () => {
  describe('buildAccountTree', () => {
    it('builds a tree from flat accounts with parent_account', () => {
      const accounts = [
        createAccount({ name: 'Assets', kind: 'asset', currency: 'USD' }),
        createAccount({ name: 'Checking', kind: 'asset', currency: 'USD', parent_account: 'Assets' }),
        createAccount({ name: 'Savings', kind: 'asset', currency: 'USD', parent_account: 'Assets' }),
      ];
      const tree = buildAccountTree(accounts);
      expect(tree).toHaveLength(1);
      expect(tree[0].name).toBe('Assets');
      expect(tree[0].children).toHaveLength(2);
      expect(tree[0].children.map(c => c.name)).toContain('Checking');
      expect(tree[0].children.map(c => c.name)).toContain('Savings');
    });

    it('returns multiple roots when accounts have no parent', () => {
      const accounts = [
        createAccount({ name: 'Assets', kind: 'asset', currency: 'USD' }),
        createAccount({ name: 'Liabilities', kind: 'liability', currency: 'USD' }),
      ];
      const tree = buildAccountTree(accounts);
      expect(tree).toHaveLength(2);
    });

    it('handles accounts with parent_account that does not match any existing account', () => {
      const accounts = [
        createAccount({ name: 'Orphan', kind: 'asset', currency: 'USD', parent_account: 'Nonexistent' }),
      ];
      const tree = buildAccountTree(accounts);
      expect(tree).toHaveLength(1);
      expect(tree[0].name).toBe('Orphan');
    });

    it('returns an empty array for an empty accounts list', () => {
      const tree = buildAccountTree([]);
      expect(tree).toEqual([]);
    });
  });

  describe('calculateAccountBalance', () => {
    it('calculates the sum of all postings for an account', () => {
      const transactions = [
        {
          _id: 'tx1',
          postings: [
            { account: 'Checking', amount: 100, currency: 'USD' },
            { account: 'Income', amount: -100, currency: 'USD' },
          ],
        },
        {
          _id: 'tx2',
          postings: [
            { account: 'Checking', amount: 50, currency: 'USD' },
            { account: 'Expenses', amount: -50, currency: 'USD' },
          ],
        },
      ];
      expect(calculateAccountBalance('Checking', transactions)).toBe(150);
    });

    it('returns 0 when no transactions reference the account', () => {
      const transactions = [
        {
          _id: 'tx1',
          postings: [
            { account: 'Income', amount: 100, currency: 'USD' },
            { account: 'Checking', amount: -100, currency: 'USD' },
          ],
        },
      ];
      expect(calculateAccountBalance('Savings', transactions)).toBe(0);
    });

    it('returns 0 when transactions array is empty', () => {
      expect(calculateAccountBalance('Checking', [])).toBe(0);
    });

    it('handles negative balances correctly', () => {
      const transactions = [
        {
          _id: 'tx1',
          postings: [
            { account: 'Credit Card', amount: -200, currency: 'USD' },
            { account: 'Expenses', amount: 200, currency: 'USD' },
          ],
        },
      ];
      expect(calculateAccountBalance('Credit Card', transactions)).toBe(-200);
    });
  });

  describe('getReferencingTransactions', () => {
    it('returns transactions that reference the given account name', () => {
      const transactions = [
        {
          _id: 'tx1',
          postings: [
            { account: 'Checking', amount: 100, currency: 'USD' },
            { account: 'Income', amount: -100, currency: 'USD' },
          ],
        },
        {
          _id: 'tx2',
          postings: [
            { account: 'Savings', amount: 50, currency: 'USD' },
            { account: 'Income', amount: -50, currency: 'USD' },
          ],
        },
      ];
      const result = getReferencingTransactions('Checking', transactions);
      expect(result).toHaveLength(1);
      expect(result[0]._id).toBe('tx1');
    });

    it('returns an empty array when no transactions reference the account', () => {
      const transactions = [
        {
          _id: 'tx1',
          postings: [
            { account: 'Savings', amount: 100, currency: 'USD' },
            { account: 'Income', amount: -100, currency: 'USD' },
          ],
        },
      ];
      const result = getReferencingTransactions('Checking', transactions);
      expect(result).toEqual([]);
    });

    it('returns an empty array when transactions is empty', () => {
      const result = getReferencingTransactions('Checking', []);
      expect(result).toEqual([]);
    });
  });
});

describe('Account schema', () => {
  it('validates a valid account document', () => {
    const account = createAccount({ name: 'Checking', kind: 'asset', currency: 'USD' });
    const errors = validateAccount(account);
    expect(errors).toEqual([]);
  });

  it('rejects an account missing type', () => {
    const errors = validateAccount({ _id: 'test', name: 'Checking', kind: 'asset', currency: 'USD', created_at: '2026-01-01T00:00:00Z' });
    expect(errors).toContainEqual(expect.stringMatching(/Invalid type/));
  });

  it('rejects an account with invalid kind', () => {
    const account = createAccount({ name: 'Checking', kind: 'invalid', currency: 'USD' });
    account.type = 'account';
    const errors = validateAccount(account);
    expect(errors.some(e => e.includes('kind'))).toBe(true);
  });

  it('rejects an account missing name', () => {
    const account = createAccount({ name: '', kind: 'asset', currency: 'USD' });
    account.type = 'account';
    const errors = validateAccount(account);
    expect(errors.some(e => e.includes('name'))).toBe(true);
  });

  it('rejects an account missing currency', () => {
    const account = createAccount({ name: 'Checking', kind: 'asset', currency: '' });
    account.type = 'account';
    const errors = validateAccount(account);
    expect(errors.some(e => e.includes('currency'))).toBe(true);
  });

  it('accepts all valid ACCOUNT_KINDS', () => {
    ACCOUNT_KINDS.forEach(kind => {
      const account = createAccount({ name: `Test ${kind}`, kind, currency: 'USD' });
      const errors = validateAccount(account);
      expect(errors).toEqual([]);
    });
  });
});