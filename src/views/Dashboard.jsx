import React, { useState, useEffect } from 'react';
import { getAllDocuments } from '../services/pouchdb';

function Dashboard() {
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [accountList, transactionList] = await Promise.all([
          getAllDocuments('account'),
          getAllDocuments('transaction'),
        ]);
        setAccounts(accountList);
        setTransactions(transactionList);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const assetAccounts = accounts.filter(a => a.kind === 'asset');
  const liabilityAccounts = accounts.filter(a => a.kind === 'liability');
  const incomeAccounts = accounts.filter(a => a.kind === 'income');
  const expenseAccounts = accounts.filter(a => a.kind === 'expense');

  const totalAssets = assetAccounts.reduce((sum, a) => sum + (a.balance || 0), 0);
  const totalLiabilities = liabilityAccounts.reduce((sum, a) => sum + (a.balance || 0), 0);
  const totalIncome = incomeAccounts.reduce((sum, a) => sum + (a.balance || 0), 0);
  const totalExpenses = expenseAccounts.reduce((sum, a) => sum + (a.balance || 0), 0);
  const netWorth = totalAssets - totalLiabilities + totalIncome - totalExpenses;

  const recentTransactions = [...transactions]
    .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
    .slice(0, 10);

  if (loading) {
    return <div className="space-y-6"><p className="text-gray-500">Loading dashboard...</p></div>;
  }

  if (error) {
    return <div className="space-y-6"><p className="text-red-500">Error: {error}</p></div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
          <p className="text-sm font-medium text-gray-500">Total Assets</p>
          <p className="mt-1 text-2xl font-semibold text-finance-asset">${totalAssets.toFixed(2)}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
          <p className="text-sm font-medium text-gray-500">Total Liabilities</p>
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
          <h3 className="text-lg font-medium text-gray-900">Recent Transactions</h3>
        </div>
        <div className="p-4">
          {recentTransactions.length === 0 ? (
            <p className="text-gray-500 text-sm">No transactions yet.</p>
          ) : (
            <ul className="divide-y divide-gray-200">
              {recentTransactions.map(tx => (
                <li key={tx._id} className="py-2 flex justify-between">
                  <span className="text-sm text-gray-700">{tx.description || 'Unnamed transaction'}</span>
                  <span className="text-sm text-gray-500">{tx.date || ''}</span>
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
