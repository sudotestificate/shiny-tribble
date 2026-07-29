import { describe, it, expect } from 'vitest';
import { validateAccount, createAccount, ACCOUNT_KINDS } from '../schema/account.js';
import { validateTransaction, createTransaction } from '../schema/transaction.js';
import { validateJournal, createJournal } from '../schema/journal.js';
import { seedAccounts, seedTransactions, seedJournals, validateAllSeedData } from '../schema/seed.js';

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

  it('rejects an account missing created_at', () => {
    const account = createAccount({ name: 'Checking', kind: 'asset', currency: 'USD' });
    account.type = 'account';
    delete account.created_at;
    const errors = validateAccount(account);
    expect(errors.some(e => e.includes('created_at'))).toBe(true);
  });

  it('accepts all valid ACCOUNT_KINDS', () => {
    ACCOUNT_KINDS.forEach(kind => {
      const account = createAccount({ name: `Test ${kind}`, kind, currency: 'USD' });
      const errors = validateAccount(account);
      expect(errors).toEqual([]);
    });
  });
});

describe('Transaction schema', () => {
  it('validates a valid transaction with balanced postings', () => {
    const tx = createTransaction({
      date: '2026-01-15',
      description: 'Test',
      postings: [
        { account: 'Checking', amount: 100, currency: 'USD' },
        { account: 'Income', amount: -100, currency: 'USD' },
      ],
    });
    const errors = validateTransaction(tx);
    expect(errors).toEqual([]);
  });

  it('rejects a transaction with unbalanced postings', () => {
    const tx = createTransaction({
      date: '2026-01-15',
      description: 'Unbalanced',
      postings: [
        { account: 'Checking', amount: 100, currency: 'USD' },
        { account: 'Income', amount: -50, currency: 'USD' },
      ],
    });
    const errors = validateTransaction(tx);
    expect(errors.some(e => e.includes('balance'))).toBe(true);
  });

  it('rejects a transaction missing date', () => {
    const tx = createTransaction({
      date: '',
      description: 'Test',
      postings: [
        { account: 'Checking', amount: 100, currency: 'USD' },
        { account: 'Income', amount: -100, currency: 'USD' },
      ],
    });
    const errors = validateTransaction(tx);
    expect(errors.some(e => e.includes('date'))).toBe(true);
  });

  it('rejects a transaction with empty postings', () => {
    const tx = createTransaction({
      date: '2026-01-15',
      description: 'No postings',
      postings: [],
    });
    const errors = validateTransaction(tx);
    expect(errors.some(e => e.includes('postings'))).toBe(true);
  });

  it('rejects a transaction with invalid posting amount', () => {
    const tx = createTransaction({
      date: '2026-01-15',
      description: 'Bad amount',
      postings: [
        { account: 'Checking', amount: 'not_a_number', currency: 'USD' },
        { account: 'Income', amount: -100, currency: 'USD' },
      ],
    });
    const errors = validateTransaction(tx);
    expect(errors.some(e => e.includes('amount'))).toBe(true);
  });

  it('rejects a transaction with invalid posting currency', () => {
    const tx = createTransaction({
      date: '2026-01-15',
      description: 'Bad currency',
      postings: [
        { account: 'Checking', amount: 100, currency: '' },
        { account: 'Income', amount: -100, currency: '' },
      ],
    });
    const errors = validateTransaction(tx);
    expect(errors.some(e => e.includes('currency'))).toBe(true);
  });

  it('defaults hledger_validated to true when postings balance', () => {
    const tx = createTransaction({
      date: '2026-01-15',
      description: 'Auto validated',
      postings: [
        { account: 'Checking', amount: 100, currency: 'USD' },
        { account: 'Income', amount: -100, currency: 'USD' },
      ],
    });
    expect(tx.hledger_validated).toBe(true);
  });
});

describe('Journal schema', () => {
  it('validates a valid journal document', () => {
    const journal = createJournal({ name: 'default', file_path: '/path/to/journal.journal' });
    const errors = validateJournal(journal);
    expect(errors).toEqual([]);
  });

  it('rejects a journal missing name', () => {
    const journal = createJournal({ name: '', file_path: '/path/to/journal.journal' });
    const errors = validateJournal(journal);
    expect(errors.some(e => e.includes('name'))).toBe(true);
  });

  it('rejects a journal missing file_path', () => {
    const journal = createJournal({ name: 'default', file_path: '' });
    const errors = validateJournal(journal);
    expect(errors.some(e => e.includes('file_path'))).toBe(true);
  });

  it('rejects a journal missing created_at', () => {
    const journal = createJournal({ name: 'default', file_path: '/path/to/journal.journal' });
    delete journal.created_at;
    const errors = validateJournal(journal);
    expect(errors.some(e => e.includes('created_at'))).toBe(true);
  });

  it('rejects a journal missing updated_at', () => {
    const journal = createJournal({ name: 'default', file_path: '/path/to/journal.journal' });
    delete journal.updated_at;
    const errors = validateJournal(journal);
    expect(errors.some(e => e.includes('updated_at'))).toBe(true);
  });
});

describe('Seed data', () => {
  it('seed accounts are valid', () => {
    seedAccounts.forEach((account, index) => {
      const errors = validateAccount(account);
      expect(errors, `Account at index ${index} (${account.name}) has errors: ${errors.join(', ')}`).toEqual([]);
    });
  });

  it('seed transactions are valid', () => {
    seedTransactions.forEach((tx, index) => {
      const errors = validateTransaction(tx);
      expect(errors, `Transaction at index ${index} (${tx.description}) has errors: ${errors.join(', ')}`).toEqual([]);
    });
  });

  it('seed journals are valid', () => {
    seedJournals.forEach((journal, index) => {
      const errors = validateJournal(journal);
      expect(errors, `Journal at index ${index} (${journal.name}) has errors: ${errors.join(', ')}`).toEqual([]);
    });
  });

  it('validateAllSeedData returns overall valid result for all seed data', () => {
    const results = validateAllSeedData();
    expect(results.valid).toBe(true);
  });
});