import { describe, it, expect, vi, beforeEach } from 'vitest';
import { validateTransaction, createTransaction } from '../schema/transaction';
import {
  getTransactions,
  getTransactionById,
  createTransactionRecord,
  updateTransaction,
  deleteTransaction,
  calculateTransactionBalance,
  isTransactionBalanced,
} from '../transactions/TransactionService';
import { getAllDocuments, saveDocument, deleteDocument } from '../services/pouchdb';

vi.mock('../services/pouchdb.js', () => ({
  getAllDocuments: vi.fn(),
  saveDocument: vi.fn(),
  deleteDocument: vi.fn(),
}));

describe('Transaction schema', () => {
  describe('validateTransaction', () => {
    it('validates a valid transaction document', () => {
      const doc = createTransaction({
        date: '2026-01-15',
        description: ' groceries',
        postings: [
          { account: 'Expenses:Food', amount: -50, currency: 'USD' },
          { account: 'Assets:Checking', amount: 50, currency: 'USD' },
        ],
      });
      const errors = validateTransaction(doc);
      expect(errors).toEqual([]);
    });

    it('rejects a transaction missing _id', () => {
      const errors = validateTransaction({
        type: 'transaction',
        date: '2026-01-15',
        postings: [
          { account: 'Expenses:Food', amount: -50, currency: 'USD' },
          { account: 'Assets:Checking', amount: 50, currency: 'USD' },
        ],
      });
      expect(errors).toContainEqual(expect.stringMatching(/Missing or invalid _id/));
    });

    it('rejects a transaction missing date', () => {
      const errors = validateTransaction({
        _id: 'tx_20260115_1234567890',
        type: 'transaction',
        postings: [
          { account: 'Expenses:Food', amount: -50, currency: 'USD' },
          { account: 'Assets:Checking', amount: 50, currency: 'USD' },
        ],
      });
      expect(errors).toContainEqual(expect.stringMatching(/Missing or invalid date/));
    });

    it('rejects unbalanced postings', () => {
      const doc = createTransaction({
        date: '2026-01-15',
        description: 'groceries',
        postings: [
          { account: 'Expenses:Food', amount: -50, currency: 'USD' },
          { account: 'Assets:Checking', amount: 40, currency: 'USD' },
        ],
      });
      const errors = validateTransaction(doc);
      expect(errors.some(e => e.includes('Postings must balance'))).toBe(true);
    });

    it('rejects a transaction with invalid type', () => {
      const errors = validateTransaction({
        _id: 'tx_20260115_1234567890',
        type: 'account',
        date: '2026-01-15',
        postings: [
          { account: 'Expenses:Food', amount: -50, currency: 'USD' },
          { account: 'Assets:Checking', amount: 50, currency: 'USD' },
        ],
      });
      expect(errors.some(e => e.includes("Invalid type: expected 'transaction'"))).toBe(true);
    });
  });

  describe('createTransaction', () => {
    it('creates a doc with correct fields', () => {
      const doc = createTransaction({
        date: '2026-01-15',
        description: 'groceries',
        postings: [
          { account: 'Expenses:Food', amount: -50, currency: 'USD' },
          { account: 'Assets:Checking', amount: 50, currency: 'USD' },
        ],
      });
      expect(doc.type).toBe('transaction');
      expect(doc.date).toBe('2026-01-15');
      expect(doc.description).toBe('groceries');
      expect(doc.postings).toHaveLength(2);
      expect(doc._id).toMatch(/^transaction_/);
    });

    it('auto-validates balanced postings with hledger_validated true', () => {
      const doc = createTransaction({
        date: '2026-01-15',
        description: 'groceries',
        postings: [
          { account: 'Expenses:Food', amount: -50, currency: 'USD' },
          { account: 'Assets:Checking', amount: 50, currency: 'USD' },
        ],
      });
      expect(doc.hledger_validated).toBe(true);
    });

    it('sets hledger_validated false for unbalanced postings', () => {
      const doc = createTransaction({
        date: '2026-01-15',
        description: 'groceries',
        postings: [
          { account: 'Expenses:Food', amount: -50, currency: 'USD' },
          { account: 'Assets:Checking', amount: 40, currency: 'USD' },
        ],
      });
      expect(doc.hledger_validated).toBe(false);
    });
  });
});

