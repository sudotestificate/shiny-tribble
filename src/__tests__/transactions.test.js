import { describe, it, expect, vi, beforeEach } from 'vitest';
import { validateTransaction, createTransaction } from '../schema/transaction';
import { getTransactionById, createTransactionRecord, updateTransaction, deleteTransaction, calculateTransactionBalance, isTransactionBalanced } from '../transactions/TransactionService';
import { getAllDocuments, saveDocument, deleteDocument } from '../services/pouchdb';

vi.mock('../services/pouchdb.js', () => ({
  getAllDocuments: vi.fn(),
  saveDocument: vi.fn(),
  deleteDocument: vi.fn(),
}));

describe('Transaction schema', () => {
  it('validates a valid transaction document', () => {
    const tx = createTransaction({
      date: '2026-01-15',
      description: 'Test transaction',
      postings: [
        { account: 'Checking', amount: 100, currency: 'USD' },
        { account: 'Income', amount: -100, currency: 'USD' },
      ],
    });
    const errors = validateTransaction(tx);
    expect(errors).toEqual([]);
  });

  it('rejects a transaction missing type', () => {
    const tx = createTransaction({
      date: '2026-01-15',
      postings: [
        { account: 'Checking', amount: 100, currency: 'USD' },
        { account: 'Income', amount: -100, currency: 'USD' },
      ],
    });
    tx.type = 'invalid';
    const errors = validateTransaction(tx);
    expect(errors).toContainEqual(expect.stringMatching(/Invalid type/));
  });

  it('rejects a transaction missing _id', () => {
    const tx = createTransaction({
      date: '2026-01-15',
      postings: [
        { account: 'Checking', amount: 100, currency: 'USD' },
        { account: 'Income', amount: -100, currency: 'USD' },
      ],
    });
    delete tx._id;
    const errors = validateTransaction(tx);
    expect(errors.some(e => e.includes('_id'))).toBe(true);
  });

  it('rejects a transaction missing date', () => {
    const tx = createTransaction({
      date: '2026-01-15',
      postings: [
        { account: 'Checking', amount: 100, currency: 'USD' },
        { account: 'Income', amount: -100, currency: 'USD' },
      ],
    });
    delete tx.date;
    const errors = validateTransaction(tx);
    expect(errors.some(e => e.includes('date'))).toBe(true);
  });

  it('rejects a transaction with invalid date', () => {
    const tx = createTransaction({
      date: '2026-01-15',
      postings: [
        { account: 'Checking', amount: 100, currency: 'USD' },
        { account: 'Income', amount: -100, currency: 'USD' },
      ],
    });
    tx.date = 'not-a-date';
    const errors = validateTransaction(tx);
    expect(errors.some(e => e.includes('date'))).toBe(true);
  });

  it('rejects a transaction with invalid description', () => {
    const tx = createTransaction({
      date: '2026-01-15',
      postings: [
        { account: 'Checking', amount: 100, currency: 'USD' },
        { account: 'Income', amount: -100, currency: 'USD' },
      ],
    });
    tx.description = 123;
    const errors = validateTransaction(tx);
    expect(errors.some(e => e.includes('description'))).toBe(true);
  });

  it('rejects a transaction with missing postings', () => {
    const tx = createTransaction({
      date: '2026-01-15',
      postings: [
        { account: 'Checking', amount: 100, currency: 'USD' },
        { account: 'Income', amount: -100, currency: 'USD' },
      ],
    });
    delete tx.postings;
    const errors = validateTransaction(tx);
    expect(errors.some(e => e.includes('postings'))).toBe(true);
  });

  it('rejects a transaction with empty postings', () => {
    const tx = createTransaction({
      date: '2026-01-15',
      postings: [
        { account: 'Checking', amount: 100, currency: 'USD' },
        { account: 'Income', amount: -100, currency: 'USD' },
      ],
    });
    tx.postings = [];
    const errors = validateTransaction(tx);
    expect(errors.some(e => e.includes('postings'))).toBe(true);
  });

  it('rejects a transaction with unbalanced postings', () => {
    const tx = createTransaction({
      date: '2026-01-15',
      postings: [
        { account: 'Checking', amount: 100, currency: 'USD' },
        { account: 'Income', amount: -50, currency: 'USD' },
      ],
    });
    const errors = validateTransaction(tx);
    expect(errors.some(e => e.includes('balance'))).toBe(true);
  });

  it('rejects a transaction with invalid posting account', () => {
    const tx = createTransaction({
      date: '2026-01-15',
      postings: [
        { account: 'Checking', amount: 100, currency: 'USD' },
        { account: 'Income', amount: -100, currency: 'USD' },
      ],
    });
    tx.postings[0].account = 123;
    const errors = validateTransaction(tx);
    expect(errors.some(e => e.includes('account'))).toBe(true);
  });

  it('rejects a transaction with invalid posting amount', () => {
    const tx = createTransaction({
      date: '2026-01-15',
      postings: [
        { account: 'Checking', amount: 100, currency: 'USD' },
        { account: 'Income', amount: -100, currency: 'USD' },
      ],
    });
    tx.postings[0].amount = 'not-a-number';
    const errors = validateTransaction(tx);
    expect(errors.some(e => e.includes('amount'))).toBe(true);
  });

  it('rejects a transaction with invalid posting currency', () => {
    const tx = createTransaction({
      date: '2026-01-15',
      postings: [
        { account: 'Checking', amount: 100, currency: 'USD' },
        { account: 'Income', amount: -100, currency: 'USD' },
      ],
    });
    tx.postings[0].currency = '';
    const errors = validateTransaction(tx);
    expect(errors.some(e => e.includes('currency'))).toBe(true);
  });

  it('rejects a transaction with invalid source_journal', () => {
    const tx = createTransaction({
      date: '2026-01-15',
      postings: [
        { account: 'Checking', amount: 100, currency: 'USD' },
        { account: 'Income', amount: -100, currency: 'USD' },
      ],
    });
    tx.source_journal = 123;
    const errors = validateTransaction(tx);
    expect(errors.some(e => e.includes('source_journal'))).toBe(true);
  });

  it('rejects a transaction with invalid hledger_validated', () => {
    const tx = createTransaction({
      date: '2026-01-15',
      postings: [
        { account: 'Checking', amount: 100, currency: 'USD' },
        { account: 'Income', amount: -100, currency: 'USD' },
      ],
    });
    tx.hledger_validated = 'yes';
    const errors = validateTransaction(tx);
    expect(errors.some(e => e.includes('hledger_validated'))).toBe(true);
  });
});

