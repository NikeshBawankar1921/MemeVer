import toast from 'react-hot-toast';

export const handleShare = async (item) => {
  const shareData = {
    title: item.name || 'Check out this meme',
    text: `Check out this ${item.type || 'meme'} from MemeVerse!`,
    url: item.url
  };

  try {
    if (navigator.share) {
      await navigator.share(shareData);
      toast.success('Shared successfully!');
    } else {
      await navigator.clipboard.writeText(item.url);
      toast.success('Link copied to clipboard!');
    }
  } catch (error) {
    if (error.name === 'AbortError') {
      toast.error('Sharing was canceled');
    } else {
      toast.error('Failed to share');
      console.error('Error sharing:', error);
    }
  }
};
