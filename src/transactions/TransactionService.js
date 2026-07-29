import { getAllDocuments, saveDocument, deleteDocument } from '../services/pouchdb';
import { validateTransaction, createTransaction } from '../schema/transaction';

export async function getTransactions(journalName = null) {
  const all = await getAllDocuments('transaction');
  if (journalName) {
    return all.filter(t => t.source_journal === journalName);
  }
  return all;
}

export async function getTransactionById(id) {
  const transactions = await getAllDocuments('transaction');
  return transactions.find(t => t._id === id) || null;
}

export async function createTransactionRecord(data) {
  const doc = createTransaction(data);
  const errors = validateTransaction(doc);
  if (errors.length > 0) {
    throw new Error(`Validation failed: ${errors.join('; ')}`);
  }
  return saveDocument(doc);
}

export async function updateTransaction(id, data) {
  const existing = await getTransactionById(id);
  if (!existing) {
    throw new Error('Transaction not found');
  }
  const updated = {
    ...existing,
    date: data.date ?? existing.date,
    description: data.description ?? existing.description,
    postings: data.postings ?? existing.postings,
    source_journal: data.source_journal ?? existing.source_journal,
    hledger_validated: data.hledger_validated ?? existing.hledger_validated,
  };
  const errors = validateTransaction(updated);
  if (errors.length > 0) {
    throw new Error(`Validation failed: ${errors.join('; ')}`);
  }
  return saveDocument(updated);
}

export async function deleteTransaction(id, rev) {
  return deleteDocument(id, rev);
}

export function calculateTransactionBalance(postings) {
  if (!Array.isArray(postings)) return 0;
  return postings.reduce((sum, p) => sum + (p.amount || 0), 0);
}

export function isTransactionBalanced(postings) {
  return Math.abs(calculateTransactionBalance(postings)) < 0.001;
}