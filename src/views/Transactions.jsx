import React, { useState, useEffect } from 'react';
import { getAllDocuments } from '../services/pouchdb';

function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await getAllDocuments('transaction');
        setTransactions(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  if (loading) {
    return <div className="space-y-6"><p className="text-gray-500">Loading transactions...</p></div>;
  }

  if (error) {
    return <div className="space-y-6"><p className="text-red-500">Error: {error}</p></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Transactions</h2>
      </div>

      <div className="bg-white rounded-lg shadow border border-gray-200">
        <div className="px-4 py-3 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Transaction List</h3>
        </div>
        <div className="p-4">
          {transactions.length === 0 ? (
            <p className="text-gray-500 text-sm">No transactions yet.</p>
          ) : (
            <ul className="divide-y divide-gray-200">
              {transactions.map(tx => (
                <li key={tx._id} className="py-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{tx.description || 'Unnamed transaction'}</p>
                      <p className="text-sm text-gray-500">{tx.date || ''}</p>
                    </div>
                    {tx.postings && tx.postings.length > 0 && (
                      <span className="text-sm text-gray-600">
                        {tx.postings[0].amount || 0}
                      </span>
                    )}
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

export default Transactions;
