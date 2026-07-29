import React, { useState } from 'react';
import { deleteTransaction, calculateTransactionBalance, isTransactionBalanced } from './TransactionService';

function DeleteTransaction({ transaction, onTransactionDeleted, onCancel }) {
  const [confirmText, setConfirmText] = useState('');
  const [error, setError] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const balance = calculateTransactionBalance(transaction.postings);
  const unbalanced = !isTransactionBalanced(transaction.postings);
  const imbalance = Math.abs(balance);
  const canDelete = confirmText === transaction.description || confirmText === transaction._id;

  async function handleDelete() {
    if (!canDelete) return;
    setError(null);
    setDeleting(true);

    try {
      await deleteTransaction(transaction._id);
      onTransactionDeleted();
    } catch (err) {
      setError(err.message);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200">
      <div className="px-4 py-3 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Delete Transaction</h3>
      </div>
      <div className="p-4">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
            {error}
          </div>
        )}
        <p className="text-sm text-gray-700 mb-4">
          Are you sure you want to delete <strong>{transaction.description || 'Unnamed transaction'}</strong>?
          Date: {transaction.date}
          This action cannot be undone.
        </p>

        {unbalanced && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded">
            <p className="text-sm font-medium text-red-700 mb-2">
              Warning: This transaction is unbalanced.
            </p>
            <p className="text-xs text-red-600">
              Imbalance amount: {imbalance}
            </p>
          </div>
        )}

        <p className="text-sm text-gray-600 mb-4">
          Type <strong>{transaction.description || transaction._id}</strong> to confirm deletion.
        </p>
        <input
          type="text"
          value={confirmText}
          onChange={e => setConfirmText(e.target.value)}
          placeholder={transaction.description || transaction._id}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        />
        <div className="flex gap-3 pt-2">
          <button
            onClick={handleDelete}
            disabled={!canDelete || deleting}
            className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
          >
            {deleting ? 'Deleting...' : 'Delete Transaction'}
          </button>
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default DeleteTransaction;