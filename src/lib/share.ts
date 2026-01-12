import { toast } from 'sonner';

interface ShareData {
  title?: string;
  text?: string;
  url?: string;
}

export const shareContent = async (data: ShareData): Promise<boolean> => {
  // Check if Web Share API is available (iOS Safari, Android Chrome, etc.)
  if (navigator.share) {
    try {
      await navigator.share(data);
      return true;
    } catch (error) {
      // User cancelled sharing - not an error
      if ((error as Error).name === 'AbortError') {
        return false;
      }
      console.error('Share failed:', error);
    }
  }
  
  // Fallback: copy to clipboard
  const textToCopy = data.url || data.text || data.title || '';
  if (textToCopy) {
    try {
      await navigator.clipboard.writeText(textToCopy);
      toast.success('Link copied to clipboard!');
      return true;
    } catch (error) {
      console.error('Clipboard copy failed:', error);
      toast.error('Failed to copy link');
    }
  }
  
  return false;
};

export const shareMatch = async (match: {
  id: string;
  courseName: string;
  format: string;
  date: string;
  winnerNames?: string[];
}) => {
  const winnerText = match.winnerNames?.length 
    ? `🏆 ${match.winnerNames.join(' & ')} won!` 
    : '';
  
  const text = `⛳ ${match.format} at ${match.courseName}. ${winnerText}`.trim();
  const url = `${window.location.origin}/share/match/${match.id}`;
  
  return shareContent({
    title: `Golf Match at ${match.courseName}`,
    text,
    url,
  });
};

export const sharePhoto = async (photo: {
  url: string;
  courseName: string;
  date: string;
}) => {
  return shareContent({
    title: `Match at ${photo.courseName}`,
    text: `⛳ ${photo.courseName} - ${photo.date}`,
    url: photo.url,
  });
};
