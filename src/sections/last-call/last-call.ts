import './last-call.css';
import type { Init } from '../../core/types';

// round 0: the static partial is the whole design (and the reduced-motion one); P5 adds the motion (§D)
export const init: Init = () => () => {};
