import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllDocuments, saveDocument } from '../services/pouchdb';
import { createTransaction } from '../schema/transaction';
import { useActiveJournal } from '../hooks/useActiveJournal';
import { calculateAccountBalance } from '../accounts/AccountService';

function Dashboard() {
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { activeJournal } = useActiveJournal();

  const [quickAddType, setQuickAddType] = useState(null);
  const [quickAddDesc, setQuickAddDesc] = useState('');
  const [quickAddAmount, setQuickAddAmount] = useState('');
  const [quickAddDate, setQuickAddDate] = useState(new Date().toISOString().split('T')[0]);
  const [quickAddSaving, setQuickAddSaving] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const [accountList, transactionList] = await Promise.all([
          getAllDocuments('account'),
          getAllDocuments('transaction'),
        ]);
        setAccounts(accountList);
        setTransactions(transactionList.filter(t => t.source_journal === activeJournal));
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [activeJournal]);

  const assetAccounts = accounts.filter(a => a.kind === 'asset');
  const liabilityAccounts = accounts.filter(a => a.kind === 'liability');
  const incomeAccounts = accounts.filter(a => a.kind === 'income');
  const expenseAccounts = accounts.filter(a => a.kind === 'expense');
  const equityAccounts = accounts.filter(a => a.kind === 'equity');

  const totalAssets = assetAccounts.reduce((sum, a) => sum + calculateAccountBalance(a.name, transactions), 0);
  const totalLiabilities = liabilityAccounts.reduce((sum, a) => sum + calculateAccountBalance(a.name, transactions), 0);
  const totalIncome = incomeAccounts.reduce((sum, a) => sum + calculateAccountBalance(a.name, transactions), 0);
  const totalExpenses = expenseAccounts.reduce((sum, a) => sum + calculateAccountBalance(a.name, transactions), 0);
  const totalEquity = equityAccounts.reduce((sum, a) => sum + calculateAccountBalance(a.name, transactions), 0);
  const netWorth = totalAssets - totalLiabilities + totalIncome - totalExpenses + totalEquity;

  const recentTransactions = [...transactions]
    .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
    .slice(0, 10);

  async function handleQuickAdd(e) {
    e.preventDefault();
    setQuickAddSaving(true);
    try {
      const amount = parseFloat(quickAddAmount);
      if (isNaN(amount) || amount <= 0) {
        throw new Error('Please enter a valid amount');
      }

      let postings;
      if (quickAddType === 'income') {
        postings = [
          { account: 'Checking Account', amount, currency: 'USD' },
          { account: 'Salary Income', amount: -amount, currency: 'USD' },
        ];
      } else if (quickAddType === 'expense') {
        postings = [
          { account: 'Groceries', amount, currency: 'USD' },
          { account: 'Checking Account', amount: -amount, currency: 'USD' },
        ];
      } else if (quickAddType === 'transfer') {
        postings = [
          { account: 'Savings Account', amount, currency: 'USD' },
          { account: 'Checking Account', amount: -amount, currency: 'USD' },
        ];
      }

      const tx = createTransaction({
        date: quickAddDate,
        description: quickAddDesc,
        postings,
        source_journal: activeJournal,
        hledger_validated: true,
      });

      await saveDocument(tx);
      setTransactions(prev => [...prev, tx]);
      setQuickAddType(null);
      setQuickAddDesc('');
      setQuickAddAmount('');
    } catch (err) {
      setError(err.message);
    } finally {
      setQuickAddSaving(false);
    }
  }

  if (loading) {
    return <div className="space-y-6"><p className="text-gray-500">Loading dashboard...</p></div>;
  }

  if (error) {
    return <div className="space-y-6"><p className="text-red-500">Error: {error}</p></div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
          <p className="text-sm font-medium text-gray-500">Assets</p>
          <p className="mt-1 text-2xl font-semibold text-finance-asset">${totalAssets.toFixed(2)}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
          <p className="text-sm font-medium text-gray-500">Liabilities</p>
          <p className="mt-1 text-2xl font-semibold text-finance-liability">${totalLiabilities.toFixed(2)}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
          <p className="text-sm font-medium text-gray-500">Income</p>
          <p className="mt-1 text-2xl font-semibold text-finance-income">${totalIncome.toFixed(2)}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
          <p className="text-sm font-medium text-gray-500">Expenses</p>
          <p className="mt-1 text-2xl font-semibold text-finance-expense">${totalExpenses.toFixed(2)}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
          <p className="text-sm font-medium text-gray-500">Equity</p>
          <p className="mt-1 text-2xl font-semibold text-finance-equity">${totalEquity.toFixed(2)}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow border border-gray-200">
        <div className="px-4 py-3 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Net Worth</h3>
        </div>
        <div className="p-4">
          <p className="text-3xl font-bold text-gray-900">${netWorth.toFixed(2)}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow border border-gray-200">
        <div className="px-4 py-3 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Quick Add</h3>
        </div>
        <div className="p-4">
          {!quickAddType ? (
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setQuickAddType('income')}
                className="px-4 py-2 bg-finance-income text-white text-sm font-medium rounded-md hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-finance-income"
              >
                Add Income
              </button>
              <button
                onClick={() => setQuickAddType('expense')}
                className="px-4 py-2 bg-finance-expense text-white text-sm font-medium rounded-md hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-finance-expense"
              >
                Add Expense
              </button>
              <button
                onClick={() => setQuickAddType('transfer')}
                className="px-4 py-2 bg-finance-asset text-white text-sm font-medium rounded-md hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-finance-asset"
              >
                Add Transfer
              </button>
              <button
                onClick={() => navigate('/transactions')}
                className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                View All Transactions
              </button>
            </div>
          ) : (
            <form onSubmit={handleQuickAdd} className="space-y-4 max-w-md">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={quickAddDesc}
                  onChange={e => setQuickAddDesc(e.target.value)}
                  required
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder={quickAddType === 'income' ? 'e.g. Monthly salary' : quickAddType === 'expense' ? 'e.g. Grocery shopping' : 'e.g. Transfer to savings'}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={quickAddAmount}
                  onChange={e => setQuickAddAmount(e.target.value)}
                  required
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  value={quickAddDate}
                  onChange={e => setQuickAddDate(e.target.value)}
                  required
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={quickAddSaving}
                  className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
                >
                  {quickAddSaving ? 'Saving...' : 'Save'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setQuickAddType(null);
                    setQuickAddDesc('');
                    setQuickAddAmount('');
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow border border-gray-200">
        <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">Recent Transactions</h3>
          <button
            onClick={() => navigate('/transactions')}
            className="text-sm text-primary-600 hover:text-primary-800 font-medium"
          >
            View all
          </button>
        </div>
        <div className="p-4">
          {recentTransactions.length === 0 ? (
            <p className="text-gray-500 text-sm">No transactions yet.</p>
          ) : (
            <ul className="divide-y divide-gray-200">
              {recentTransactions.map(tx => (
                <li key={tx._id} className="py-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{tx.description || 'Unnamed transaction'}</p>
                      <p className="text-sm text-gray-500">{tx.date || ''}</p>
                      {tx.postings && tx.postings.length > 0 && (
                        <div className="mt-1 space-y-0.5">
                          {tx.postings.map((p, i) => (
                            <p key={i} className="text-xs text-gray-500">
                              {p.account}: {p.amount !== undefined ? `${Math.abs(p.amount).toFixed(2)} ${p.currency || ''}`.trim() : ''}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="ml-4 text-right flex-shrink-0">
                      {tx.postings && tx.postings.length > 0 && (
                        <span className={`text-sm font-medium ${tx.postings[0].amount >= 0 ? 'text-finance-income' : 'text-finance-expense'}`}>
                          {tx.postings[0].amount >= 0 ? '+' : '-'}${Math.abs(tx.postings[0].amount).toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
