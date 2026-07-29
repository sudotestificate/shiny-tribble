import React, { useState, useEffect } from 'react';
import { getAllDocuments } from '../services/pouchdb';

function Accounts() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await getAllDocuments('account');
        setAccounts(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  if (loading) {
    return <div className="space-y-6"><p className="text-gray-500">Loading accounts...</p></div>;
  }

  if (error) {
    return <div className="space-y-6"><p className="text-red-500">Error: {error}</p></div>;
  }

  const groupedAccounts = {
    asset: accounts.filter(a => a.kind === 'asset'),
    liability: accounts.filter(a => a.kind === 'liability'),
    income: accounts.filter(a => a.kind === 'income'),
    expense: accounts.filter(a => a.kind === 'expense'),
    equity: accounts.filter(a => a.kind === 'equity'),
  };

  const kindLabels = {
    asset: 'Assets',
    liability: 'Liabilities',
    income: 'Income',
    expense: 'Expenses',
    equity: 'Equity',
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Accounts</h2>

      <div className="bg-white rounded-lg shadow border border-gray-200">
        <div className="px-4 py-3 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Account List</h3>
        </div>
        <div className="p-4">
          {accounts.length === 0 ? (
            <p className="text-gray-500 text-sm">No accounts yet.</p>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedAccounts).map(([kind, kindAccounts]) => (
                <div key={kind}>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">{kindLabels[kind] || kind}</h4>
                  {kindAccounts.length === 0 ? (
                    <p className="text-sm text-gray-400 ml-4">No {kind} accounts.</p>
                  ) : (
                    <ul className="divide-y divide-gray-100 ml-4">
                      {kindAccounts.map(account => (
                        <li key={account._id} className="py-2 flex justify-between">
                          <span className="text-sm text-gray-700">{account.name || account._id}</span>
                          <span className="text-sm text-gray-500">
                            {account.balance !== undefined ? `$${Number(account.balance).toFixed(2)}` : '—'}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Accounts;
