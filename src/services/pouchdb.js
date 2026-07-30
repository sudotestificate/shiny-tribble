import PouchDB from 'pouchdb-browser';
import PouchDBHttp from 'pouchdb-adapter-http';
import PouchDBIdb from 'pouchdb-adapter-idb';

PouchDB.plugin(PouchDBHttp);
PouchDB.plugin(PouchDBIdb);

export { PouchDB };
export const db = new PouchDB('hledger_journals', { adapter: 'idb' });

export async function getAllDocuments(docType) {
  try {
    const result = await db.allDocs({
      include_docs: true,
      startkey: `${docType}_`,
      endkey: `${docType}_\u9999`,
    });
    return result.rows.map(row => row.doc).filter(Boolean);
  } catch (error) {
    console.error(`Error fetching ${docType}s:`, error);
    return [];
  }
}

export async function saveDocument(doc) {
  try {
    const response = await db.put(doc);
    return response;
  } catch (error) {
    console.error('Error saving document:', error);
    throw error;
  }
}

export async function deleteDocument(id, rev) {
  try {
    await db.remove({ _id: id, _rev: rev });
  } catch (error) {
    console.error('Error deleting document:', error);
    throw error;
  }
}

export async function getDocumentsForJournal(docType, journalName) {
  const all = await getAllDocuments(docType);
  return all.filter(doc => doc.source_journal === journalName);
}
