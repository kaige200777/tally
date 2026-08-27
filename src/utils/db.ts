import type { Record, Ledger, Settings } from '../types';

const normalizeDate = (dateStr: string): string => {
  if (!dateStr) return dateStr;
  const match = String(dateStr).match(/^(\d{4})[-./](\d{1,2})[-./](\d{1,2})$/);
  if (match) {
    return `${match[1]}-${String(match[2]).padStart(2, '0')}-${String(match[3]).padStart(2, '0')}`;
  }
  const date = new Date(dateStr);
  if (!isNaN(date.getTime())) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }
  return dateStr;
};

const DB_NAME = 'RenQingDB';
const DB_VERSION = 1;

let db: IDBDatabase | null = null;

export const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (db) {
      resolve(db);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(request.error);
    };

    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;

      if (!database.objectStoreNames.contains('records')) {
        const recordStore = database.createObjectStore('records', { keyPath: 'id' });
        recordStore.createIndex('type', 'type', { unique: false });
        recordStore.createIndex('person', 'person', { unique: false });
        recordStore.createIndex('date', 'date', { unique: false });
        recordStore.createIndex('occasion', 'occasion', { unique: false });
      }

      if (!database.objectStoreNames.contains('ledgers')) {
        const ledgerStore = database.createObjectStore('ledgers', { keyPath: 'id' });
        ledgerStore.createIndex('name', 'name', { unique: false });
      }

      if (!database.objectStoreNames.contains('settings')) {
        database.createObjectStore('settings', { keyPath: 'id' });
      }
    };
  });
};

export const addRecord = async (record: Record): Promise<void> => {
  const database = await initDB();
  const normalizedRecord = { ...record, date: normalizeDate(record.date) };
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['records'], 'readwrite');
    const store = transaction.objectStore('records');
    const request = store.put(normalizedRecord);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const getAllRecords = async (): Promise<Record[]> => {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['records'], 'readonly');
    const store = transaction.objectStore('records');
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const deleteRecord = async (id: string): Promise<void> => {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['records'], 'readwrite');
    const store = transaction.objectStore('records');
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const addLedger = async (ledger: Ledger): Promise<void> => {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['ledgers'], 'readwrite');
    const store = transaction.objectStore('ledgers');
    const request = store.put(ledger);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const updateLedger = async (ledger: Ledger): Promise<void> => {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['ledgers'], 'readwrite');
    const store = transaction.objectStore('ledgers');
    const request = store.put(ledger);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const getAllLedgers = async (): Promise<Ledger[]> => {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['ledgers'], 'readonly');
    const store = transaction.objectStore('ledgers');
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const deleteLedger = async (id: string): Promise<void> => {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['ledgers'], 'readwrite');
    const store = transaction.objectStore('ledgers');
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const saveSettings = async (settings: Settings): Promise<void> => {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['settings'], 'readwrite');
    const store = transaction.objectStore('settings');
    const request = store.put(settings);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const getSettings = async (): Promise<Settings | undefined> => {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['settings'], 'readonly');
    const store = transaction.objectStore('settings');
    const request = store.get('settings');

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const exportDatabase = async (): Promise<string> => {
  const records = await getAllRecords();
  const ledgers = await getAllLedgers();
  const settings = await getSettings();
  
  return JSON.stringify({ records, ledgers, settings }, null, 2);
};

export const importDatabase = async (data: string): Promise<void> => {
  const parsed = JSON.parse(data);
  
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['records', 'ledgers', 'settings'], 'readwrite');
    
    const recordStore = transaction.objectStore('records');
    recordStore.clear();
    parsed.records?.forEach((record: Record) => {
      recordStore.put({ ...record, date: normalizeDate(record.date) });
    });

    const ledgerStore = transaction.objectStore('ledgers');
    ledgerStore.clear();
    parsed.ledgers?.forEach((ledger: Ledger) => ledgerStore.put(ledger));

    const settingsStore = transaction.objectStore('settings');
    parsed.settings && settingsStore.put(parsed.settings);

    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
};
