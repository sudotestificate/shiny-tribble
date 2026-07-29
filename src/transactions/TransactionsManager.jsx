import React, { useState, useEffect } from 'react';
import { getTransactions, createTransactionRecord, updateTransaction } from './TransactionService';
import { getAllDocuments } from '../services/pouchdb';
import TransactionList from './TransactionList';
import TransactionForm from './TransactionForm';

function TransactionsManager() {
  const [transactions, setTransactions] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [view, setView] = useState('list');
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [deletingTransaction, setDeletingTransaction] = useState(null);

  async function loadData() {
    try {
      setError(null);
      const [txList, accountList] = await Promise.all([
        getTransactions(),
        getAllDocuments('account'),
      ]);
      setTransactions(txList);
      setAccounts(accountList);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function handleTransactionCreated() {
    loadData();
    setView('list');
  }

  function handleTransactionUpdated() {
    loadData();
    setView('list');
    setEditingTransaction(null);
  }

  function handleTransactionDeleted() {
    loadData();
    setView('list');
    setDeletingTransaction(null);
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">Transactions</h2>
        <p className="text-gray-500">Loading transactions...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">Transactions</h2>
        <p className="text-red-500">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Transactions</h2>
        {view === 'list' && (
          <button
            onClick={() => setView('create')}
            className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            New Transaction
          </button>
        )}
      </div>

      {view === 'create' && (
        <TransactionForm
          accounts={accounts}
          onSubmit={async (data) => {
            await createTransactionRecord(data);
            handleTransactionCreated();
          }}
          onCancel={() => setView('list')}
          isEditing={false}
        />
      )}

      {view === 'edit' && editingTransaction && (
        <TransactionForm
          transaction={editingTransaction}
          accounts={accounts}
          onSubmit={async (data) => {
            await updateTransaction(editingTransaction._id, data);
            handleTransactionUpdated();
          }}
          onCancel={() => {
            setView('list');
            setEditingTransaction(null);
          }}
          isEditing={true}
        />
      )}

      {view === 'list' && (
        <TransactionList
          transactions={transactions}
          accounts={accounts}
          onEdit={(tx) => {
            setEditingTransaction(tx);
            setView('edit');
          }}
          onDelete={(tx) => {
            setDeletingTransaction(tx);
            setView('delete');
          }}
        />
      )}
    </div>
  );
}

export default TransactionsManager;