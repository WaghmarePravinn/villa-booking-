
import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  orderBy,
  writeBatch
} from "firebase/firestore";
import { db } from "./firebase";
import { Villa } from "../types";
import { INITIAL_VILLAS } from "../constants";

const VILLAS_COLLECTION = "villas";
const LOCAL_STORAGE_KEY = "peak_stay_villas_backup";

/**
 * Helper to get data from local storage as a fallback
 */
const getLocalVillas = (): Villa[] => {
  const data = localStorage.getItem(LOCAL_STORAGE_KEY);
  return data ? JSON.parse(data) : INITIAL_VILLAS;
};

/**
 * Helper to save data to local storage
 */
const saveLocalVillas = (villas: Villa[]) => {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(villas));
};

export const getVillas = async (): Promise<Villa[]> => {
  try {
    const q = query(collection(db, VILLAS_COLLECTION), orderBy("name"));
    const querySnapshot = await getDocs(q);
    const villas: Villa[] = [];
    querySnapshot.forEach((doc) => {
      villas.push({ id: doc.id, ...doc.data() } as Villa);
    });
    
    // If successfully fetched, sync to local storage for future offline use
    if (villas.length > 0) {
      saveLocalVillas(villas);
    }
    
    return villas.length > 0 ? villas : getLocalVillas();
  } catch (error: any) {
    console.warn("Firestore access failed (likely permissions or network). Falling back to Local Storage.", error.message);
    return getLocalVillas();
  }
};

export const createVilla = async (villa: Omit<Villa, 'id'>): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, VILLAS_COLLECTION), villa);
    const newVillas = [...getLocalVillas(), { ...villa, id: docRef.id } as Villa];
    saveLocalVillas(newVillas);
    return docRef.id;
  } catch (error: any) {
    console.warn("Firestore create failed. Saving to Local Storage only.", error.message);
    const id = "local_" + Date.now();
    const newVillas = [...getLocalVillas(), { ...villa, id } as Villa];
    saveLocalVillas(newVillas);
    return id;
  }
};

export const updateVillaById = async (id: string, villa: Partial<Villa>): Promise<void> => {
  try {
    const villaRef = doc(db, VILLAS_COLLECTION, id);
    const { id: _, ...payload } = villa as any;
    
    // Only attempt Firestore update if it's not a local-only ID
    if (!id.startsWith("local_")) {
      await updateDoc(villaRef, payload);
    }
    
    const localVillas = getLocalVillas();
    const updated = localVillas.map(v => v.id === id ? { ...v, ...villa } : v);
    saveLocalVillas(updated as Villa[]);
  } catch (error: any) {
    console.warn("Firestore update failed. Syncing Local Storage only.", error.message);
    const localVillas = getLocalVillas();
    const updated = localVillas.map(v => v.id === id ? { ...v, ...villa } : v);
    saveLocalVillas(updated as Villa[]);
  }
};

export const deleteVillaById = async (id: string): Promise<void> => {
  try {
    if (!id.startsWith("local_")) {
      await deleteDoc(doc(db, VILLAS_COLLECTION, id));
    }
    const filtered = getLocalVillas().filter(v => v.id !== id);
    saveLocalVillas(filtered);
  } catch (error: any) {
    console.warn("Firestore delete failed. Updating Local Storage only.", error.message);
    const filtered = getLocalVillas().filter(v => v.id !== id);
    saveLocalVillas(filtered);
  }
};

export const seedDatabase = async (): Promise<void> => {
  // Always reset Local Storage on seed
  saveLocalVillas(INITIAL_VILLAS);

  try {
    const querySnapshot = await getDocs(collection(db, VILLAS_COLLECTION));
    const batch = writeBatch(db);
    querySnapshot.forEach((document) => {
      batch.delete(doc(db, VILLAS_COLLECTION, document.id));
    });
    await batch.commit();

    for (const villa of INITIAL_VILLAS) {
      const { id, ...data } = villa;
      await addDoc(collection(db, VILLAS_COLLECTION), data);
    }
  } catch (error: any) {
    console.warn("Firestore seeding failed. Local Storage has been reset to defaults.", error.message);
  }
};
