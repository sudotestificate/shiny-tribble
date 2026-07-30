import { describe, it, expect, vi, beforeEach } from 'vitest';
import { exportJournal, importJournal } from '../utils/hledger.js';

vi.mock('../services/pouchdb.js', () => ({
  getAllDocuments: vi.fn(),
}));

import { getAllDocuments } from '../services/pouchdb.js';

const sampleAccounts = [
  {
    _id: 'account_checking_account_1',
    type: 'account',
    name: 'Checking Account',
    parent_account: null,
    kind: 'asset',
    currency: 'USD',
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    _id: 'account_salary_income_2',
    type: 'account',
    name: 'Salary Income',
    parent_account: null,
    kind: 'income',
    currency: 'USD',
    created_at: '2026-01-01T00:00:00Z',
  },
];

const sampleTransactions = [
  {
    _id: 'transaction_20260115_1',
    type: 'transaction',
    date: '2026-01-15',
    description: 'Monthly salary deposit',
    postings: [
      { account: 'Checking Account', amount: 4500.00, currency: 'USD' },
      { account: 'Salary Income', amount: -4500.00, currency: 'USD' },
    ],
    source_journal: 'default',
    hledger_validated: true,
  },
  {
    _id: 'transaction_20260120_2',
    type: 'transaction',
    date: '2026-01-20',
    description: 'Grocery shopping',
    postings: [
      { account: 'Checking Account', amount: -85.50, currency: 'USD' },
      { account: 'Expenses:Groceries', amount: 85.50, currency: 'USD' },
    ],
    source_journal: 'default',
    hledger_validated: true,
  },
  {
    _id: 'transaction_20260125_3',
    type: 'transaction',
    date: '2026-01-25',
    description: 'Rent payment',
    postings: [
      { account: 'Checking Account', amount: -1200.00, currency: 'USD' },
      { account: 'Expenses:Rent', amount: 1200.00, currency: 'USD' },
    ],
    source_journal: 'work_expenses',
    hledger_validated: true,
  },
];

