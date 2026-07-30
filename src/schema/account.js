export const ACCOUNT_KINDS = ['asset', 'liability', 'income', 'expense', 'equity'];

export function validateAccount(doc) {
  const errors = [];

  if (!doc || typeof doc !== 'object') {
    return ['Document must be a non-null object'];
  }

  if (doc.type !== 'account') {
    errors.push(`Invalid type: expected 'account', got '${doc.type}'`);
  }

  if (!doc._id || typeof doc._id !== 'string') {
    errors.push('Missing or invalid _id');
  }

  if (!doc.name || typeof doc.name !== 'string' || doc.name.trim() === '') {
    errors.push('Missing or invalid name');
  }

  if (doc.parent_account !== undefined && doc.parent_account !== null && (typeof doc.parent_account !== 'string' || doc.parent_account.trim() === '')) {
    errors.push('Invalid parent_account');
  }

  if (!doc.kind || !ACCOUNT_KINDS.includes(doc.kind)) {
    errors.push(`Invalid kind: must be one of ${ACCOUNT_KINDS.join(', ')}`);
  }

  if (!doc.currency || typeof doc.currency !== 'string' || doc.currency.trim() === '') {
    errors.push('Missing or invalid currency');
  }

  if (!doc.created_at || isNaN(Date.parse(doc.created_at))) {
    errors.push('Missing or invalid created_at');
  }

  return errors;
}

export function createAccount({ name, parent_account, kind, currency, created_at }) {
  return {
    _id: `account_${name.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase()}_${Date.now()}`,
    type: 'account',
    name,
    parent_account: parent_account || null,
    kind,
    currency,
    created_at: created_at || new Date().toISOString(),
  };
}