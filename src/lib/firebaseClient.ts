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
import bcrypt from 'bcryptjs';

// Import configuration from the root JSON file
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize the Firebase client app and firestore
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

/**
 * ----------------- AUTHENTICATION & SEEDING -----------------
 */

interface User {
  id: number;
  username: string;
  role: string;
  password?: string;
  nomor_wa?: string;
}

// Ensures an administrative user exists in Firestore
export async function seedInitialAdmin() {
  try {
    const q = query(collection(db, 'users'), where('username', '==', 'admin'));
    const snap = await getDocs(q);
    if (snap.empty) {
      console.log('[Firebase Client] Seeding initial admin account...');
      const salt = bcrypt.genSaltSync(10);
      const hashedPassword = bcrypt.hashSync('admin123', salt);
      const adminUser = {
        id: Date.now(), // Generate unique numeric ID
        username: 'admin',
        password: hashedPassword,
        role: 'admin'
      };
      await setDoc(doc(db, 'users', String(adminUser.id)), adminUser);
      console.log('[Firebase Client] Admin seeded successfully! User: admin | Pass: admin123');
    }
  } catch (err) {
    console.error('[Firebase Client] Error seeding admin:', err);
  }
}

// Perform client-side user login using Firestore
export async function clientLogin(username: string, passwordInput: string): Promise<User> {
  const q = query(collection(db, 'users'), where('username', '==', username));
  const snap = await getDocs(q);
  if (snap.empty) {
    throw new Error('User tidak ditemukan');
  }

  const userDoc = snap.docs[0].data() as User;
  if (!userDoc.password) {
    throw new Error('User data is corrupted or lacks a password');
  }

  const isMatch = bcrypt.compareSync(passwordInput, userDoc.password);
  if (!isMatch) {
    throw new Error('Password salah');
  }

  return {
    id: userDoc.id,
    username: userDoc.username,
    role: userDoc.role
  };
}

/**
 * ----------------- SETTINGS OPERATIONS -----------------
 */

export async function clientGetSettings(): Promise<Record<string, any>> {
  try {
    const snap = await getDocs(collection(db, 'settings'));
    const settings: Record<string, any> = {};
    snap.docs.forEach((d) => {
      const data = d.data();
      if (data.key) {
        settings[data.key] = data.value;
      }
    });
    return settings;
  } catch (err) {
    console.error('[Firebase Client] Error loading settings:', err);
    return {};
  }
}

export async function clientSaveSetting(key: string, value: any): Promise<void> {
  await setDoc(doc(db, 'settings', key), { key, value });
}

/**
 * ----------------- USER MANAGE OPERATIONS -----------------
 */

export async function clientGetUsers(): Promise<User[]> {
  const snap = await getDocs(collection(db, 'users'));
  return snap.docs.map(d => {
    const data = d.data();
    return {
      id: Number(data.id),
      username: data.username,
      role: data.role,
      nomor_wa: data.nomor_wa || ''
    };
  });
}

export async function clientAddUser(user: Partial<User>): Promise<void> {
  if (!user.username || !user.password) {
    throw new Error('Username dan password harus diisi');
  }
  const id = Date.now();
  const salt = bcrypt.genSaltSync(10);
  const hashedPassword = bcrypt.hashSync(user.password, salt);
  const newUser = {
    id,
    username: user.username,
    password: hashedPassword,
    role: user.role || 'user',
    nomor_wa: user.nomor_wa || ''
  };
  await setDoc(doc(db, 'users', String(id)), newUser);
}

export async function clientUpdateUser(id: number, data: Partial<User>): Promise<void> {
  const docRef = doc(db, 'users', String(id));
  const snap = await getDoc(docRef);
  if (!snap.exists()) {
    throw new Error('User tidak ditemukan');
  }
  const existing = snap.data();
  const updateData: any = {
    ...existing,
    username: data.username || existing.username,
    role: data.role || existing.role,
    nomor_wa: data.nomor_wa !== undefined ? data.nomor_wa : (existing.nomor_wa || '')
  };
  if (data.password) {
    const salt = bcrypt.genSaltSync(10);
    updateData.password = bcrypt.hashSync(data.password, salt);
  }
  await setDoc(docRef, updateData);
}

export async function clientDeleteUser(id: number): Promise<void> {
  const docRef = doc(db, 'users', String(id));
  const snap = await getDoc(docRef);
  if (snap.exists() && snap.data().username === 'admin') {
    throw new Error('Tidak bisa menghapus akun admin utama');
  }
  await deleteDoc(docRef);
}

/**
 * ----------------- KATEGORI OPERATIONS -----------------
 */

export interface CategoryItem {
  id: number;
  nama: string;
}

export async function seedInitialCategories() {
  try {
    const snap = await getDocs(collection(db, 'categories'));
    if (snap.empty) {
      console.log('[Firebase Client] Seeding initial categories...');
      const defaultCategories = ['Elektronik', 'ATK', 'Furnitur'];
      for (const [index, cat] of defaultCategories.entries()) {
        const id = Date.now() + index;
        await setDoc(doc(db, 'categories', String(id)), { id, nama: cat });
      }
      console.log('[Firebase Client] Categories seeded successfully!');
    }
  } catch (err) {
    console.error('[Firebase Client] Error seeding categories:', err);
  }
}

