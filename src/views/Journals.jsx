import React from 'react';

function Journals() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Journals</h2>

      <div className="bg-white rounded-lg shadow border border-gray-200">
        <div className="px-4 py-3 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Journal List</h3>
        </div>
        <div className="p-4">
          <p className="text-gray-500 text-sm">No journals yet.</p>
        </div>
      </div>
    </div>
  );
}

export default Journals;