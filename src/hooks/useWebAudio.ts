import { useState, useEffect } from 'react';
import { audio } from '../utils/audio';

export function useWebAudio() {
  const [isEnabled, setIsEnabled] = useState<boolean>(() => audio.isEnabled());

  useEffect(() => {
    const unsubscribe = audio.subscribe((state) => {
      setIsEnabled(state);
    });
    return unsubscribe;
  }, []);

  return {
    isEnabled,
    toggle: () => audio.toggle(),
    setEnabled: (val: boolean) => audio.setEnabled(val),
    playTick: () => audio.playTick(),
    playChord: () => audio.playChord(),
    playPongBlip: (type: 'paddle' | 'wall' | 'score' | 'unlock') => audio.playPongBlip(type),
  };
}

export default useWebAudio;
