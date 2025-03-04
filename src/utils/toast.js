import toast from 'react-hot-toast';

// Success toast
export const showSuccessToast = (message) => {
  toast.success(message, {
    position: 'top-center',
    duration: 3000,
    style: {
      background: '#059669',
      color: '#fff',
      padding: '12px 24px',
      borderRadius: '8px',
      fontSize: '14px',
    },
  });
};

// Error toast
export const showErrorToast = (message) => {
  toast.error(message, {
    position: 'top-center',
    duration: 3000,
    style: {
      background: '#DC2626',
      color: '#fff',
      padding: '12px 24px',
      borderRadius: '8px',
      fontSize: '14px',
    },
  });
};

// Info toast
export const showInfoToast = (message) => {
  toast(message, {
    position: 'top-center',
    duration: 3000,
    style: {
      background: '#363636',
      color: '#fff',
      padding: '12px 24px',
      borderRadius: '8px',
      fontSize: '14px',
    },
  });
}; 