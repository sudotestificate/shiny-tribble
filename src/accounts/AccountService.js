import { getAllDocuments, saveDocument, deleteDocument } from '../services/pouchdb';
import { validateAccount, createAccount, ACCOUNT_KINDS } from '../schema/account';

export async function getAccounts() {
  return getAllDocuments('account');
}

export async function getAccountById(id) {
  const accounts = await getAllDocuments('account');
  return accounts.find(a => a._id === id) || null;
}

export async function createAccountRecord(data) {
  const doc = createAccount(data);
  const errors = validateAccount(doc);
  if (errors.length > 0) {
    throw new Error(`Validation failed: ${errors.join('; ')}`);
  }
  return saveDocument(doc);
}

export async function updateAccount(id, data) {
  const existing = await getAccountById(id);
  if (!existing) {
    throw new Error('Account not found');
  }
  const updated = {
    ...existing,
    name: data.name ?? existing.name,
    kind: data.kind ?? existing.kind,
    parent_account: data.parent_account ?? existing.parent_account,
    currency: data.currency ?? existing.currency,
  };
  const errors = validateAccount(updated);
  if (errors.length > 0) {
    throw new Error(`Validation failed: ${errors.join('; ')}`);
  }
  return saveDocument(updated);
}

export async function deleteAccount(id, rev) {
  const account = await getAccountById(id);
  const transactions = await getAllDocuments('transaction');
  const accountName = account ? account.name : id;
  const hasReference = transactions.some(tx =>
    tx.postings && tx.postings.some(p => p.account === accountName)
  );
  if (hasReference) {
    throw new Error('Cannot delete account: transactions reference this account');
  }
  return deleteDocument(id, rev);
}

export function buildAccountTree(accounts) {
  const map = new Map();
  const roots = [];

  accounts.forEach(acc => {
    map.set(acc._id, { ...acc, children: [] });
  });

  accounts.forEach(acc => {
    const node = map.get(acc._id);
    if (acc.parent_account) {
      const parent = accounts.find(a => a.name === acc.parent_account);
      if (parent && map.has(parent._id)) {
        map.get(parent._id).children.push(node);
      } else {
        roots.push(node);
      }
    } else {
      roots.push(node);
    }
  });

  return roots;
}

export function calculateAccountBalance(accountId, transactions) {
  let balance = 0;
  transactions.forEach(tx => {
    if (!tx.postings) return;
    tx.postings.forEach(p => {
      if (p.account === accountId) {
        balance += p.amount;
      }
    });
  });
  return balance;
}

export function getAccountBalance(accountId, transactions) {
  return calculateAccountBalance(accountId, transactions);
}

export function getReferencingTransactions(accountId, transactions) {
  return transactions.filter(tx =>
    tx.postings && tx.postings.some(p => p.account === accountId)
  );
}

export { ACCOUNT_KINDS };