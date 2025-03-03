import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { storage, db, auth } from '../firebase/config';
import { collection, query, where, getDocs, doc, updateDoc, getDoc } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { HiCamera, HiOutlinePencil, HiSave, HiLogout } from 'react-icons/hi';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import LikedMemes from './LikedMemes';
import { IMGBB_API_KEY } from '../config/constants';

const Profile = () => {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [profilePicture, setProfilePicture] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  const darkMode = useSelector((state) => state.theme.darkMode);
  const user = auth.currentUser;

  useEffect(() => {
    const fetchUserData = async () => {
      if (user) {
        try {
          console.log('Fetching user data for:', user.uid);
          const userRef = doc(db, 'users', user.uid);
          const userSnap = await getDoc(userRef);
          
          if (userSnap.exists()) {
            console.log('User data:', userSnap.data());
            const userData = userSnap.data();
            setDisplayName(userData.displayName || '');
            setBio(userData.bio || '');
            setProfilePicture(userData.photoURL || 'https://via.placeholder.com/150');
          } else {
            console.log('No user document found');
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      }
    };

    fetchUserData();
  }, [user]);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return;
      }
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
    }
  };

  const handleUpload = async () => {
    if (!user) {
      toast.error('You must be logged in to upload profile picture');
      navigate('/auth/login');
      return;
    }

    if (!file) {
      toast.error('Please select a file to upload');
      return;
    }

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('key', IMGBB_API_KEY);

      const response = await fetch('https://api.imgbb.com/1/upload', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const imgbbData = await response.json();

      if (!imgbbData.success) {
        throw new Error('Profile picture upload failed: ' + JSON.stringify(imgbbData));
      }

      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        photoURL: imgbbData.data.url
      });

      setProfilePicture(imgbbData.data.url);
      toast.success('Profile picture updated successfully!');
    } catch (error) {
      console.error('Profile picture upload error:', error);
      toast.error(`Failed to update profile picture: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      localStorage.removeItem('userCredentials');
      toast.success('Logged out successfully');
      navigate('/auth/login');
    } catch (error) {
      toast.error('Failed to logout');
      console.error('Logout error:', error);
    }
  };

  const updateProfileDetails = async () => {
    if (!user) return;
    try {
      await updateProfile(user, {
        displayName: displayName,
        photoURL: profilePicture
      });

      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        displayName: displayName,
        bio: bio,
        photoURL: profilePicture
      });

      setIsEditing(false);
      toast.success('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    }
  };

  return (
    <div className="min-h-screen relative">
      {/* Background gradient */}
      <div className="fixed inset-0 bg-gradient-to-br from-violet-600/30 via-fuchsia-500/30 to-pink-500/30 -z-10" />
      <div className="fixed inset-0 backdrop-blur-xl -z-10" />

      <div className="container mx-auto px-4 py-8">
        {/* Header Card */}
        <div className="bg-white/30 dark:bg-gray-800/30 backdrop-blur-md rounded-2xl p-6 mb-8 
          border border-white/20 dark:border-gray-700/20 shadow-xl">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-600 to-pink-600 bg-clip-text text-transparent">
              User Profile
            </h1>
            <button
              onClick={handleLogout}
              className="flex items-center px-4 py-2 rounded-xl bg-red-500/80 hover:bg-red-500 
                text-white backdrop-blur-sm transition-all duration-300 space-x-2"
            >
              <HiLogout />
              <span>Logout</span>
            </button>
          </div>
        </div>

        {/* Profile Info Card */}
        <div className="bg-white/40 dark:bg-gray-800/40 backdrop-blur-md rounded-2xl p-8 
          border border-white/20 dark:border-gray-700/20 shadow-xl transition-all duration-300">
          <div className="flex flex-col md:flex-row items-center space-y-8 md:space-y-0 md:space-x-8">
            {/* Profile Picture Section */}
            <div className="relative w-48 h-48">
              <img
                src={profilePicture}
                alt="Profile"
                className="w-full h-full rounded-full object-cover border-4 
                  border-white/50 dark:border-gray-700/50 shadow-lg"
                onError={(e) => e.target.src = 'https://static.vecteezy.com/system/resources/previews/019/879/186/large_2x/user-icon-on-transparent-background-free-png.png'}
              />
              <label
                htmlFor="fileInput"
                className="absolute bottom-2 right-2 p-3 rounded-full cursor-pointer
                  bg-gradient-to-r from-violet-600 to-pink-600 text-white
                  hover:from-pink-600 hover:to-violet-600 transition-all duration-300
                  shadow-lg hover:shadow-xl"
              >
                <HiCamera className="w-6 h-6" />
              </label>
              <input
                id="fileInput"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>

            {/* Profile Details Section */}
            <div className="flex-1 space-y-4 w-full">
              {isEditing ? (
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl bg-white/50 dark:bg-gray-900/50 
                    border border-gray-200/20 dark:border-gray-700/20 
                    focus:outline-none focus:ring-2 focus:ring-violet-500 
                    text-gray-900 dark:text-white transition-all duration-300"
                  placeholder="Your name"
                />
              ) : (
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {displayName || 'Set Your User Name And Bio'}
                </h2>
              )}
              
              {isEditing ? (
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl bg-white/50 dark:bg-gray-900/50 
                    border border-gray-200/20 dark:border-gray-700/20 
                    focus:outline-none focus:ring-2 focus:ring-violet-500 
                    text-gray-900 dark:text-white transition-all duration-300"
                  placeholder="Add a bio..."
                  rows="3"
                />
              ) : (
                <p className="text-gray-600 dark:text-gray-400">{bio || 'No bio yet'}</p>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4 mt-6">
            <button
              onClick={handleUpload}
              disabled={isLoading || !file}
              className={`px-6 py-2 rounded-xl transition-all duration-300
                ${isLoading || !file 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-violet-600 to-pink-600 hover:from-pink-600 hover:to-violet-600'
                } text-white shadow-lg hover:shadow-xl`}
            >
              {isLoading ? 'Uploading...' : 'Update Picture'}
            </button>
            
            <button
              onClick={() => {
                if (isEditing) {
                  updateProfileDetails();
                }
                setIsEditing(!isEditing);
              }}
              className="px-6 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-pink-600 
                text-white shadow-lg hover:shadow-xl transition-all duration-300
                hover:from-pink-600 hover:to-violet-600 flex items-center space-x-2"
            >
              {isEditing ? <HiSave className="w-5 h-5" /> : <HiOutlinePencil className="w-5 h-5" />}
              <span>{isEditing ? 'Save Changes' : 'Edit Profile'}</span>
            </button>
          </div>
        </div>

        {/* Liked Memes Section */}
        <div className="mt-8">
          <LikedMemes />
        </div>
      </div>
    </div>
  );
};

export default Profile;