export async function clientGetCategories(): Promise<CategoryItem[]> {
  const snap = await getDocs(collection(db, 'categories'));
  return snap.docs.map(d => {
    const data = d.data();
    return {
      id: Number(data.id),
      nama: data.nama || ''
    };
  }).sort((a, b) => b.id - a.id);
}

export async function clientAddCategory(item: Omit<CategoryItem, 'id'>): Promise<void> {
  const id = Date.now();
  await setDoc(doc(db, 'categories', String(id)), {
    id,
    ...item
  });
}

export async function clientDeleteCategory(id: number): Promise<void> {
  await deleteDoc(doc(db, 'categories', String(id)));
}

export async function clientUpdateCategory(id: number, item: Partial<Omit<CategoryItem, 'id'>>): Promise<void> {
  const docRef = doc(db, 'categories', String(id));
  const snap = await getDoc(docRef);
  if (!snap.exists()) {
    throw new Error('Kategori tidak ditemukan');
  }
  const existing = snap.data();
  await setDoc(docRef, {
    ...existing,
    ...item
  });
}

/**
 * ----------------- INVENTARIS OPERATIONS -----------------
 */

export interface InventarisItem {
  id: number;
  nama: string;
  kategori: string;
  kondisi: string;
  status: string;
}

export async function clientGetInventaris(): Promise<InventarisItem[]> {
  const snap = await getDocs(collection(db, 'inventaris'));
  return snap.docs.map(d => {
    const data = d.data();
    return {
      id: Number(data.id),
      nama: data.nama || '',
      kategori: data.kategori || '',
      kondisi: data.kondisi || '',
      status: data.status || ''
    };
  }).sort((a, b) => b.id - a.id);
}

export async function clientAddInventaris(item: Omit<InventarisItem, 'id'>): Promise<void> {
  const id = Date.now();
  await setDoc(doc(db, 'inventaris', String(id)), {
    id,
    ...item
  });
}

export async function clientDeleteInventaris(id: number): Promise<void> {
  await deleteDoc(doc(db, 'inventaris', String(id)));
}

export async function clientUpdateInventaris(id: number, item: Partial<Omit<InventarisItem, 'id'>>): Promise<void> {
  const docRef = doc(db, 'inventaris', String(id));
  const snap = await getDoc(docRef);
  if (!snap.exists()) {
    throw new Error('Barang tidak ditemukan');
  }
  const existing = snap.data();
  await setDoc(docRef, {
    ...existing,
    ...item
  });
}

/**
 * ----------------- PIKET OPERATIONS -----------------
 */

export interface PiketItem {
  id: number;
  nama: string;
  hari: string;
  tanggal: string;
  jam: string;
  tugas: string;
  nomor_wa: string;
}

export async function clientGetPiket(): Promise<PiketItem[]> {
  const snap = await getDocs(collection(db, 'piket'));
  return snap.docs.map(d => {
    const data = d.data();
    return {
      id: Number(data.id),
      nama: data.nama || '',
      hari: data.hari || '',
      tanggal: data.tanggal || '',
      jam: data.jam || '',
      tugas: data.tugas || '',
      nomor_wa: data.nomor_wa || ''
    };
  }).sort((a, b) => b.id - a.id);
}

export async function clientAddPiket(item: Omit<PiketItem, 'id'>): Promise<void> {
  const id = Date.now();
  await setDoc(doc(db, 'piket', String(id)), {
    id,
    ...item
  });
}

export async function clientDeletePiket(id: number): Promise<void> {
  await deleteDoc(doc(db, 'piket', String(id)));
}

/**
 * ----------------- PROKER OPERATIONS -----------------
 */

export interface ProkerItem {
  id: number;
  nama: string;
  pj: string;
  tanggal_mulai: string;
  tanggal_selesai: string;
  deskripsi: string;
  status: string;
}

export async function clientGetProker(): Promise<ProkerItem[]> {
  const snap = await getDocs(collection(db, 'proker'));
  return snap.docs.map(d => {
    const data = d.data();
    return {
      id: Number(data.id),
      nama: data.nama || '',
      pj: data.pj || '',
      tanggal_mulai: data.tanggal_mulai || '',
      tanggal_selesai: data.tanggal_selesai || '',
      deskripsi: data.deskripsi || '',
      status: data.status || ''
    };
  }).sort((a, b) => b.id - a.id);
}

export async function clientAddProker(item: Omit<ProkerItem, 'id'>): Promise<void> {
  const id = Date.now();
  await setDoc(doc(db, 'proker', String(id)), {
    id,
    ...item
  });
}

export async function clientDeleteProker(id: number): Promise<void> {
  await deleteDoc(doc(db, 'proker', String(id)));
}
