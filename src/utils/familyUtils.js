import { collection, doc, getDoc, setDoc, updateDoc, query, where, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';

export const generateFamilyCode = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

export const createFamily = async (adminUser, familyName) => {
  const familyCode = generateFamilyCode();
  const familyId = `family_${Date.now()}`;
  
  const familyData = {
    familyId,
    familyName,
    familyCode,
    adminId: adminUser.uid,
    members: [{
      uid: adminUser.uid,
      name: adminUser.name,
      email: adminUser.email,
      role: 'admin',
      joinedAt: new Date().toISOString()
    }],
    createdAt: new Date().toISOString()
  };
  
  await setDoc(doc(db, 'families', familyId), familyData);
  return { familyId, familyCode };
};

export const joinFamily = async (familyCode, user) => {
  const q = query(collection(db, 'families'), where('familyCode', '==', familyCode));
  const querySnapshot = await getDocs(q);
  
  if (querySnapshot.empty) {
    throw new Error('Invalid family code');
  }
  
  const familyDoc = querySnapshot.docs[0];
  const familyData = familyDoc.data();
  
  // Check if user already in family
  if (familyData.members.some(member => member.uid === user.uid)) {
    throw new Error('Already a member of this family');
  }
  
  // Add user to family
  const newMember = {
    uid: user.uid,
    name: user.name,
    email: user.email,
    role: 'member',
    joinedAt: new Date().toISOString()
  };
  
  await updateDoc(doc(db, 'families', familyData.familyId), {
    members: [...familyData.members, newMember]
  });
  
  return familyData.familyId;
};

export const getFamilyByCode = async (familyCode) => {
  const q = query(collection(db, 'families'), where('familyCode', '==', familyCode));
  const querySnapshot = await getDocs(q);
  
  if (querySnapshot.empty) {
    return null;
  }
  
  return querySnapshot.docs[0].data();
};