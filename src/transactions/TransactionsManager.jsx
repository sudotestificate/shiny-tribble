import React, { useState, useEffect } from 'react';
import { getTransactions } from './TransactionService';
import CreateTransaction from './CreateTransaction';
import EditTransaction from './EditTransaction';
import DeleteTransaction from './DeleteTransaction';
import TransactionList from './TransactionList';

function TransactionsManager() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentView, setCurrentView] = useState('list');
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [deletingTransaction, setDeletingTransaction] = useState(null);

  async function loadTransactions() {
    setLoading(true);
    setError(null);
    try {
      const docs = await getTransactions();
      setTransactions(docs);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTransactions();
  }, []);

  function handleTransactionCreated() {
    loadTransactions();
    setCurrentView('list');
  }

  function handleTransactionUpdated() {
    loadTransactions();
    setCurrentView('list');
    setEditingTransaction(null);
  }

  function handleTransactionDeleted() {
    loadTransactions();
    setCurrentView('list');
    setDeletingTransaction(null);
  }

  function handleEdit(transaction) {
    setEditingTransaction(transaction);
    setCurrentView('edit');
  }

  function handleDelete(transaction) {
    setDeletingTransaction(transaction);
    setCurrentView('delete');
  }

  function handleCreate() {
    setCurrentView('create');
  }

  function handleCancel() {
    setCurrentView('list');
    setEditingTransaction(null);
    setDeletingTransaction(null);
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow border border-gray-200">
        <div className="px-4 py-3 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Transactions</h3>
        </div>
        <div className="p-4">
          <p className="text-sm text-gray-500">Loading transactions...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow border border-gray-200">
        <div className="px-4 py-3 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Transactions</h3>
        </div>
        <div className="p-4">
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
            {error}
          </div>
          <button
            onClick={loadTransactions}
            className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {(currentView === 'list') && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Transactions</h2>
            <button
              onClick={handleCreate}
              className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              New Transaction
            </button>
          </div>
          <TransactionList transactions={transactions} onEdit={handleEdit} onDelete={handleDelete} />
        </div>
      )}
      {(currentView === 'create') && (
        <CreateTransaction onTransactionCreated={handleTransactionCreated} onCancel={handleCancel} />
      )}
      {(currentView === 'edit') && editingTransaction && (
        <EditTransaction transaction={editingTransaction} onTransactionUpdated={handleTransactionUpdated} onCancel={handleCancel} />
      )}
      {(currentView === 'delete') && deletingTransaction && (
        <DeleteTransaction transaction={deletingTransaction} onTransactionDeleted={handleTransactionDeleted} onCancel={handleCancel} />
      )}
    </div>
  );
}

export default TransactionsManager;
