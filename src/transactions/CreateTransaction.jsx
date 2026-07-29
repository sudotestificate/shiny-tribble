import React, { useState } from 'react';
import { createTransactionRecord, calculateTransactionBalance, isTransactionBalanced } from './TransactionService';

function CreateTransaction({ onTransactionCreated, onCancel }) {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [postings, setPostings] = useState([
    { account: '', amount: 0, currency: 'USD' },
    { account: '', amount: 0, currency: 'USD' },
  ]);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  const balance = calculateTransactionBalance(postings);
  const isBalanced = isTransactionBalanced(postings);

  function addPosting() {
    setPostings([...postings, { account: '', amount: 0, currency: 'USD' }]);
  }

  function removePosting(index) {
    if (postings.length <= 1) return;
    setPostings(postings.filter((_, i) => i !== index));
  }

  function updatePosting(index, field, value) {
    const updated = [...postings];
    updated[index] = { ...updated[index], [field]: value };
    setPostings(updated);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSaving(true);

    const invalidAmounts = postings.filter(p => {
      const amount = parseFloat(p.amount);
      return isNaN(amount);
    });

    if (invalidAmounts.length > 0) {
      const badIndices = invalidAmounts.map((p, i) => `#${postings.indexOf(p) + 1}`).join(', ');
      setError(`Invalid amount(s) in posting(s) ${badIndices}: please enter a numeric value.`);
      setSaving(false);
      return;
    }

    try {
      await createTransactionRecord({
        date,
        description: description.trim(),
        postings: postings.map(p => ({
          account: p.account.trim(),
          amount: Number(p.amount),
          currency: p.currency.trim() || 'USD',
        })),
      });
      onTransactionCreated();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200">
      <div className="px-4 py-3 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Create Transaction</h3>
      </div>
      <div className="p-4">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date
            </label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Transaction description"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Postings
            </label>
            <div className="space-y-2">
              {postings.map((posting, index) => (
                <div key={index} className="flex gap-2 items-start">
                  <input
                    type="text"
                    value={posting.account}
                    onChange={e => updatePosting(index, 'account', e.target.value)}
                    required
                    className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Account"
                  />
                  <input
                    type="number"
                    value={posting.amount}
                    onChange={e => updatePosting(index, 'amount', e.target.value)}
                    required
                    step="any"
                    className="w-24 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Amount"
                  />
                  <input
                    type="text"
                    value={posting.currency}
                    onChange={e => updatePosting(index, 'currency', e.target.value)}
                    required
                    className="w-20 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="USD"
                  />
                  {postings.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removePosting(index)}
                      className="px-2 py-2 text-red-600 hover:text-red-800 text-sm"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addPosting}
              className="mt-2 px-3 py-1.5 border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Add Posting
            </button>
          </div>
          <div>
            <div className={`p-3 rounded text-sm ${isBalanced ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
              {isBalanced ? (
                <span>Balanced</span>
              ) : (
                <span>Unbalanced: sum of amounts is {balance.toFixed(2)}, expected 0</span>
              )}
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={saving || !isBalanced}
              className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateTransaction;
