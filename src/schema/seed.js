import { createAccount } from './account.js';
import { createTransaction } from './transaction.js';
import { createJournal } from './journal.js';
import { validateAccount } from './account.js';
import { validateTransaction } from './transaction.js';
import { validateJournal } from './journal.js';

export const seedAccounts = [
  createAccount({
    name: 'Checking Account',
    kind: 'asset',
    currency: 'USD',
    parent_account: null,
  }),
  createAccount({
    name: 'Savings Account',
    kind: 'asset',
    currency: 'USD',
    parent_account: null,
  }),
  createAccount({
    name: 'Credit Card',
    kind: 'liability',
    currency: 'USD',
    parent_account: null,
  }),
  createAccount({
    name: 'Salary Income',
    kind: 'income',
    currency: 'USD',
    parent_account: null,
  }),
  createAccount({
    name: 'Groceries',
    kind: 'expense',
    currency: 'USD',
    parent_account: null,
  }),
  createAccount({
    name: 'Rent',
    kind: 'expense',
    currency: 'USD',
    parent_account: null,
  }),
  createAccount({
    name: 'Utilities',
    kind: 'expense',
    currency: 'USD',
    parent_account: null,
  }),
  createAccount({
    name: 'Equity Capital',
    kind: 'equity',
    currency: 'USD',
    parent_account: null,
  }),
];

export const seedTransactions = [
  createTransaction({
    date: '2026-01-15',
    description: 'Monthly salary deposit',
    postings: [
      { account: 'Checking Account', amount: 4500.00, currency: 'USD' },
      { account: 'Salary Income', amount: -4500.00, currency: 'USD' },
    ],
    source_journal: 'default',
    hledger_validated: true,
  }),
  createTransaction({
    date: '2026-01-20',
    description: 'Grocery shopping',
    postings: [
      { account: 'Groceries', amount: 85.50, currency: 'USD' },
      { account: 'Checking Account', amount: -85.50, currency: 'USD' },
    ],
    source_journal: 'default',
    hledger_validated: true,
  }),
  createTransaction({
    date: '2026-01-25',
    description: 'Monthly rent payment',
    postings: [
      { account: 'Rent', amount: 1200.00, currency: 'USD' },
      { account: 'Checking Account', amount: -1200.00, currency: 'USD' },
    ],
    source_journal: 'default',
    hledger_validated: true,
  }),
  createTransaction({
    date: '2026-01-28',
    description: 'Electricity bill',
    postings: [
      { account: 'Utilities', amount: 120.00, currency: 'USD' },
      { account: 'Checking Account', amount: -120.00, currency: 'USD' },
    ],
    source_journal: 'default',
    hledger_validated: true,
  }),
  createTransaction({
    date: '2026-02-01',
    description: 'Salary deposit February',
    postings: [
      { account: 'Checking Account', amount: 4500.00, currency: 'USD' },
      { account: 'Salary Income', amount: -4500.00, currency: 'USD' },
    ],
    source_journal: 'default',
    hledger_validated: true,
  }),
];

export const seedJournals = [
  createJournal({
    name: 'default',
    file_path: '/home/user/hledger/default.journal',
  }),
  createJournal({
    name: 'work_expenses',
    file_path: '/home/user/hledger/work_expenses.journal',
  }),
];

export const seedData = {
  accounts: seedAccounts,
  transactions: seedTransactions,
  journals: seedJournals,
};

export function validateAllSeedData() {
  const results = { accounts: [], transactions: [], journals: [], valid: true };

  seedAccounts.forEach((account, index) => {
    const errors = validateAccount(account);
    results.accounts.push({ index, _id: account._id, valid: errors.length === 0, errors });
    if (errors.length > 0) results.valid = false;
  });

  results.transactions = seedTransactions.map((tx, index) => {
    const errors = validateTransaction(tx);
    const valid = errors.length === 0;
    if (!valid) results.valid = false;
    return { index, _id: tx._id, valid, errors };
  });

  results.journals = seedJournals.map((journal, index) => {
    const errors = validateJournal(journal);
    const valid = errors.length === 0;
    if (!valid) results.valid = false;
    return { index, _id: journal._id, valid, errors };
  });

  return results;
}