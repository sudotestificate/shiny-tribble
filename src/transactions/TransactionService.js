import { getAllDocuments, saveDocument, deleteDocument } from '../services/pouchdb';
import { validateTransaction, createTransaction } from '../schema/transaction';

export async function getTransactions() {
  const docs = await getAllDocuments('transaction');
  return docs.sort((a, b) => {
    const da = a.date || '';
    const db = b.date || '';
    if (da !== db) return da < db ? -1 : da > db ? 1 : 0;
    return a._id < b._id ? -1 : a._id > b._id ? 1 : 0;
  });
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
  };
  const errors = validateTransaction(updated);
  if (errors.length > 0) {
    throw new Error(`Validation failed: ${errors.join('; ')}`);
  }
  return saveDocument(updated);
}

export async function deleteTransaction(id) {
  const existing = await getTransactionById(id);
  if (!existing) {
    throw new Error('Transaction not found');
  }
  return deleteDocument(id, existing._rev);
}

export function calculateTransactionBalance(postings) {
  if (!Array.isArray(postings)) {
    return 0;
  }
  return postings.reduce((sum, p) => sum + (p.amount || 0), 0);
}

export function isTransactionBalanced(postings) {
  return Math.abs(calculateTransactionBalance(postings)) < 0.001;
}