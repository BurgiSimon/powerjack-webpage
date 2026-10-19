import type Lenis from 'lenis';

export interface Ctx { lenis: Lenis; still: boolean }
export type Init = (ctx: Ctx) => () => void;