describe('importJournal', () => {
  it('parses a simple journal with one transaction', () => {
    const content = '2026-01-15 Monthly salary deposit\n  Checking Account  100.00 USD\n  Salary Income    -100.00 USD\n';
    const result = importJournal(content, 'default');

    expect(result.accounts).toBeInstanceOf(Array);
    expect(result.transactions).toBeInstanceOf(Array);
    expect(result.transactions.length).toBe(1);
  });

  it('parses transaction date and description correctly', () => {
    const content = '2026-01-15 Monthly salary deposit\n  Checking Account  100.00 USD\n  Salary Income    -100.00 USD\n';
    const result = importJournal(content, 'default');
    const tx = result.transactions[0];

    expect(tx.date).toBe('2026-01-15');
    expect(tx.description).toBe('Monthly salary deposit');
    expect(tx.source_journal).toBe('default');
  });

  it('parses YYYY/MM/DD date format', () => {
    const content = '2026/01/15 Transaction with slash dates\n  Checking Account  100.00 USD\n  Salary Income    -100.00 USD\n';
    const result = importJournal(content, 'default');
    const tx = result.transactions[0];

    expect(tx.date).toBe('2026-01-15');
  });

  it('parses postings with suffix commodity notation', () => {
    const content = '2026-01-15 Test\n  Checking Account  100.00 USD\n  Salary Income    -100.00 USD\n';
    const result = importJournal(content, 'default');
    const tx = result.transactions[0];

    expect(tx.postings.length).toBe(2);
    expect(tx.postings[0].account).toBe('Checking Account');
    expect(tx.postings[0].amount).toBe(100.00);
    expect(tx.postings[0].currency).toBe('USD');
    expect(tx.postings[1].amount).toBe(-100.00);
  });

  it('parses postings with prefix $ commodity notation', () => {
    const content = '2026-01-15 Test\n  Checking Account  $100.00\n  Salary Income    -$100.00\n';
    const result = importJournal(content, 'default');
    const tx = result.transactions[0];

    expect(tx.postings[0].amount).toBe(100.00);
    expect(tx.postings[0].currency).toBe('USD');
  });

  it('parses negative amounts correctly', () => {
    const content = '2026-01-15 Test\n  Expenses:Groceries  85.50 USD\n  Checking Account   -85.50 USD\n';
    const result = importJournal(content, 'default');
    const tx = result.transactions[0];

    expect(tx.postings[0].amount).toBe(85.50);
    expect(tx.postings[1].amount).toBe(-85.50);
  });

  it('parses account hierarchies and creates parent accounts', () => {
    const content = 'account Assets:Bank:Checking\n  currency: USD\n\naccount Expenses:Groceries\n  currency: USD\n\n2026-01-15 Grocery shopping\n  Expenses:Groceries  85.50 USD\n  Assets:Bank:Checking  -85.50 USD\n';
    const result = importJournal(content, 'default');

    expect(result.accounts.length).toBeGreaterThanOrEqual(3);
    const groceryAccount = result.accounts.find((a) => a.name === 'Groceries');
    expect(groceryAccount).toBeDefined();
    expect(groceryAccount.parent_account).toBe('Expenses');
  });

  it('sets parent_account to the immediate parent name for 3+ level account paths', () => {
    const content = 'account Assets:Bank:Checking\n  currency: USD\n';
    const result = importJournal(content, 'default');

    const checkingAccount = result.accounts.find((a) => a.name === 'Checking');
    expect(checkingAccount).toBeDefined();
    expect(checkingAccount.parent_account).toBe('Bank');

    const bankAccount = result.accounts.find((a) => a.name === 'Bank');
    expect(bankAccount).toBeDefined();
    expect(bankAccount.parent_account).toBe('Assets');
  });

  it('parses account properties (currency, description, kind)', () => {
    const content = 'account Assets:Checking\n  description: My checking account\n  currency: EUR\n  kind: asset\n';
    const result = importJournal(content, 'default');

    const account = result.accounts.find((a) => a.name === 'Checking');
    expect(account).toBeDefined();
    expect(account.currency).toBe('EUR');
    expect(account.description).toBe('My checking account');
    expect(account.kind).toBe('asset');
  });

  it('ignores comment lines', () => {
    const content = '; This is a comment\n# This is also a comment\n2026-01-15 Transaction without comments in it\n  Checking Account  100.00 USD\n  Salary Income    -100.00 USD\n';
    const result = importJournal(content, 'default');

    expect(result.transactions.length).toBe(1);
  });

  it('ignores empty lines', () => {
    const content = '\n\n2026-01-15 Transaction with blank lines around it\n  Checking Account  100.00 USD\n  Salary Income    -100.00 USD\n\n';
    const result = importJournal(content, 'default');

    expect(result.transactions.length).toBe(1);
  });

  it('handles a journal with only account declarations and no transactions', () => {
    const content = 'account Assets:Checking\n  currency: USD\n\naccount Income:Salary\n  currency: USD\n';
    const result = importJournal(content, 'default');

    expect(result.accounts.length).toBe(4);
    expect(result.transactions.length).toBe(0);
  });

  it('handles an empty journal', () => {
    const result = importJournal('', 'default');

    expect(result.accounts.length).toBe(0);
    expect(result.transactions.length).toBe(0);
  });

  it('parses multiple transactions in one file', () => {
    const content = '2026-01-15 Salary deposit\n  Checking Account  4500.00 USD\n  Salary Income    -4500.00 USD\n\n2026-01-20 Grocery shopping\n  Groceries  85.50 USD\n  Checking Account  -85.50 USD\n';
    const result = importJournal(content, 'default');

    expect(result.transactions.length).toBe(2);
    expect(result.transactions[0].description).toBe('Salary deposit');
    expect(result.transactions[1].description).toBe('Grocery shopping');
  });

  it('assigns source_journal to all parsed transactions', () => {
    const content = '2026-01-15 Transaction one\n  Checking Account  100.00 USD\n  Salary Income    -100.00 USD\n';
    const result = importJournal(content, 'my_journal');

    expect(result.transactions[0].source_journal).toBe('my_journal');
  });

  it('normalizes account names to PouchDB document format', () => {
    const content = 'account Assets:Checking\n  currency: USD\n';
    const result = importJournal(content, 'default');

    const account = result.accounts[0];
    expect(account.type).toBe('account');
    expect(account._id).toMatch(/^account_/);
    expect(account.name).toBe('Checking');
  });

  it('infers account kind from path prefix', () => {
    const content = 'account Expenses:Groceries\n  currency: USD\n\naccount Income:Salary\n  currency: USD\n\naccount Liabilities:Credit Card\n  currency: USD\n\naccount Equity:Capital\n  currency: USD\n';
    const result = importJournal(content, 'default');

    const groceries = result.accounts.find((a) => a.name === 'Groceries');
    const salary = result.accounts.find((a) => a.name === 'Salary');
    const creditCard = result.accounts.find((a) => a.name === 'Credit Card');
    const capital = result.accounts.find((a) => a.name === 'Capital');

    expect(groceries.kind).toBe('expense');
    expect(salary.kind).toBe('income');
    expect(creditCard.kind).toBe('liability');
    expect(capital.kind).toBe('equity');
  });

  it('handles accounts with spaces in the name', () => {
    const content = '2026-01-15 Transaction\n  Checking Account  100.00 USD\n  Salary Income    -100.00 USD\n';
    const result = importJournal(content, 'default');

    expect(result.transactions[0].postings[0].account).toBe('Checking Account');
  });

  it('handles amounts without explicit commodity', () => {
    const content = '2026-01-15 Transaction no commodity\n  Checking Account  100.00\n  Salary Income    -100.00\n';
    const result = importJournal(content, 'default');
    const tx = result.transactions[0];

    expect(tx.postings[0].amount).toBe(100.00);
    expect(tx.postings[0].currency).toBe('USD');
  });

  it('validates balanced transactions with hledger_validated flag', () => {
    const content = '2026-01-15 Balanced transaction\n  Checking Account  100.00 USD\n  Salary Income    -100.00 USD\n';
    const result = importJournal(content, 'default');
    const tx = result.transactions[0];

    expect(tx.hledger_validated).toBe(true);
  });

  it('marks unbalanced transactions as not validated', () => {
    const content = '2026-01-15 Unbalanced transaction\n  Checking Account  100.00 USD\n  Salary Income    -50.00 USD\n';
    const result = importJournal(content, 'default');
    const tx = result.transactions[0];

    expect(tx.hledger_validated).toBe(false);
  });
});

