import './the-bar.css';
import type { Init } from '../../core/types';

// round 0: the static partial is the whole design (and the reduced-motion one); P4 adds the motion (§D)
export const init: Init = () => () => {};