describe('createTransaction', () => {
  it('creates a transaction document with correct fields', () => {
    const tx = createTransaction({
      date: '2026-01-15',
      description: 'Test transaction',
      postings: [
        { account: 'Checking', amount: 100, currency: 'USD' },
        { account: 'Income', amount: -100, currency: 'USD' },
      ],
      source_journal: 'main',
    });
    expect(tx.type).toBe('transaction');
    expect(tx.date).toBe('2026-01-15');
    expect(tx.description).toBe('Test transaction');
    expect(tx.postings).toHaveLength(2);
    expect(tx.source_journal).toBe('main');
    expect(tx._id).toMatch(/^transaction_\d+_\d+$/);
  });

  it('auto-sets hledger_validated to true for balanced postings', () => {
    const tx = createTransaction({
      date: '2026-01-15',
      postings: [
        { account: 'Checking', amount: 100, currency: 'USD' },
        { account: 'Income', amount: -100, currency: 'USD' },
      ],
    });
    expect(tx.hledger_validated).toBe(true);
  });

  it('auto-sets hledger_validated to false for unbalanced postings', () => {
    const tx = createTransaction({
      date: '2026-01-15',
      postings: [
        { account: 'Checking', amount: 100, currency: 'USD' },
        { account: 'Income', amount: -50, currency: 'USD' },
      ],
    });
    expect(tx.hledger_validated).toBe(false);
  });

  it('defaults description to empty string', () => {
    const tx = createTransaction({
      date: '2026-01-15',
      postings: [
        { account: 'Checking', amount: 100, currency: 'USD' },
        { account: 'Income', amount: -100, currency: 'USD' },
      ],
    });
    expect(tx.description).toBe('');
  });

  it('defaults source_journal to null', () => {
    const tx = createTransaction({
      date: '2026-01-15',
      postings: [
        { account: 'Checking', amount: 100, currency: 'USD' },
        { account: 'Income', amount: -100, currency: 'USD' },
      ],
    });
    expect(tx.source_journal).toBeNull();
  });
});

