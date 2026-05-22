import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  deleteDoc, 
  query, 
  where 
} from 'firebase/firestore';
import fs from 'fs';
import path from 'path';

interface DbSchema {
  users: any[];
  inventaris: any[];
  proker: any[];
  piket: any[];
  settings: any[];
  wa_templates: any[];
}

// Load Firebase config from json
const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
if (!fs.existsSync(configPath)) {
  throw new Error('firebase-applet-config.json is missing. Please run set_up_firebase first.');
}
const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));

// Initialize Firebase App & Firestore
const app = initializeApp(firebaseConfig);
const firestoreDb = getFirestore(app, firebaseConfig.firestoreDatabaseId);

class FirestoreDatabaseEmulation {
  constructor() {
    // Run migration asynchronously to avoid blocking the main server thread
    this.ensureMigrated();
  }

  // Automatic migration during setup to preserve existing records
  private async ensureMigrated() {
    try {
      const snap = await getDocs(collection(firestoreDb, 'users'));
      if (snap.empty) {
        console.log('[Database] Firestore is empty. Starting migration from osim_db.json...');
        const localPath = path.resolve(process.cwd(), 'osim_db.json');
        if (fs.existsSync(localPath)) {
          const raw = fs.readFileSync(localPath, 'utf8');
          const localData: DbSchema = JSON.parse(raw);
          
          // Migrate users
          for (const u of localData.users || []) {
            await setDoc(doc(firestoreDb, 'users', String(u.id)), u);
          }
          // Migrate inventaris
          for (const item of localData.inventaris || []) {
            await setDoc(doc(firestoreDb, 'inventaris', String(item.id)), item);
          }
          // Migrate proker
          for (const item of localData.proker || []) {
            await setDoc(doc(firestoreDb, 'proker', String(item.id)), item);
          }
          // Migrate piket
          for (const item of localData.piket || []) {
            await setDoc(doc(firestoreDb, 'piket', String(item.id)), item);
          }
          // Migrate settings
          for (const item of localData.settings || []) {
            await setDoc(doc(firestoreDb, 'settings', item.key), item);
          }
          // Migrate wa_templates
          for (const item of localData.wa_templates || []) {
            await setDoc(doc(firestoreDb, 'wa_templates', String(item.id)), item);
          }
          console.log('[Database] Migration to Firestore completed successfully!');
        }
      } else {
        console.log('[Database] Firestore already contains data. Skipping migration.');
      }
    } catch (err) {
      console.error('[Database] Failed to run migration to Firestore:', err);
    }
  }

  serialize(callback: () => void) {
    callback();
  }

  get(queryString: string, params: any[], callback: (err: Error | null, row: any) => void) {
    const runAsync = async () => {
      const lowerQuery = queryString.toLowerCase().trim();
      if (lowerQuery.startsWith('select * from users where username = ?')) {
        const username = params[0];
        const q = query(collection(firestoreDb, 'users'), where('username', '==', username));
        const snap = await getDocs(q);
        if (!snap.empty) {
          return snap.docs[0].data();
        }
        return null;
      } else if (lowerQuery.startsWith('select * from users where id = ?')) {
        const id = params[0];
        const q = query(collection(firestoreDb, 'users'), where('id', '==', Number(id)));
        let snap = await getDocs(q);
        if (snap.empty) {
          const q2 = query(collection(firestoreDb, 'users'), where('id', '==', String(id)));
          snap = await getDocs(q2);
        }
        if (!snap.empty) {
          return snap.docs[0].data();
        }
        return null;
      } else {
        throw new Error('Query not supported on Firestore emulator: ' + queryString);
      }
    };

    runAsync()
      .then(result => callback(null, result))
      .catch(err => callback(err, null));
  }

  all(queryString: string, paramsOrCallback?: any, callback?: (err: Error | null, rows: any[]) => void) {
    let cb = callback;
    if (typeof paramsOrCallback === 'function') {
      cb = paramsOrCallback;
    }

    const runAsync = async () => {
      const lowerQuery = queryString.toLowerCase().trim();
      const match = lowerQuery.match(/select\s+\*\s+from\s+(\w+)/);
      if (match) {
        const tableName = match[1].toLowerCase();
        const snap = await getDocs(collection(firestoreDb, tableName));
        const rows = snap.docs.map(doc => doc.data());
        
        // Sort items by numeric ID if present
        rows.sort((a, b) => {
          if (a.id !== undefined && b.id !== undefined) {
            return Number(a.id) - Number(b.id);
          }
          return 0;
        });
        return rows;
      } else {
        throw new Error('Query not supported on Firestore emulator: ' + queryString);
      }
    };

    runAsync()
      .then(result => cb!(null, result))
      .catch(err => cb!(err, []));
  }

