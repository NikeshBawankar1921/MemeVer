import { db, auth } from '../firebase/config';
import { doc, updateDoc, arrayUnion, arrayRemove, getDoc, setDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';

export const toggleLikeMeme = async (meme) => {
  try {
    const user = auth.currentUser;
    if (!user) {
      toast.error('Please login to like memes');
      return false;
    }

    const userRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userRef);

    // Create meme data object with all necessary fields
    const memeData = {
      id: meme.id,
      url: meme.url,
      name: meme.name,
      timestamp: new Date().toISOString()
    };

    if (!userDoc.exists()) {
      await setDoc(userRef, {
        likedMemes: [memeData]
      });
      return true;
    }

    const likedMemes = userDoc.data().likedMemes || [];
    const existingMeme = likedMemes.find(m => m.id === meme.id);

    if (existingMeme) {
      // If meme exists, remove it using the exact same object structure
      await updateDoc(userRef, {
        likedMemes: arrayRemove(existingMeme)
      });
      toast.success('Removed from likes');
      return false;
    } else {
      // If meme doesn't exist, add it
      await updateDoc(userRef, {
        likedMemes: arrayUnion(memeData)
      });
      toast.success('Added to likes');
      return true;
    }

  } catch (error) {
    console.error('Error toggling like:', error);
    toast.error('Failed to update like');
    return false;
  }
};

export const getLikedMemes = async () => {
  try {
    const user = auth.currentUser;
    if (!user) return [];

    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (!userDoc.exists()) return [];

    return userDoc.data().likedMemes || [];
  } catch (error) {
    console.error('Error getting liked memes:', error);
    toast.error('Failed to fetch liked memes');
    return [];
  }
};
