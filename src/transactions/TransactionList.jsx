import React, { useState, useMemo } from 'react';
import { calculateTransactionBalance, isTransactionBalanced } from './TransactionService';

function TransactionRow({ transaction, onEdit, onDelete }) {
  const balance = calculateTransactionBalance(transaction.postings);
  const balanced = isTransactionBalanced(transaction.postings);

  return (
    <tr className="border-b border-gray-100 hover:bg-gray-50">
      <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">{transaction.date || ''}</td>
      <td className="px-4 py-3 text-sm text-gray-700">{transaction.description || 'Unnamed transaction'}</td>
      <td className="px-4 py-3 text-sm text-gray-600">
        {transaction.postings && transaction.postings.length > 0 ? (
          <div className="space-y-1">
            {transaction.postings.map((p, i) => (
              <div key={i} className="text-xs">
                <span className="text-gray-700">{p.account}</span>
                <span className="mx-1">→</span>
                <span className={`font-mono ${p.amount < 0 ? 'text-red-600' : 'text-gray-900'}`}>
                  {p.currency} {Math.abs(p.amount).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <span className="text-gray-400">No postings</span>
        )}
      </td>
      <td className="px-4 py-3 text-sm text-gray-600 font-mono">
        {balance.toFixed(2)}
      </td>
      <td className="px-4 py-3 text-sm text-center">
        {balanced ? (
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-100 text-green-600 text-xs" title="Balanced">
            ✓
          </span>
        ) : (
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-100 text-red-600 text-xs" title="Unbalanced">
            ✗
          </span>
        )}
      </td>
      <td className="px-4 py-3 text-sm text-right whitespace-nowrap">
        <button
          onClick={() => onEdit(transaction)}
          className="text-xs text-primary-600 hover:text-primary-800 font-medium mr-3"
        >
          Edit
        </button>
        <button
          onClick={() => onDelete(transaction)}
          className="text-xs text-red-600 hover:text-red-800 font-medium"
        >
          Delete
        </button>
      </td>
    </tr>
  );
}

function TransactionList({ transactions, accounts, onEdit, onDelete }) {
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [accountFilter, setAccountFilter] = useState('');

  const filtered = useMemo(() => {
    return transactions.filter(tx => {
      const matchesSearch = !search ||
        (tx.description && tx.description.toLowerCase().includes(search.toLowerCase())) ||
        (tx.date && tx.date.includes(search));

      const matchesDateFrom = !dateFrom || (tx.date && tx.date >= dateFrom);
      const matchesDateTo = !dateTo || (tx.date && tx.date <= dateTo);

      const matchesAccount = !accountFilter ||
        (tx.postings && tx.postings.some(p => p.account === accountFilter));

      return matchesSearch && matchesDateFrom && matchesDateTo && matchesAccount;
    });
  }, [transactions, search, dateFrom, dateTo, accountFilter]);

  const accountNames = useMemo(() => {
    return [...new Set(accounts.map(a => a.name))].sort();
  }, [accounts]);

  if (transactions.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow border border-gray-200">
        <div className="px-4 py-3 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Transactions</h3>
        </div>
        <div className="p-4">
          <p className="text-gray-500 text-sm">No transactions yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200">
      <div className="px-4 py-3 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Transactions</h3>
      </div>
      <div className="p-4 border-b border-gray-200">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Search</label>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Description..."
              className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Date from</label>
            <input
              type="date"
              value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Date to</label>
            <input
              type="date"
              value={dateTo}
              onChange={e => setDateTo(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Account</label>
            <select
              value={accountFilter}
              onChange={e => setAccountFilter(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">All accounts</option>
              {accountNames.map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Postings</th>
              <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Sum</th>
              <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Balance</th>
              <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-sm text-gray-500 text-center">
                  No transactions match the current filters.
                </td>
              </tr>
            ) : (
              filtered.map(tx => (
                <TransactionRow
                  key={tx._id}
                  transaction={tx}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="px-4 py-2 border-t border-gray-200 text-xs text-gray-500">
        Showing {filtered.length} of {transactions.length} transactions
      </div>
    </div>
  );
}

export default TransactionList;