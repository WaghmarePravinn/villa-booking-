
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  onSnapshot, 
  query, 
  orderBy 
} from "firebase/firestore";
import { db } from "./firebase";
import { Lead } from "../types";

const LEADS_COLLECTION = "leads";

export const subscribeToLeads = (callback: (leads: Lead[]) => void) => {
  const q = query(collection(db, LEADS_COLLECTION), orderBy("timestamp", "desc"));
  
  return onSnapshot(q, (snapshot) => {
    const leads: Lead[] = [];
    snapshot.forEach((doc) => {
      leads.push({ id: doc.id, ...doc.data() } as Lead);
    });
    callback(leads);
  });
};

export const saveLead = async (lead: Omit<Lead, 'id' | 'timestamp' | 'status'>): Promise<string> => {
  const newLead = {
    ...lead,
    timestamp: new Date().toLocaleString(),
    status: 'new'
  };
  const docRef = await addDoc(collection(db, LEADS_COLLECTION), newLead);
  return docRef.id;
};

export const updateLeadStatus = async (id: string, status: Lead['status']): Promise<void> => {
  const leadRef = doc(db, LEADS_COLLECTION, id);
  await updateDoc(leadRef, { status });
};

export const deleteLead = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, LEADS_COLLECTION, id));
};
