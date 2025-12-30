import { collection, doc, addDoc, updateDoc, deleteDoc, query, where, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';

export const createFolder = async (folderName, parentId, familyId, ownerId, ownerName) => {
  const folderData = {
    name: folderName,
    parentId: parentId || null,
    familyId,
    ownerId,
    ownerName,
    type: 'folder',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isDeleted: false
  };
  
  const docRef = await addDoc(collection(db, 'folders'), folderData);
  return { id: docRef.id, ...folderData };
};

export const renameFolder = async (folderId, newName) => {
  await updateDoc(doc(db, 'folders', folderId), {
    name: newName,
    updatedAt: new Date().toISOString()
  });
};

export const deleteFolder = async (folderId) => {
  await updateDoc(doc(db, 'folders', folderId), {
    isDeleted: true,
    deletedAt: new Date().toISOString()
  });
};

export const getFolderPath = async (folderId) => {
  if (!folderId) return [];
  
  const path = [];
  let currentId = folderId;
  
  while (currentId) {
    const folderDoc = await getDocs(query(collection(db, 'folders'), where('__name__', '==', currentId)));
    if (!folderDoc.empty) {
      const folder = folderDoc.docs[0].data();
      path.unshift({ id: currentId, name: folder.name });
      currentId = folder.parentId;
    } else {
      break;
    }
  }
  
  return path;
};