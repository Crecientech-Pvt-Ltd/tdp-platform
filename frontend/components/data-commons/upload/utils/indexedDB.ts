interface StoredFile {
  id: string;
  filename: string;
  content: string;
  type: string;
  uploadedAt: number;
}

const DB_NAME = 'DataCommonsUploads';
const DB_VERSION = 2; //version of the current database
const STORE_NAME = 'uploadedFiles';
const MAX_FILE_AGE_HOURS = 10; //max age of the file - 10hrs

class IndexedDBManager {
  private db: IDBDatabase | null = null;
  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = async () => {
        this.db = request.result;
        try {
          if (!this.db.objectStoreNames.contains(STORE_NAME)) {
            this.db.close();
            await this.deleteDatabase();
            await this.init();
            return;
          }
          await this.validateAndCleanup();
          resolve();
        } catch (error) {
          console.error('Error validating database:', error);
          this.db.close();
          await this.deleteDatabase();
          await this.init();
        }
      };

      request.onupgradeneeded = event => {
        const db = (event.target as IDBOpenDBRequest).result;
        const oldVersion = event.oldVersion;
        const transaction = (event.target as IDBOpenDBRequest).transaction!;
        try {
          //check for old database versions
          if (oldVersion === 1) {
            if (db.objectStoreNames.contains(STORE_NAME)) {
              const store = transaction.objectStore(STORE_NAME);
              store.clear();
              const indexesToRemove: string[] = [];
              for (let i = 0; i < store.indexNames.length; i++) {
                const indexName = store.indexNames[i];
                if (indexName !== 'type' && indexName !== 'uploadedAt') {
                  indexesToRemove.push(indexName);
                }
              }
              indexesToRemove.forEach(indexName => {
                store.deleteIndex(indexName);
              });
            }
          }
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
            store.createIndex('type', 'type', { unique: false });
            store.createIndex('uploadedAt', 'uploadedAt', { unique: false });
          } else {
            const store = transaction.objectStore(STORE_NAME);
            if (!store.indexNames.contains('type')) {
              store.createIndex('type', 'type', { unique: false });
            }
            if (!store.indexNames.contains('uploadedAt')) {
              store.createIndex('uploadedAt', 'uploadedAt', { unique: false });
            }
          }
        } catch (error) {
          console.error('Error during upgrade:', error);
        }
      };
    });
  }
  private async deleteDatabase(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.deleteDatabase(DB_NAME);
      request.onsuccess = () => {
        resolve();
      };
      request.onerror = () => {
        console.error('Error deleting database:', request.error);
        reject(request.error);
      };
      request.onblocked = () => {
        setTimeout(() => resolve(), 1000);
      };
    });
  }

  private isValidStoredFile(file: any): file is StoredFile {
    return (
      typeof file === 'object' &&
      file !== null &&
      typeof file.id === 'string' &&
      typeof file.filename === 'string' &&
      typeof file.content === 'string' &&
      typeof file.type === 'string' &&
      typeof file.uploadedAt === 'number'
    );
  }

  private async validateAndCleanup(): Promise<void> {
    if (!this.db) return;
    try {
      const allFiles = await this.getAllFilesRaw();
      const now = Date.now();
      const maxAge = MAX_FILE_AGE_HOURS * 60 * 60 * 1000;
      const filesToDelete: string[] = [];

      for (const file of allFiles) {
        if (!this.isValidStoredFile(file)) {
          if (file.id) {
            filesToDelete.push(file.id);
          }
          continue;
        }
        if (now - file.uploadedAt > maxAge) {
          filesToDelete.push(file.id);
        }
      }
      if (filesToDelete.length > 0) {
        for (const id of filesToDelete) {
          await this.deleteFile(id);
        }
      }
    } catch (error) {
      console.error('Error during validation and cleanup:', error);
    }
  }

  private async getAllFilesRaw(): Promise<any[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || []);
    });
  }

  async storeFile(filename: string, content: string, type: string): Promise<string> {
    if (!this.db) await this.init();

    const id = `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const file: StoredFile = {
      id,
      filename,
      content,
      type,
      uploadedAt: Date.now(),
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.add(file);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(id);
    });
  }

  async getFile(id: string): Promise<StoredFile | null> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const file = request.result;
        if (file && this.isValidStoredFile(file)) {
          resolve(file);
        } else {
          if (file) {
            this.deleteFile(id).catch(console.error);
          }
          resolve(null);
        }
      };
    });
  }

  async deleteFile(id: string): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async clearAll(): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async getAllFiles(): Promise<StoredFile[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const files = request.result || [];
        const validFiles = files.filter((file: any) => this.isValidStoredFile(file));
        resolve(validFiles);
      };
    });
  }

  async getFilesByType(type: string): Promise<StoredFile[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index('type');
      const request = index.getAll(type);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const files = request.result || [];
        const validFiles = files.filter((file: any) => this.isValidStoredFile(file));
        resolve(validFiles);
      };
    });
  }

  async cleanupOrphanedFiles(): Promise<number> {
    if (!this.db) await this.init();

    const allFiles = await this.getAllFiles();
    const now = Date.now();
    const maxAge = MAX_FILE_AGE_HOURS * 60 * 60 * 1000;
    let deletedCount = 0;

    for (const file of allFiles) {
      if (now - file.uploadedAt > maxAge) {
        await this.deleteFile(file.id);
        deletedCount++;
      }
    }

    return deletedCount;
  }
}

export const indexedDBManager = new IndexedDBManager();
