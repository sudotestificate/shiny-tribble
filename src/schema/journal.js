export function validateJournal(doc) {
  const errors = [];

  if (!doc || typeof doc !== 'object') {
    return ['Document must be a non-null object'];
  }

  if (doc.type !== 'journal') {
    errors.push(`Invalid type: expected 'journal', got '${doc.type}'`);
  }

  if (!doc._id || typeof doc._id !== 'string') {
    errors.push('Missing or invalid _id');
  }

  if (!doc.name || typeof doc.name !== 'string' || doc.name.trim() === '') {
    errors.push('Missing or invalid name');
  }

  if (!doc.file_path || typeof doc.file_path !== 'string' || doc.file_path.trim() === '') {
    errors.push('Missing or invalid file_path');
  }

  if (!doc.created_at || isNaN(Date.parse(doc.created_at))) {
    errors.push('Missing or invalid created_at');
  }

  if (!doc.updated_at || isNaN(Date.parse(doc.updated_at))) {
    errors.push('Missing or invalid updated_at');
  }

  return errors;
}

export function createJournal({ name, file_path, created_at, updated_at }) {
  return {
    _id: `journal_${name.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase()}_${Date.now()}`,
    type: 'journal',
    name,
    file_path,
    created_at: created_at || new Date().toISOString(),
    updated_at: updated_at || new Date().toISOString(),
  };
}