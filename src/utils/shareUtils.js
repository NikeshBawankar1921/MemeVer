import { toast } from 'react-hot-toast';

export const handleShare = async (meme) => {
  try {
    if (navigator.share) {
      // Use Web Share API if available
      await navigator.share({
        title: meme.caption || 'Check out this meme!',
        text: 'Found this awesome meme on MemeVerse!',
        url: meme.imageUrl
      });
    } else {
      // Fallback to clipboard copy
      await navigator.clipboard.writeText(meme.imageUrl);
      toast.success('Meme URL copied to clipboard!');
    }
  } catch (error) {
    console.error('Error sharing:', error);
    toast.error('Failed to share meme');
  }
};

export const shareToSocial = (meme, platform) => {
  const text = encodeURIComponent('Check out this awesome meme from MemeVerse!');
  const url = encodeURIComponent(meme.imageUrl);
  const title = encodeURIComponent(meme.caption || 'Awesome Meme');

  const shareUrls = {
    twitter: `https://twitter.com/intent/tweet?text=${text}&url=${url}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${text}`,
    whatsapp: `https://api.whatsapp.com/send?text=${text}%20${url}`,
    telegram: `https://telegram.me/share/url?url=${url}&text=${text}`,
    reddit: `https://reddit.com/submit?url=${url}&title=${title}`
  };

  if (shareUrls[platform]) {
    window.open(shareUrls[platform], '_blank', 'noopener,noreferrer');
  }
};
