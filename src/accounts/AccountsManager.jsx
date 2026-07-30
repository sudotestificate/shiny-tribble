import React, { useState, useEffect } from 'react';
import { getAccounts } from './AccountService';
import { getAllDocuments } from '../services/pouchdb';
import CreateAccount from './CreateAccount';
import EditAccount from './EditAccount';
import DeleteAccount from './DeleteAccount';
import AccountList from './AccountList';

function AccountsManager() {
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [view, setView] = useState('list');
  const [editingAccount, setEditingAccount] = useState(null);
  const [deletingAccount, setDeletingAccount] = useState(null);

  async function loadData() {
    try {
      setError(null);
      const accountList = await getAccounts();
      const transactionList = await getAllDocuments('transaction');
      setAccounts(accountList);
      setTransactions(transactionList);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function handleAccountCreated() {
    loadData();
    setView('list');
  }

  function handleAccountUpdated() {
    loadData();
    setView('list');
    setEditingAccount(null);
  }

  function handleAccountDeleted() {
    loadData();
    setView('list');
    setDeletingAccount(null);
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">Accounts</h2>
        <p className="text-gray-500">Loading accounts...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">Accounts</h2>
        <p className="text-red-500">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Accounts</h2>
        {view === 'list' && (
          <button
            onClick={() => setView('create')}
            className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            New Account
          </button>
        )}
      </div>

      {view === 'create' && (
        <CreateAccount
          onAccountCreated={handleAccountCreated}
          onCancel={() => setView('list')}
        />
      )}

      {view === 'edit' && editingAccount && (
        <EditAccount
          account={editingAccount}
          onAccountUpdated={handleAccountUpdated}
          onCancel={() => {
            setView('list');
            setEditingAccount(null);
          }}
        />
      )}

      {view === 'delete' && deletingAccount && (
        <DeleteAccount
          account={deletingAccount}
          transactions={transactions}
          onAccountDeleted={handleAccountDeleted}
          onCancel={() => {
            setView('list');
            setDeletingAccount(null);
          }}
        />
      )}

      {view === 'list' && (
        <>
          <AccountList accounts={accounts} transactions={transactions} />

          <div className="bg-white rounded-lg shadow border border-gray-200">
            <div className="px-4 py-3 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Account List</h3>
            </div>
            <div className="p-4">
              {accounts.length === 0 ? (
                <p className="text-gray-500 text-sm">No accounts yet.</p>
              ) : (
                <div className="space-y-2">
                  {accounts.map(account => (
                    <div
                      key={account._id}
                      className="flex justify-between items-center py-2 px-3 rounded hover:bg-gray-50 border border-gray-100"
                    >
                      <div>
                        <span className="text-sm font-medium text-gray-900">
                          {account.name}
                        </span>
                        <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                          {account.kind}
                        </span>
                        {account.parent_account && (
                          <span className="ml-2 text-xs text-gray-400">
                            parent: {account.parent_account}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-mono text-gray-600">
                          {account.currency}
                        </span>
                        <button
                          onClick={() => {
                            setEditingAccount(account);
                            setView('edit');
                          }}
                          className="text-xs text-primary-600 hover:text-primary-800 font-medium"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            setDeletingAccount(account);
                            setView('delete');
                          }}
                          className="text-xs text-red-600 hover:text-red-800 font-medium"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default AccountsManager;