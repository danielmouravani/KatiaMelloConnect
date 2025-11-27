import { Referral, ReferralStatus } from '../types';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, query, orderBy, doc, updateDoc } from 'firebase/firestore';

// --- CONFIGURAÇÃO DO FIREBASE ---
// Configuração limpa e direta com os dados fornecidos
const firebaseConfig = {
  apiKey: "AIzaSyD8W6RKjdX_z5BU6Hm5gFj7MDGrSMXBh3M",
  authDomain: "cirurgias-7b11a.firebaseapp.com",
  projectId: "cirurgias-7b11a",
  storageBucket: "cirurgias-7b11a.appspot.com"
};

// Inicializa Firebase
let db: any = null;

try {
  const app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  console.log("Firebase conectado ao projeto:", firebaseConfig.projectId);
} catch (error) {
  console.error("Erro crítico ao inicializar Firebase:", error);
}

const COLLECTION_NAME = 'mediconnect_referrals';

export const saveReferral = async (referral: Referral): Promise<void> => {
  if (!db) {
    // Tenta reinicializar ou lança erro
    try {
       const app = initializeApp(firebaseConfig);
       db = getFirestore(app);
    } catch(e) {
       throw new Error("Erro de conexão: Banco de dados não inicializado. Recarregue a página.");
    }
  }

  try {
    const { id, ...dataToSave } = referral;
    
    // Garantir que status padrão seja salvo
    if (!dataToSave.status) {
      dataToSave.status = 'pending';
    }
    
    // Garantir que checklist exista
    if (!dataToSave.checklist) {
      dataToSave.checklist = {};
    }

    // Garantir que checklistNotes exista
    if (!dataToSave.checklistNotes) {
      dataToSave.checklistNotes = {};
    }
    
    await addDoc(collection(db, COLLECTION_NAME), dataToSave);
  } catch (e: any) {
    console.error("Erro ao salvar no Firebase", e);
    if (e.code === 'permission-denied') {
      throw new Error("Permissão negada. Verifique se as regras do Firestore estão como 'allow read, write: if true;'");
    }
    throw new Error("Erro ao salvar indicação. Verifique sua conexão.");
  }
};

export const updateReferralStatus = async (id: string, status: ReferralStatus, note?: string): Promise<void> => {
  if (!db) throw new Error("Banco de dados não conectado");

  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, {
      status,
      note: note || ''
    });
  } catch (e: any) {
    console.error("Erro ao atualizar status", e);
    throw e;
  }
};

export const updateReferralChecklist = async (id: string, checklist: Record<string, boolean>): Promise<void> => {
  if (!db) throw new Error("Banco de dados não conectado");

  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, {
      checklist
    });
  } catch (e: any) {
    console.error("Erro ao atualizar checklist", e);
    throw e;
  }
};

export const updateReferralChecklistNotes = async (id: string, checklistNotes: Record<string, string>): Promise<void> => {
  if (!db) throw new Error("Banco de dados não conectado");

  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, {
      checklistNotes
    });
  } catch (e: any) {
    console.error("Erro ao atualizar notas do checklist", e);
    throw e;
  }
};

export const updateReferralInsurance = async (id: string, insurance: string): Promise<void> => {
  if (!db) throw new Error("Banco de dados não conectado");

  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, {
      insurance
    });
  } catch (e: any) {
    console.error("Erro ao atualizar convênio", e);
    throw e;
  }
};

export const getReferrals = async (): Promise<Referral[]> => {
  if (!db) return [];

  try {
    const q = query(collection(db, COLLECTION_NAME), orderBy("timestamp", "desc"));
    const querySnapshot = await getDocs(q);
    
    const referrals: Referral[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      referrals.push({
        id: doc.id,
        patientName: data.patientName,
        surgeryType: data.surgeryType,
        referringDoctor: data.referringDoctor || 'Não informado',
        insurance: data.insurance || '',
        timestamp: data.timestamp,
        status: data.status || 'pending',
        note: data.note || '',
        checklist: data.checklist || {},
        checklistNotes: data.checklistNotes || {}
      });
    });
    
    return referrals;
  } catch (e: any) {
    console.error("Erro ao ler dados", e);
    return [];
  }
};

export const clearReferrals = async (): Promise<void> => {
  console.warn("Limpeza em massa não implementada no Firebase");
};