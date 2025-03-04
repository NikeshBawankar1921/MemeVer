import { useEffect } from 'react';

export const useKeyboardShortcuts = (navigate) => {
  useEffect(() => {
    const handleKeyPress = (event) => {
      // Only trigger if no input/textarea is focused
      if (['input', 'textarea'].includes(document.activeElement.tagName.toLowerCase())) {
        return;
      }

      switch (event.key.toLowerCase()) {
        case 'h':
          navigate('/');
          break;
        case 'e':
          navigate('/explore');
          break;
        case 'p':
          navigate('/profile');
          break;
        case 'u':
          navigate('/upload');
          break;
        case 'f':
          // Toggle favorites filter in explore page
          if (window.location.pathname === '/explore') {
            document.querySelector('[data-category="favorites"]')?.click();
          }
          break;
        case '?':
          // Show keyboard shortcuts help modal
          document.querySelector('[data-action="show-shortcuts"]')?.click();
          break;
        default:
          break;
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [navigate]);
}; 