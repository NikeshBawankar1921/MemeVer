import { db, auth } from '../firebase/config';
import { doc, updateDoc, arrayUnion, arrayRemove, getDoc, setDoc } from 'firebase/firestore';
import { toast } from 'react-hot-toast';

export const createCollection = async (name, description = '') => {
  try {
    if (!auth.currentUser) {
      throw new Error('Must be logged in to create collections');
    }

    const userRef = doc(db, 'users', auth.currentUser.uid);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      throw new Error('User document not found');
    }

    const collection = {
      id: Date.now().toString(),
      name,
      description,
      createdAt: new Date().toISOString(),
      memes: []
    };

    await updateDoc(userRef, {
      collections: arrayUnion(collection)
    });

    return collection;
  } catch (error) {
    console.error('Error creating collection:', error);
    throw error;
  }
};

export const addMemeToCollection = async (collectionId, meme) => {
  try {
    if (!auth.currentUser) {
      throw new Error('Must be logged in to modify collections');
    }

    const userRef = doc(db, 'users', auth.currentUser.uid);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      throw new Error('User document not found');
    }

    const userData = userDoc.data();
    const collections = userData.collections || [];
    const collectionIndex = collections.findIndex(c => c.id === collectionId);

    if (collectionIndex === -1) {
      throw new Error('Collection not found');
    }

    // Add meme if not already in collection
    if (!collections[collectionIndex].memes.some(m => m.id === meme.id)) {
      collections[collectionIndex].memes.push(meme);
      await updateDoc(userRef, { collections });
    }

    return collections[collectionIndex];
  } catch (error) {
    console.error('Error adding meme to collection:', error);
    throw error;
  }
}; 