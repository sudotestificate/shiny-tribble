import React, { useState, useMemo } from 'react';

function PostingRow({ posting, index, accounts, onUpdate, onRemove }) {
  const accountNames = useMemo(() => [...new Set(accounts.map(a => a.name))].sort(), [accounts]);

  function handleAccountChange(e) {
    onUpdate(index, { ...posting, account: e.target.value });
  }

  function handleAmountChange(e) {
    const val = e.target.value === '' ? '' : parseFloat(e.target.value);
    onUpdate(index, { ...posting, amount: val === '' ? '' : val });
  }

  function handleCurrencyChange(e) {
    onUpdate(index, { ...posting, currency: e.target.value });
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2 p-3 bg-gray-50 rounded-md">
      <div className="flex-1 min-w-0">
        <label className="block text-xs font-medium text-gray-500 mb-1">Account</label>
        <input
          type="text"
          value={posting.account}
          onChange={handleAccountChange}
          list={`account-list-${index}`}
          required
          className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          placeholder="Select or type account"
        />
        <datalist id={`account-list-${index}`}>
          {accountNames.map(name => (
            <option key={name} value={name} />
          ))}
        </datalist>
      </div>
      <div className="w-full sm:w-32">
        <label className="block text-xs font-medium text-gray-500 mb-1">Amount</label>
        <input
          type="number"
          step="0.01"
          value={posting.amount === '' ? '' : posting.amount}
          onChange={handleAmountChange}
          required
          className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          placeholder="0.00"
        />
      </div>
      <div className="w-full sm:w-24">
        <label className="block text-xs font-medium text-gray-500 mb-1">Currency</label>
        <input
          type="text"
          value={posting.currency}
          onChange={handleCurrencyChange}
          required
          className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          placeholder="USD"
        />
      </div>
      <div className="flex sm:flex-col items-center gap-2 pt-5">
        <button
          type="button"
          onClick={() => onRemove(index)}
          className="text-red-400 hover:text-red-600 text-sm"
          title="Remove posting"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

function TransactionForm({ transaction, accounts, onSubmit, onCancel, isEditing }) {
  const [date, setDate] = useState(transaction?.date || '');
  const [description, setDescription] = useState(transaction?.description || '');
  const [postings, setPostings] = useState(
    transaction?.postings || [{ account: '', amount: '', currency: 'USD' }]
  );
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  const total = useMemo(() => {
    return postings.reduce((sum, p) => {
      const amt = typeof p.amount === 'number' ? p.amount : 0;
      return sum + amt;
    }, 0);
  }, [postings]);

  const balanced = Math.abs(total) < 0.001;

  function addPosting() {
    setPostings(prev => [...prev, { account: '', amount: '', currency: 'USD' }]);
  }

  function removePosting(index) {
    if (postings.length <= 1) return;
    setPostings(prev => prev.filter((_, i) => i !== index));
  }

  function updatePosting(index, updatedPosting) {
    setPostings(prev => {
      const next = [...prev];
      next[index] = updatedPosting;
      return next;
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      const validPostings = postings.map(p => ({
        account: p.account.trim(),
        amount: typeof p.amount === 'number' ? p.amount : 0,
        currency: p.currency.trim() || 'USD',
      }));

      await onSubmit({
        date,
        description: description.trim(),
        postings: validPostings,
        source_journal: transaction?.source_journal || null,
        hledger_validated: balanced,
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200">
      <div className="px-4 py-3 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">
          {isEditing ? 'Edit Transaction' : 'New Transaction'}
        </h3>
      </div>
      <div className="p-4">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Postings
              </label>
              <button
                type="button"
                onClick={addPosting}
                className="text-xs text-primary-600 hover:text-primary-800 font-medium"
              >
                + Add posting
              </button>
            </div>
            <div className="space-y-0">
              {postings.map((posting, i) => (
                <PostingRow
                  key={i}
                  posting={posting}
                  index={i}
                  accounts={accounts}
                  onUpdate={updatePosting}
                  onRemove={removePosting}
                />
              ))}
            </div>
          </div>

          <div className={`p-3 rounded-md text-sm font-medium ${balanced ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
            {balanced
              ? 'Postings are balanced ✓'
              : `Postings are unbalanced — current sum: ${total.toFixed(2)}`}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={saving || !balanced}
              className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
            >
              {saving ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Transaction'}
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

export default TransactionForm;