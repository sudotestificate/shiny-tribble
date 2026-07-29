import React from 'react';
import { useActiveJournal } from '../hooks/useActiveJournal.jsx';

function JournalSwitcher() {
  const { activeJournal, setActiveJournal, journals, loading } = useActiveJournal();

  function handleChange(e) {
    setActiveJournal(e.target.value);
  }

  if (loading) {
    return (
      <span className="text-sm text-gray-400 hidden sm:inline">Loading journals…</span>
    );
  }

  return (
    <select
      value={activeJournal}
      onChange={handleChange}
      className="text-sm font-medium bg-white border border-gray-300 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
      aria-label="Active journal"
    >
      {journals.length === 0 && <option value="default">default</option>}
      {journals.map(name => (
        <option key={name} value={name}>{name}</option>
      ))}
    </select>
  );
}

export default JournalSwitcher;
