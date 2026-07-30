import { getAllDocuments } from '../services/pouchdb.js';

const DATE_RE = /^\d{4}[/-]\d{2}[/-]\d{2}/;
const ACCOUNT_DECL_RE = /^account\s+(.+)$/;

function inferKindFromPath(path) {
  const lower = path.toLowerCase();
  if (/^(asset|bank|checking|savings|cash|receivable|prepaid)/.test(lower)) {
    return 'asset';
  }
  if (/^(liabilit|debt|credit|payable|loan)/.test(lower)) {
    return 'liability';
  }
  if (/^(income|revenue|salary|earnings|interest|dividend)/.test(lower)) {
    return 'income';
  }
  if (/^(expense|cost|groceri|rent|util|supply|travel|entertain)/.test(lower)) {
    return 'expense';
  }
  if (/^(equity|capital|retained)/.test(lower)) {
    return 'equity';
  }
  return 'asset';
}

function buildAccountPath(account, allAccounts) {
  const path = [account.name];
  let current = account;
  const visited = new Set();

  while (current.parent_account) {
    if (visited.has(current._id)) break;
    visited.add(current._id);
    const parent = allAccounts.find((a) => a.name === current.parent_account);
    if (!parent) break;
    path.unshift(parent.name);
    current = parent;
  }

  return path.join(':');
}

function parseHledgerAmount(str) {
  const trimmed = str.trim();
  let hasLeadingDollar = false;
  let remaining = trimmed;

  if (trimmed.startsWith('$')) {
    hasLeadingDollar = true;
    remaining = trimmed.slice(1);
  }

  let amount;
  let commodity = null;

  const parts = remaining.split(/\s+/);
  if (parts.length === 1) {
    amount = parseFloat(parts[0].replace(/,/g, ''));
  } else if (parts.length === 2) {
    if (isNaN(parseFloat(parts[0]))) {
      amount = parseFloat(parts[1].replace(/,/g, ''));
      commodity = parts[0];
    } else {
      amount = parseFloat(parts[0].replace(/,/g, ''));
      commodity = parts[1];
    }
  } else {
    amount = parseFloat(parts[0].replace(/,/g, ''));
    commodity = parts.slice(1).join(' ');
  }

  if (commodity) {
    commodity = commodity.replace(/[.;,]+$/, '');
  }

  return { amount, commodity };
}

function generateAccountBlock(hledgerPath, account, allAccounts) {
  const lines = [];
  lines.push(`account ${hledgerPath}`);

  const existingDoc = account;
  if (existingDoc.kind) {
    lines.push(`  kind: ${existingDoc.kind}`);
  }
  if (existingDoc.currency) {
    lines.push(`  currency: ${existingDoc.currency}`);
  }
  if (existingDoc.description) {
    lines.push(`  description: ${existingDoc.description}`);
  }

  return lines.join('\n');
}

function generateTransactionBlock(tx) {
  const lines = [];
  lines.push(`${tx.date} ${tx.description}`);

  for (const posting of tx.postings) {
    const absAmount = Math.abs(posting.amount);
    const formattedAmount = absAmount.toFixed(2);
    const sign = posting.amount < 0 ? '-' : '';
    const amountStr = `${sign}${formattedAmount}`;
    const commodityStr = posting.currency ? ` ${posting.currency}` : '';
    const padding = ' '.repeat(Math.max(2, 22 - posting.account.length));
    lines.push(`  ${posting.account}${padding}${amountStr}${commodityStr}`);
  }

  return lines.join('\n');
}

export async function exportJournal(journalId) {
  const accounts = await getAllDocuments('account');
  const transactions = await getAllDocuments('transaction');

  const journalTxs = transactions.filter((tx) => tx.source_journal === journalId);

  const lines = [];

  for (const account of accounts) {
    const hledgerPath = buildAccountPath(account, accounts);
    lines.push(generateAccountBlock(hledgerPath, account, accounts));
    lines.push('');
  }

  for (const tx of journalTxs) {
    lines.push(generateTransactionBlock(tx));
    lines.push('');
  }

  return lines.join('\n');
}

function parseAccountLine(line) {
  const match = line.match(ACCOUNT_DECL_RE);
  if (!match) return null;
  return match[1].trim();
}

