import PouchDB from 'pouchdb';

export const db = new PouchDB('hledger_journals');

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