describe('exportJournal', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('generates account declarations', async () => {
    getAllDocuments.mockImplementation((docType) => {
      if (docType === 'account') return Promise.resolve(sampleAccounts);
      return Promise.resolve([]);
    });

    const result = await exportJournal('default');

    expect(result).toContain('account Checking Account');
    expect(result).toContain('account Salary Income');
  });

  it('filters transactions by journalId', async () => {
    getAllDocuments.mockImplementation((docType) => {
      if (docType === 'account') return Promise.resolve(sampleAccounts);
      if (docType === 'transaction') return Promise.resolve(sampleTransactions.filter((tx) => tx.source_journal === 'default'));
      return Promise.resolve([]);
    });

    const result = await exportJournal('default');

    expect(result).toContain('Monthly salary deposit');
    expect(result).toContain('Grocery shopping');
    expect(result).not.toContain('Rent payment');
  });

  it('includes negative amounts in transactions', async () => {
    getAllDocuments.mockImplementation((docType) => {
      if (docType === 'account') return Promise.resolve(sampleAccounts);
      if (docType === 'transaction') return Promise.resolve(sampleTransactions.filter((tx) => tx.source_journal === 'default'));
      return Promise.resolve([]);
    });

    const result = await exportJournal('default');

    expect(result).toContain('-85.50');
  });

  it('includes commodity notation in amounts', async () => {
    getAllDocuments.mockImplementation((docType) => {
      if (docType === 'account') return Promise.resolve(sampleAccounts);
      if (docType === 'transaction') return Promise.resolve(sampleTransactions.filter((tx) => tx.source_journal === 'default'));
      return Promise.resolve([]);
    });

    const result = await exportJournal('default');

    expect(result).toContain('USD');
  });

  it('generates a valid hledger journal format with date and account lines', async () => {
    getAllDocuments.mockImplementation((docType) => {
      if (docType === 'account') return Promise.resolve(sampleAccounts);
      if (docType === 'transaction') return Promise.resolve(sampleTransactions.filter((tx) => tx.source_journal === 'default'));
      return Promise.resolve([]);
    });

    const result = await exportJournal('default');

    expect(result).toContain('account ');
    expect(result).toMatch(/\d{4}-\d{2}-\d{2}/);
  });

  it('returns empty output when no accounts exist', async () => {
    getAllDocuments.mockImplementation((docType) => Promise.resolve([]));

    const result = await exportJournal('default');

    expect(result).toBe('');
  });

  it('excludes transactions from other journals', async () => {
    getAllDocuments.mockImplementation((docType) => {
      if (docType === 'account') return Promise.resolve(sampleAccounts);
      if (docType === 'transaction') return Promise.resolve(sampleTransactions.filter((tx) => tx.source_journal === 'work_expenses'));
      return Promise.resolve([]);
    });

    const result = await exportJournal('work_expenses');

    expect(result).toContain('Rent payment');
    expect(result).not.toContain('Monthly salary deposit');
  });

  it('generates properly indented posting lines', async () => {
    getAllDocuments.mockImplementation((docType) => {
      if (docType === 'account') return Promise.resolve(sampleAccounts);
      if (docType === 'transaction') return Promise.resolve(sampleTransactions.filter((tx) => tx.source_journal === 'default'));
      return Promise.resolve([]);
    });

    const result = await exportJournal('default');

    expect(result).toContain('  Checking Account');
  });
});