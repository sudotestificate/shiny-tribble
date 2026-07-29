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
  getAccountById,
  createAccountRecord,
  updateAccount,
  deleteAccount,
} from '../accounts/AccountService';
import { getAllDocuments, saveDocument, deleteDocument } from '../services/pouchdb';

vi.mock('../services/pouchdb.js', () => ({
  getAllDocuments: vi.fn(),
  saveDocument: vi.fn(),
  deleteDocument: vi.fn(),
}));

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

describe('AccountService async CRUD', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAccountById', () => {
    it('returns an account when found by _id', async () => {
      const mockAccount = createAccount({ name: 'Checking', kind: 'asset', currency: 'USD' });
      getAllDocuments.mockResolvedValue([mockAccount]);
      const result = await getAccountById(mockAccount._id);
      expect(result).toEqual(mockAccount);
    });

    it('returns null when no account matches the id', async () => {
      getAllDocuments.mockResolvedValue([]);
      const result = await getAccountById('nonexistent');
      expect(result).toBeNull();
    });
  });

  describe('createAccountRecord', () => {
    it('creates and saves a valid account', async () => {
      const mockAccount = createAccount({ name: 'Checking', kind: 'asset', currency: 'USD' });
      getAllDocuments.mockResolvedValue([]);
      saveDocument.mockResolvedValue({ ok: true, id: mockAccount._id, rev: '1-abc' });
      const result = await createAccountRecord({
        name: 'Checking',
        kind: 'asset',
        currency: 'USD',
      });
      expect(saveDocument).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ ok: true, id: mockAccount._id, rev: '1-abc' });
    });

    it('throws when validation fails', async () => {
      getAllDocuments.mockResolvedValue([]);
      await expect(createAccountRecord({ name: '', kind: 'asset', currency: 'USD' }))
        .rejects.toThrow('Validation failed');
    });
  });

  describe('updateAccount', () => {
    it('updates an existing account and saves it', async () => {
      const mockAccount = createAccount({ name: 'Checking', kind: 'asset', currency: 'USD' });
      getAllDocuments.mockResolvedValue([mockAccount]);
      saveDocument.mockResolvedValue({ ok: true, id: mockAccount._id, rev: '2-def' });
      const result = await updateAccount(mockAccount._id, { name: 'Checking Updated' });
      expect(saveDocument).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ ok: true, id: mockAccount._id, rev: '2-def' });
    });

    it('throws when account not found', async () => {
      getAllDocuments.mockResolvedValue([]);
      await expect(updateAccount('nonexistent', { name: 'New' }))
        .rejects.toThrow('Account not found');
    });

    it('throws when validation fails', async () => {
      const mockAccount = createAccount({ name: 'Checking', kind: 'asset', currency: 'USD' });
      getAllDocuments.mockResolvedValue([mockAccount]);
      await expect(updateAccount(mockAccount._id, { name: '' }))
        .rejects.toThrow('Validation failed');
    });
  });

  describe('deleteAccount', () => {
    it('deletes an account with no referencing transactions', async () => {
      const mockAccount = createAccount({ name: 'Checking', kind: 'asset', currency: 'USD' });
      getAllDocuments.mockResolvedValue([mockAccount]);
      deleteDocument.mockResolvedValue({ ok: true, id: mockAccount._id, rev: '1-abc' });
      const result = await deleteAccount(mockAccount._id, '1-abc');
      expect(deleteDocument).toHaveBeenCalledWith(mockAccount._id, '1-abc');
      expect(result).toEqual({ ok: true, id: mockAccount._id, rev: '1-abc' });
    });

    it('throws when transactions reference the account', async () => {
      const mockAccount = createAccount({ name: 'Checking', kind: 'asset', currency: 'USD' });
      getAllDocuments.mockResolvedValue([mockAccount]);
      getAllDocuments.mockImplementationOnce(async () => [mockAccount]);
      getAllDocuments.mockImplementationOnce(async () => [
        { _id: 'tx1', postings: [{ account: 'Checking', amount: 100, currency: 'USD' }] },
      ]);
      await expect(deleteAccount(mockAccount._id, '1-abc'))
        .rejects.toThrow('Cannot delete account: transactions reference this account');
    });
  });
});