describe('TransactionService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('calculateTransactionBalance', () => {
    it('sums postings correctly', () => {
      const postings = [
        { account: 'Expenses:Food', amount: -50, currency: 'USD' },
        { account: 'Assets:Checking', amount: 50, currency: 'USD' },
      ];
      expect(calculateTransactionBalance(postings)).toBe(0);
    });

    it('returns 0 for empty array', () => {
      expect(calculateTransactionBalance([])).toBe(0);
    });

    it('handles non-array input', () => {
      expect(calculateTransactionBalance(null)).toBe(0);
      expect(calculateTransactionBalance(undefined)).toBe(0);
    });

    it('handles postings with zero amounts', () => {
      const postings = [
        { account: 'Assets:Checking', amount: 0, currency: 'USD' },
        { account: 'Income', amount: 0, currency: 'USD' },
      ];
      expect(calculateTransactionBalance(postings)).toBe(0);
    });
  });

  describe('isTransactionBalanced', () => {
    it('returns true for balanced postings', () => {
      const postings = [
        { account: 'Expenses:Food', amount: -50, currency: 'USD' },
        { account: 'Assets:Checking', amount: 50, currency: 'USD' },
      ];
      expect(isTransactionBalanced(postings)).toBe(true);
    });

    it('returns false for unbalanced postings', () => {
      const postings = [
        { account: 'Expenses:Food', amount: -50, currency: 'USD' },
        { account: 'Assets:Checking', amount: 40, currency: 'USD' },
      ];
      expect(isTransactionBalanced(postings)).toBe(false);
    });

    it('returns true for empty array', () => {
      expect(isTransactionBalanced([])).toBe(true);
    });
  });

  describe('getTransactionById', () => {
    it('returns a transaction when found by _id', async () => {
      const mockTransactions = [
        { _id: 'tx1', date: '2026-01-15', postings: [] },
        { _id: 'tx2', date: '2026-01-16', postings: [] },
      ];
      getAllDocuments.mockResolvedValue(mockTransactions);
      const result = await getTransactionById('tx2');
      expect(result).toEqual({ _id: 'tx2', date: '2026-01-16', postings: [] });
      expect(getAllDocuments).toHaveBeenCalledWith('transaction');
    });

    it('returns null when no transaction matches the id', async () => {
      getAllDocuments.mockResolvedValue([]);
      const result = await getTransactionById('nonexistent');
      expect(result).toBeNull();
    });
  });

  describe('createTransactionRecord', () => {
    it('validates and saves a valid transaction', async () => {
      const validDoc = {
        _id: 'tx_20260115_1234567890',
        type: 'transaction',
        date: '2026-01-15',
        description: 'groceries',
        postings: [
          { account: 'Expenses:Food', amount: -50, currency: 'USD' },
          { account: 'Assets:Checking', amount: 50, currency: 'USD' },
        ],
      };
      getAllDocuments.mockResolvedValue([]);
      saveDocument.mockResolvedValue({ ok: true, id: validDoc._id, rev: '1-abc' });

      const result = await createTransactionRecord(validDoc);

      expect(saveDocument).toHaveBeenCalledTimes(1);
      expect(saveDocument).toHaveBeenCalledWith(validDoc);
      expect(result).toEqual({ ok: true, id: validDoc._id, rev: '1-abc' });
    });

    it('throws when validation fails', async () => {
      const invalidDoc = {
        _id: 'tx_20260115_1234567890',
        type: 'transaction',
        date: '2026-01-15',
        postings: [
          { account: 'Expenses:Food', amount: -50, currency: 'USD' },
          { account: 'Assets:Checking', amount: 40, currency: 'USD' },
        ],
      };
      getAllDocuments.mockResolvedValue([]);

      await expect(createTransactionRecord(invalidDoc))
        .rejects.toThrow('Validation failed');

      expect(saveDocument).not.toHaveBeenCalled();
    });
  });

  describe('updateTransaction', () => {
    it('merges fields and saves an existing transaction', async () => {
      const existingTx = {
        _id: 'tx1',
        type: 'transaction',
        date: '2026-01-15',
        description: 'groceries',
        postings: [
          { account: 'Expenses:Food', amount: -50, currency: 'USD' },
          { account: 'Assets:Checking', amount: 50, currency: 'USD' },
        ],
        source_journal: null,
      };
      getAllDocuments.mockResolvedValue([existingTx]);
      saveDocument.mockResolvedValue({ ok: true, id: 'tx1', rev: '2-def' });

      const result = await updateTransaction('tx1', { description: 'updated groceries' });

      expect(saveDocument).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ ok: true, id: 'tx1', rev: '2-def' });
    });

    it('throws when transaction not found', async () => {
      getAllDocuments.mockResolvedValue([]);
      await expect(updateTransaction('nonexistent', { description: 'new' }))
        .rejects.toThrow('Transaction not found');
      expect(saveDocument).not.toHaveBeenCalled();
    });

    it('throws when validation fails after merge', async () => {
      const existingTx = {
        _id: 'tx1',
        type: 'transaction',
        date: '2026-01-15',
        description: 'groceries',
        postings: [
          { account: 'Expenses:Food', amount: -50, currency: 'USD' },
          { account: 'Assets:Checking', amount: 50, currency: 'USD' },
        ],
        source_journal: null,
      };
      getAllDocuments.mockResolvedValue([existingTx]);

      await expect(updateTransaction('tx1', { date: 'invalid-date' }))
        .rejects.toThrow('Validation failed');

      expect(saveDocument).not.toHaveBeenCalled();
    });
  });

  describe('deleteTransaction', () => {
    it('deletes a transaction by id and rev', async () => {
      deleteDocument.mockResolvedValue({ ok: true, id: 'tx1', rev: '1-abc' });
      const result = await deleteTransaction('tx1', '1-abc');
      expect(deleteDocument).toHaveBeenCalledWith('tx1', '1-abc');
      expect(result).toEqual({ ok: true, id: 'tx1', rev: '1-abc' });
    });
  });
});
