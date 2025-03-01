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
          const userRef = doc(db, 'users', user.uid);
          const userSnap = await getDoc(userRef);
          
          if (userSnap.exists()) {
            const userData = userSnap.data();
            setDisplayName(userData.displayName || '');
            setBio(userData.bio || '');
            setProfilePicture(userData.photoURL || 'https://via.placeholder.com/150');
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
      formData.append('key', '703866954a55bad4f8f116a4dd0734fe');

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
    <div className="min-h-screen p-8 bg-gray-100 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold dark:text-white">User Profile</h1>
          <button
            onClick={handleLogout}
            className="flex items-center px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
          >
            <HiLogout className="mr-2" />
            Logout
          </button>
        </div>

        <div className={`rounded-lg p-8 ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
          <div className="flex flex-col md:flex-row items-center space-y-8 md:space-y-0 md:space-x-8">
            <div className="relative w-48 h-48">
              <img
                src={profilePicture}
                alt="Profile"
                onError={(e) => {
                  e.target.src = 'https://via.placeholder.com/150';
                }}
                className="w-full h-full rounded-full object-cover border-4 border-white shadow-lg"
              />
              <label
                htmlFor="fileInput"
                className="absolute bottom-2 right-2 bg-blue-500 p-2 rounded-full cursor-pointer hover:bg-blue-600 transition-colors"
              >
                <HiCamera className="text-white" />
              </label>
              <input
                id="fileInput"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
            <button
              onClick={handleUpload}
              disabled={isLoading}
              className="px-8 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Uploading...' : 'Update Profile'}
            </button>
            <div className="flex-1 space-y-4">
              {isEditing ? (
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="text-3xl font-bold bg-transparent border-b-2 border-blue-500 focus:outline-none dark:text-white w-full"
                />
              ) : (
                <h2 className="text-3xl font-bold dark:text-white">{displayName || 'Anonymous User'}</h2>
              )}
              
              {isEditing ? (
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full bg-transparent border-b-2 border-blue-500 focus:outline-none dark:text-white"
                  placeholder="Add a bio..."
                />
              ) : (
                <p className="text-gray-600 dark:text-gray-300">{bio || 'No bio yet'}</p>
              )}
            </div>
          </div>
          <div className="flex justify-end mt-4">
            <button
              onClick={() => {
                if (isEditing) {
                  updateProfileDetails();
                }
                setIsEditing(!isEditing);
              }}
              className="flex items-center px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              {isEditing ? (
                <>
                  <HiSave className="mr-2" />
                  Save Changes
                </>
              ) : (
                <>
                  <HiOutlinePencil className="mr-2" />
                  Edit Profile
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <LikedMemes/>
    </div>
  );
};

export default Profile;