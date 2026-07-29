import React, { useState } from 'react';
import { deleteAccount, getReferencingTransactions } from './AccountService';

function DeleteAccount({ account, transactions, onAccountDeleted, onCancel }) {
  const [confirmText, setConfirmText] = useState('');
  const [error, setError] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const referencingTxs = getReferencingTransactions(account.name, transactions);
  const hasReferences = referencingTxs.length > 0;
  const canDelete = !hasReferences && confirmText === account.name;

  async function handleDelete() {
    if (!canDelete) return;
    setError(null);
    setDeleting(true);

    try {
      await deleteAccount(account._id, account._rev);
      onAccountDeleted();
    } catch (err) {
      setError(err.message);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200">
      <div className="px-4 py-3 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Delete Account</h3>
      </div>
      <div className="p-4">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
            {error}
          </div>
        )}
        <p className="text-sm text-gray-700 mb-4">
          Are you sure you want to delete <strong>{account.name}</strong>?
          This action cannot be undone.
        </p>

        {hasReferences && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded">
            <p className="text-sm font-medium text-red-700 mb-2">
              Cannot delete: {referencingTxs.length} transaction(s) reference this account.
            </p>
            <ul className="text-xs text-red-600 space-y-1">
              {referencingTxs.map(tx => (
                <li key={tx._id}>
                  {tx.date} — {tx.description || 'Unnamed transaction'}
                </li>
              ))}
            </ul>
          </div>
        )}

        {!hasReferences && (
          <>
            <p className="text-sm text-gray-600 mb-4">
              Type <strong>{account.name}</strong> to confirm deletion.
            </p>
            <input
              type="text"
              value={confirmText}
              onChange={e => setConfirmText(e.target.value)}
              placeholder={account.name}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
            <div className="flex gap-3 pt-2">
              <button
                onClick={handleDelete}
                disabled={!canDelete || deleting}
                className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Delete Account'}
              </button>
              <button
                onClick={onCancel}
                className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Cancel
              </button>
            </div>
          </>
        )}

        {hasReferences && (
          <div className="flex gap-3 pt-2">
            <button
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default DeleteAccount;