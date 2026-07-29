import React, { useState, useEffect } from 'react';
import { getAllDocuments } from '../services/pouchdb';

function Journals() {
  const [journals, setJournals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await getAllDocuments('journal');
        setJournals(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  if (loading) {
    return <div className="space-y-6"><p className="text-gray-500">Loading journals...</p></div>;
  }

  if (error) {
    return <div className="space-y-6"><p className="text-red-500">Error: {error}</p></div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Journals</h2>

      <div className="bg-white rounded-lg shadow border border-gray-200">
        <div className="px-4 py-3 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Journal List</h3>
        </div>
        <div className="p-4">
          {journals.length === 0 ? (
            <p className="text-gray-500 text-sm">No journals yet.</p>
          ) : (
            <ul className="divide-y divide-gray-200">
              {journals.map(journal => (
                <li key={journal._id} className="py-3">
                  <div className="flex justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{journal.name || journal._id}</p>
                      <p className="text-sm text-gray-500">{journal.file_path || ''}</p>
                    </div>
                    <span className="text-xs text-gray-400">
                      {journal.created_at ? new Date(journal.created_at).toLocaleDateString() : ''}
                    </span>
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

export default Journals;