  run(queryString: string, paramsOrCallback?: any, callback?: (err: Error | null) => void) {
    let params: any[] = [];
    let cb = callback;
    if (typeof paramsOrCallback === 'function') {
      cb = paramsOrCallback;
    } else if (Array.isArray(paramsOrCallback)) {
      params = paramsOrCallback;
    }

    const context = {
      lastID: 0,
      changes: 0
    };

    const runAsync = async () => {
      const lowerQuery = queryString.toLowerCase().trim();

      if (lowerQuery.startsWith('insert into users')) {
        const snap = await getDocs(collection(firestoreDb, 'users'));
        const ids = snap.docs.map(d => Number(d.data().id) || 0);
        const id = ids.length ? Math.max(...ids) + 1 : 1;
        
        const newUser = { id, username: params[0], password: params[1], role: params[2] };
        await setDoc(doc(firestoreDb, 'users', String(id)), newUser);
        
        context.lastID = id;
        context.changes = 1;

      } else if (lowerQuery.startsWith('insert or replace into settings')) {
        const key = params[0];
        const value = params[1];
        await setDoc(doc(firestoreDb, 'settings', key), { key, value });
        context.changes = 1;

      } else if (lowerQuery.startsWith('insert into')) {
        const tableMatch = queryString.match(/insert\s+into\s+(\w+)/i);
        if (tableMatch) {
          const tableName = tableMatch[1].toLowerCase();
          
          const snap = await getDocs(collection(firestoreDb, tableName));
          const ids = snap.docs.map(d => Number(d.data().id) || 0);
          const id = ids.length ? Math.max(...ids) + 1 : 1;
          
          const fieldsMatch = queryString.match(/\(([^)]+)\)/);
          if (fieldsMatch) {
            const fields = fieldsMatch[1].split(',').map(s => s.trim());
            const newItem: any = {};
            newItem.id = id;
            fields.forEach((field, i) => {
              newItem[field] = params[i];
            });
            
            await setDoc(doc(firestoreDb, tableName, String(id)), newItem);
            context.lastID = id;
            context.changes = 1;
          }
        }

      } else if (lowerQuery.startsWith('update')) {
        const tableMatch = queryString.match(/update\s+(\w+)/i);
        if (tableMatch) {
          const tableName = tableMatch[1].toLowerCase();
          const id = params[params.length - 1];
          const fieldsPart = queryString.split(/set/i)[1].split(/where/i)[0];
          const fields = fieldsPart.split(',').map(s => s.split('=')[0].trim());
          
          const docRef = doc(firestoreDb, tableName, String(id));
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            const existingItem = docSnap.data();
            fields.forEach((field, i) => {
              existingItem[field] = params[i];
            });
            await setDoc(docRef, existingItem);
            context.changes = 1;
          } else {
            const q = query(collection(firestoreDb, tableName), where('id', '==', Number(id)));
            let snap = await getDocs(q);
            if (snap.empty) {
              const q2 = query(collection(firestoreDb, tableName), where('id', '==', String(id)));
              snap = await getDocs(q2);
            }
            if (!snap.empty) {
              const ref = snap.docs[0].ref;
              const existingItem = snap.docs[0].data();
              fields.forEach((field, i) => {
                existingItem[field] = params[i];
              });
              await setDoc(ref, existingItem);
              context.changes = 1;
            }
          }
        }

      } else if (lowerQuery.startsWith('delete from')) {
        const tableMatch = queryString.match(/delete\s+from\s+(\w+)/i);
        if (tableMatch) {
          const tableName = tableMatch[1].toLowerCase();
          const id = params[0];
          
          const docRef = doc(firestoreDb, tableName, String(id));
          await deleteDoc(docRef);
          
          const q = query(collection(firestoreDb, tableName), where('id', '==', Number(id)));
          let snap = await getDocs(q);
          if (snap.empty) {
            const q2 = query(collection(firestoreDb, tableName), where('id', '==', String(id)));
            snap = await getDocs(q2);
          }
          if (!snap.empty) {
            await deleteDoc(snap.docs[0].ref);
          }
          
          context.changes = 1;
        }
      }
    };

    runAsync()
      .then(() => {
        if (cb) cb.call(context, null);
      })
      .catch((err) => {
        if (cb) cb.call(context, err);
      });
  }
}

export const dbInit = () => {
  return new FirestoreDatabaseEmulation();
};