function parsePostingLine(line) {
  const trimmed = line.trim();
  const tokens = trimmed.split(/\s+/);
  let amountIndex = -1;

  for (let i = 0; i < tokens.length; i++) {
    if (tokens[i].match(/^-?\$?[\d,]+(\.\d+)?$/)) {
      amountIndex = i;
      break;
    }
  }

  if (amountIndex === -1) return null;

  const accountName = tokens.slice(0, amountIndex).join(' ');
  const amountStr = tokens[amountIndex];
  const rawCommodity = tokens[amountIndex + 1] || null;

  const parsed = parseHledgerAmount(amountStr);
  const commodity = rawCommodity || parsed.commodity;

  return { accountName, amount: parsed.amount, commodity };
}

export function importJournal(fileContent, journalId) {
  const lines = fileContent.split('\n');
  const accounts = [];
  const transactions = [];
  const accountMap = new Map();

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.match(/^\s*;/)) continue;
    if (line.trim() === '') continue;

    const accountPath = parseAccountLine(line);
    if (accountPath) {
      const parts = accountPath.split(':');
      const name = parts[parts.length - 1];
      const parentPath = parts.length > 1 ? parts.slice(0, -1).join(':') : null;

      if (!accountMap.has(accountPath)) {
        const parentName = parentPath ? parentPath.split(':')[parentPath.split(':').length - 1] : null;
        const parentDoc = parentPath && accountMap.get(parentPath) ? accountMap.get(parentPath) : (parentName ? accounts.find((a) => a.name === parentName) : null);

        const accountDoc = {
          _id: `account_${name.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase()}_${Date.now()}_${i}`,
          type: 'account',
          name,
          parent_account: parentPath || null,
          kind: inferKindFromPath(accountPath),
          currency: 'USD',
          created_at: new Date().toISOString(),
        };
        accountMap.set(accountPath, accountDoc);
        accounts.push(accountDoc);
      }

      if (parentPath) {
        const parentParts = parentPath.split(':');
        const parentName2 = parentParts[parentParts.length - 1];

        if (!accountMap.has(parentPath)) {
          const grandParentPath = parentParts.length > 1 ? parentParts.slice(0, -1).join(':') : null;
          const parentDoc = {
            _id: `account_${parentName2.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase()}_${Date.now()}_${i}`,
            type: 'account',
            name: parentName2,
            parent_account: grandParentPath,
            kind: inferKindFromPath(parentPath),
            currency: 'USD',
            created_at: new Date().toISOString(),
          };
          accountMap.set(parentPath, parentDoc);
          accounts.push(parentDoc);
        }
      }

      let j = i + 1;
      while (j < lines.length && lines[j].match(/^\s{2,}\S/)) {
        const propLine = lines[j].trim();
        const propMatch = propLine.match(/^(\w+):\s*(.+)$/);
        if (!propMatch) break;
        const key = propMatch[1];
        const value = propMatch[2].trim();
        const existingDoc = accountMap.get(accountPath);
        if (existingDoc) {
          if (key === 'currency') existingDoc.currency = value;
          if (key === 'description') existingDoc.description = value;
          if (key === 'kind') existingDoc.kind = value;
        }
        j++;
      }

      i = j - 1;
      continue;
    }

    const dateMatch = line.match(DATE_RE);
    if (dateMatch && !line.startsWith(' ') && !line.startsWith('\t')) {
      if (i > 0 && transactions.length > 0 && !transactions[transactions.length - 1].postings.length) {
        transactions.pop();
      }

      const date = dateMatch[0].replace(/\//g, '-');
      const description = line.substring(dateMatch[0].length).trim();

      const tx = {
        _id: `transaction_${date.replace(/-/g, '')}_${Date.now()}_${i}`,
        type: 'transaction',
        date,
        description,
        postings: [],
        source_journal: journalId,
        hledger_validated: false,
      };
      transactions.push(tx);
      continue;
    }

    if (transactions.length > 0 && line.match(/^\s{2,}\S/)) {
      const posting = parsePostingLine(line);
      if (posting && transactions[transactions.length - 1]) {
        transactions[transactions.length - 1].postings.push({
          account: posting.accountName,
          amount: posting.amount,
          currency: posting.commodity || 'USD',
        });
      }
    }
  }

  for (const tx of transactions) {
    const total = tx.postings.reduce((sum, p) => sum + p.amount, 0);
    tx.hledger_validated = Math.abs(total) < 0.001;
  }

  return { accounts, transactions };
}