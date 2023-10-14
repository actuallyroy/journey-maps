class InMemoryDB {
  constructor() {
    this.databases = {};
  }

  open(name, version) {
    if (!this.databases[name]) {
      this.databases[name] = {
        name,
        version,
        objectStores: {},
      };
    }
    console.log(`Opening in-memory database: ${name} (version: ${version})`);
    return this;
  }

  createObjectStore(dbName, name, options = {}) {
    const db = this.databases[dbName];
    db.objectStores[name] = {
      name,
      keyPath: options.keyPath || null,
      autoIncrement: options.autoIncrement || false,
      data: {},
    };
  }

  transaction(dbName, storeName, mode = 'readonly') {
    const db = this.databases[dbName];
    const store = db.objectStores[storeName];
    if (!store) {
      throw new Error(`Object store not found: ${storeName}`);
    }
    return new InMemoryTransaction(store, mode);
  }

  // ... (Implement other IndexedDB methods such as deleteDatabase, deleteObjectStore, etc.)
}

class InMemoryTransaction {
  constructor(store, mode) {
    this.store = store;
    this.mode = mode;
  }

  objectStore(name) {
    if (this.store.name !== name) {
      throw new Error(`Object store not found: ${name}`);
    }
    return new InMemoryObjectStore(this.store);
  }
}

class InMemoryObjectStore {
  constructor(store) {
    this.store = store;
  }

  add(data, key) {
    if (this.store.keyPath) {
      key = data[this.store.keyPath];
    }
    if (!key) {
      throw new Error('Key is not provided');
    }
    this.store.data[key] = data;
  }

  // ... (Implement other methods like get, put, delete, etc.)
}

// Usage example:
// const safeIndexedDB = new SafeIndexedDB();
// const picker = new EmojiPicker({ indexedDB: safeIndexedDB.getDB() });
//
// document.body.appendChild(picker);
//
// picker.addEventListener('emoji-pick', event => {
//   console.log(event.detail); // { emoji: '🍍', name: 'pineapple' }
// });

export default InMemoryDB