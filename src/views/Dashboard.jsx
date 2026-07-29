import React from 'react';

function Dashboard() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
          <p className="text-sm font-medium text-gray-500">Total Assets</p>
          <p className="mt-1 text-2xl font-semibold text-finance-asset">$0.00</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
          <p className="text-sm font-medium text-gray-500">Total Liabilities</p>
          <p className="mt-1 text-2xl font-semibold text-finance-liability">$0.00</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
          <p className="text-sm font-medium text-gray-500">Income</p>
          <p className="mt-1 text-2xl font-semibold text-finance-income">$0.00</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
          <p className="text-sm font-medium text-gray-500">Expenses</p>
          <p className="mt-1 text-2xl font-semibold text-finance-expense">$0.00</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow border border-gray-200">
        <div className="px-4 py-3 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Net Worth</h3>
        </div>
        <div className="p-4">
          <p className="text-3xl font-bold text-gray-900">$0.00</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow border border-gray-200">
        <div className="px-4 py-3 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Recent Transactions</h3>
        </div>
        <div className="p-4">
          <p className="text-gray-500 text-sm">No transactions yet.</p>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;