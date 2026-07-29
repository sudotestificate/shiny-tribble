export function validateTransaction(doc) {
  const errors = [];

  if (!doc || typeof doc !== 'object') {
    return ['Document must be a non-null object'];
  }

  if (doc.type !== 'transaction') {
    errors.push(`Invalid type: expected 'transaction', got '${doc.type}'`);
  }

  if (!doc._id || typeof doc._id !== 'string') {
    errors.push('Missing or invalid _id');
  }

  if (!doc.date || isNaN(Date.parse(doc.date))) {
    errors.push('Missing or invalid date');
  }

  if (doc.description !== undefined && typeof doc.description !== 'string') {
    errors.push('Invalid description');
  }

  if (!Array.isArray(doc.postings) || doc.postings.length === 0) {
    errors.push('Missing or invalid postings: must be a non-empty array');
  } else {
    doc.postings.forEach((posting, index) => {
      if (!posting.account || typeof posting.account !== 'string') {
        errors.push(`Postings[${index}]: missing or invalid account`);
      }
      if (posting.amount === undefined || posting.amount === null || typeof posting.amount !== 'number' || isNaN(posting.amount)) {
        errors.push(`Postings[${index}]: missing or invalid amount`);
      }
      if (!posting.currency || typeof posting.currency !== 'string' || posting.currency.trim() === '') {
        errors.push(`Postings[${index}]: missing or invalid currency`);
      }
    });

    const total = doc.postings.reduce((sum, p) => sum + (p.amount || 0), 0);
    if (Math.abs(total) > 0.001) {
      errors.push(`Postings must balance: sum of amounts is ${total}, expected 0`);
    }
  }

  if (doc.source_journal !== undefined && doc.source_journal !== null && typeof doc.source_journal !== 'string') {
    errors.push('Invalid source_journal');
  }

  if (doc.hledger_validated !== undefined && typeof doc.hledger_validated !== 'boolean') {
    errors.push('Invalid hledger_validated: must be a boolean');
  }

  return errors;
}

export function createTransaction({ date, description, postings, source_journal, hledger_validated }) {
  const total = postings.reduce((sum, p) => sum + p.amount, 0);

  return {
    _id: `transaction_${date.replace(/-/g, '')}_${Date.now()}`,
    type: 'transaction',
    date,
    description: description || '',
    postings,
    source_journal: source_journal || null,
    hledger_validated: hledger_validated !== undefined ? hledger_validated : Math.abs(total) < 0.001,
  };
}
