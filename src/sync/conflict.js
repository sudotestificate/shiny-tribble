export function resolveConflict(localDoc, remoteDoc) {
  if (!localDoc && !remoteDoc) return null;
  if (!localDoc) return remoteDoc;
  if (!remoteDoc) return localDoc;

  const localRev = localDoc._rev || '';
  const remoteRev = remoteDoc._rev || '';

  if (localRev === remoteRev) return localDoc;

  const localSeq = parseRevSeq(localRev);
  const remoteSeq = parseRevSeq(remoteRev);

  if (localSeq >= remoteSeq) {
    return localDoc;
  }

  return remoteDoc;
}

function parseRevSeq(rev) {
  const parts = rev.split('-');
  const seq = parseInt(parts[0], 10);
  if (Number.isNaN(seq)) return 0;
  return seq;
}

export function lastWriteWins(docA, docB) {
  const revA = docA._rev || '';
  const revB = docB._rev || '';
  const seqA = parseRevSeq(revA);
  const seqB = parseRevSeq(revB);

  return seqA >= seqB ? docA : docB;
}

export function getWinningRev(doc) {
  if (!doc || !doc._rev) return null;
  return doc._rev;
}

export function hasConflict(doc) {
  if (!doc || !doc._conflicts) return false;
  return Array.isArray(doc._conflicts) && doc._conflicts.length > 0;
}

export function resolveAllConflicts(doc, allVersions) {
  if (!allVersions || allVersions.length === 0) return doc;

  return allVersions.reduce((winner, current) => {
    return lastWriteWins(winner, current);
  }, doc);
}