describe('calculateTransactionBalance', () => {
  it('sums postings correctly for a balanced transaction', () => {
    const postings = [
      { account: 'Checking', amount: 100, currency: 'USD' },
      { account: 'Income', amount: -100, currency: 'USD' },
    ];
    expect(calculateTransactionBalance(postings)).toBe(0);
  });

  it('sums postings correctly for an unbalanced transaction', () => {
    const postings = [
      { account: 'Checking', amount: 150, currency: 'USD' },
      { account: 'Income', amount: -100, currency: 'USD' },
    ];
    expect(calculateTransactionBalance(postings)).toBe(50);
  });

  it('returns 0 for an empty array', () => {
    expect(calculateTransactionBalance([])).toBe(0);
  });

  it('returns 0 when postings is not an array', () => {
    expect(calculateTransactionBalance(null)).toBe(0);
    expect(calculateTransactionBalance(undefined)).toBe(0);
    expect(calculateTransactionBalance('invalid')).toBe(0);
  });

  it('handles postings with missing amount by treating as 0', () => {
    const postings = [
      { account: 'Checking', amount: 100, currency: 'USD' },
      { account: 'Income', currency: 'USD' },
    ];
    expect(calculateTransactionBalance(postings)).toBe(100);
  });
});

describe('isTransactionBalanced', () => {
  it('returns true for balanced postings', () => {
    const postings = [
      { account: 'Checking', amount: 100, currency: 'USD' },
      { account: 'Income', amount: -100, currency: 'USD' },
    ];
    expect(isTransactionBalanced(postings)).toBe(true);
  });

  it('returns false for unbalanced postings', () => {
    const postings = [
      { account: 'Checking', amount: 100, currency: 'USD' },
      { account: 'Income', amount: -50, currency: 'USD' },
    ];
    expect(isTransactionBalanced(postings)).toBe(false);
  });

  it('returns true for empty postings', () => {
    expect(isTransactionBalanced([])).toBe(true);
  });

  it('returns true for postings that sum to zero with decimals', () => {
    const postings = [
      { account: 'Checking', amount: 0.1, currency: 'USD' },
      { account: 'Income', amount: -0.1, currency: 'USD' },
    ];
    expect(isTransactionBalanced(postings)).toBe(true);
  });
});

