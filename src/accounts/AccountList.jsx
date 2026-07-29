import React from 'react';
import { buildAccountTree, calculateAccountBalance } from './AccountService';

function AccountNode({ node, transactions, depth = 0 }) {
  const balance = calculateAccountBalance(node._id, transactions);

  return (
    <div>
      <div
        className="flex justify-between items-center py-2 px-3 rounded hover:bg-gray-50"
        style={{ paddingLeft: `${depth * 16 + 12}px` }}
      >
        <div className="flex items-center gap-2">
          {node.children && node.children.length > 0 && (
            <span className="text-gray-400 text-xs">▸</span>
          )}
          <span className="text-sm text-gray-700 font-medium">{node.name}</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
            {node.kind}
          </span>
        </div>
        <span className={`text-sm font-mono ${balance >= 0 ? 'text-gray-900' : 'text-red-600'}`}>
          ${Math.abs(balance).toFixed(2)}
        </span>
      </div>
      {node.children && node.children.length > 0 && (
        <div>
          {node.children.map(child => (
            <AccountNode
              key={child._id}
              node={child}
              transactions={transactions}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function AccountList({ accounts, transactions }) {
  const tree = buildAccountTree(accounts);

  if (accounts.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow border border-gray-200">
        <div className="px-4 py-3 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Account Tree</h3>
        </div>
        <div className="p-4">
          <p className="text-gray-500 text-sm">No accounts yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200">
      <div className="px-4 py-3 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Account Tree</h3>
      </div>
      <div className="p-4">
        {tree.map(node => (
          <AccountNode key={node._id} node={node} transactions={transactions} />
        ))}
      </div>
    </div>
  );
}

export default AccountList;