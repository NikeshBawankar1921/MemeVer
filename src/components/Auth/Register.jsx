import React, { useState } from 'react';
import { auth, db } from '../../firebase/config';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    contact: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [contactError, setContactError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Validate phone number format
    if (name === 'contact') {
      const phoneRegex = /^\+\d{1,4}\d{10}$/; // Example: +911234567890
      if (!phoneRegex.test(value)) {
        setContactError('Enter a valid phone number with country code (e.g., +911234567890)');
      } else {
        setContactError('');
      }
    }

    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (contactError) return;

    setLoading(true);
    try {
      // Create user with email and password
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      // Update profile with display name
      await updateProfile(userCredential.user, {
        displayName: formData.name
      });

      // Store additional user data in Firestore
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        name: formData.name,
        email: formData.email,
        contact: formData.contact,
        createdAt: new Date().toISOString()
      });

      toast.success('Registration successful!');
      navigate('/profile');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <h2 className="text-2xl font-bold text-center mb-6">Create an Account</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Name</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Contact Number</label>
          <input
            type="tel"
            name="contact"
            value={formData.contact}
            onChange={handleChange}
            placeholder="+911234567890"
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            required
          />
          {contactError && <p className="text-red-500 text-sm mt-1">{contactError}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Password</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading || contactError}
          className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? 'Creating Account...' : 'Register'}
        </button>
      </form>

      <p className="mt-4 text-center text-sm">
        Already have an account?{' '}
        <button
          onClick={() => navigate('/auth/login')}
          className="text-blue-500 hover:text-blue-600"
        >
          Login
        </button>
      </p>
    </div>
  );
};

export default Register;
