import './tab.css';
import type { Init } from '../../core/types';
import { goTo } from '../../core/scroll';

// round 0: the tape hangs static; P5 prints it. Back to 1:40 works already, so the button is never dead
export const init: Init = () => {
  const rewind = document.querySelector<HTMLButtonElement>('#tab .tab__rewind');
  const go = () => goTo('#fulton', { duration: 2.4 });
  rewind?.addEventListener('click', go);
  return () => rewind?.removeEventListener('click', go);
};
