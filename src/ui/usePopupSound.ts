import { useEffect } from 'react';
import { AudioManager } from '../services/audio/AudioManager';

/** Soft paper swish each time a popup opens */
export function usePopupSound(visible: boolean) {
  useEffect(() => {
    if (visible) AudioManager.playPopupOpen();
  }, [visible]);
}