describe('TransactionService async CRUD', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getTransactionById', () => {
    it('returns a transaction when found by _id', async () => {
      const mockTx = createTransaction({
        date: '2026-01-15',
        postings: [
          { account: 'Checking', amount: 100, currency: 'USD' },
          { account: 'Income', amount: -100, currency: 'USD' },
        ],
      });
      getAllDocuments.mockResolvedValue([mockTx]);
      const result = await getTransactionById(mockTx._id);
      expect(result).toEqual(mockTx);
    });

    it('returns null when no transaction matches the id', async () => {
      getAllDocuments.mockResolvedValue([]);
      const result = await getTransactionById('nonexistent');
      expect(result).toBeNull();
    });
  });

  describe('createTransactionRecord', () => {
    it('creates and saves a valid transaction', async () => {
      const txData = {
        date: '2026-01-15',
        description: 'Test transaction',
        postings: [
          { account: 'Checking', amount: 100, currency: 'USD' },
          { account: 'Income', amount: -100, currency: 'USD' },
        ],
      };
      const mockTx = createTransaction(txData);
      getAllDocuments.mockResolvedValue([]);
      saveDocument.mockResolvedValue({ ok: true, id: mockTx._id, rev: '1-abc' });
      const result = await createTransactionRecord(txData);
      expect(saveDocument).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ ok: true, id: mockTx._id, rev: '1-abc' });
    });

    it('throws when validation fails for valid transaction structure', async () => {
      const txData = {
        date: '2026-01-15',
        postings: [
          { account: 'Checking', amount: 100, currency: 'USD' },
          { account: 'Income', amount: -50, currency: 'USD' },
        ],
      };
      getAllDocuments.mockResolvedValue([]);
      await expect(createTransactionRecord(txData))
        .rejects.toThrow('Validation failed');
    });

    it('throws when postings are missing', async () => {
      const txData = {
        date: '2026-01-15',
        description: 'No postings',
      };
      getAllDocuments.mockResolvedValue([]);
      await expect(createTransactionRecord(txData))
        .rejects.toThrow('Validation failed');
    });
  });

  describe('updateTransaction', () => {
    it('merges fields and saves an existing transaction', async () => {
      const mockTx = createTransaction({
        date: '2026-01-15',
        description: 'Original',
        postings: [
          { account: 'Checking', amount: 100, currency: 'USD' },
          { account: 'Income', amount: -100, currency: 'USD' },
        ],
      });
      getAllDocuments.mockResolvedValue([mockTx]);
      saveDocument.mockResolvedValue({ ok: true, id: mockTx._id, rev: '2-def' });
      const result = await updateTransaction(mockTx._id, { description: 'Updated' });
      expect(saveDocument).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ ok: true, id: mockTx._id, rev: '2-def' });
    });

    it('merges only provided fields, keeping existing values', async () => {
      const mockTx = createTransaction({
        date: '2026-01-15',
        description: 'Original',
        postings: [
          { account: 'Checking', amount: 100, currency: 'USD' },
          { account: 'Income', amount: -100, currency: 'USD' },
        ],
      });
      getAllDocuments.mockResolvedValue([mockTx]);
      saveDocument.mockResolvedValue({ ok: true, id: mockTx._id, rev: '2-def' });
      await updateTransaction(mockTx._id, { description: 'Updated' });
      const savedDoc = saveDocument.mock.calls[0][0];
      expect(savedDoc.date).toBe('2026-01-15');
      expect(savedDoc.description).toBe('Updated');
      expect(savedDoc.postings).toEqual(mockTx.postings);
    });

    it('throws when transaction not found', async () => {
      getAllDocuments.mockResolvedValue([]);
      await expect(updateTransaction('nonexistent', { description: 'New' }))
        .rejects.toThrow('Transaction not found');
    });

    it('throws when validation fails after merge', async () => {
      const mockTx = createTransaction({
        date: '2026-01-15',
        description: 'Original',
        postings: [
          { account: 'Checking', amount: 100, currency: 'USD' },
          { account: 'Income', amount: -100, currency: 'USD' },
        ],
      });
      getAllDocuments.mockResolvedValue([mockTx]);
      await expect(updateTransaction(mockTx._id, {
        postings: [
          { account: 'Checking', amount: 100, currency: 'USD' },
          { account: 'Income', amount: -50, currency: 'USD' },
        ],
      })).rejects.toThrow('Validation failed');
    });
  });

  describe('deleteTransaction', () => {
    it('deletes a transaction with the correct id and rev', async () => {
      deleteDocument.mockResolvedValue({ ok: true, id: 'tx1', rev: '1-abc' });
      const result = await deleteTransaction('tx1', '1-abc');
      expect(deleteDocument).toHaveBeenCalledWith('tx1', '1-abc');
      expect(result).toEqual({ ok: true, id: 'tx1', rev: '1-abc' });
    });
  });
});