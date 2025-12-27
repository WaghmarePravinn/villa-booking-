
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  onSnapshot,
  query, 
  orderBy,
  writeBatch,
  getDocs
} from "firebase/firestore";
import { db } from "./firebase";
import { Villa } from "../types";
import { INITIAL_VILLAS } from "../constants";

const VILLAS_COLLECTION = "villas";

/**
 * Sets up a real-time listener for the villas collection.
 * This is the "Always Syncing" core.
 */
export const subscribeToVillas = (callback: (villas: Villa[]) => void) => {
  const q = query(collection(db, VILLAS_COLLECTION), orderBy("name"));
  
  return onSnapshot(q, (snapshot) => {
    const villas: Villa[] = [];
    snapshot.forEach((doc) => {
      villas.push({ id: doc.id, ...doc.data() } as Villa);
    });
    
    // If database is empty, we don't auto-seed here to avoid loops, 
    // but the app will show the 'Seed' button in Admin.
    callback(villas);
  }, (error) => {
    console.error("Firestore sync error:", error);
  });
};

export const createVilla = async (villa: Omit<Villa, 'id'>): Promise<string> => {
  const docRef = await addDoc(collection(db, VILLAS_COLLECTION), villa);
  return docRef.id;
};

export const updateVillaById = async (id: string, villa: Partial<Villa>): Promise<void> => {
  const villaRef = doc(db, VILLAS_COLLECTION, id);
  const { id: _, ...payload } = villa as any;
  await updateDoc(villaRef, payload);
};

export const deleteVillaById = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, VILLAS_COLLECTION, id));
};

export const seedDatabase = async (): Promise<void> => {
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
    console.error("Firestore seeding failed:", error.message);
  }
};
