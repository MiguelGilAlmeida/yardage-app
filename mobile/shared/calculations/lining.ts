import { FIT_EASE, GarmentType, MeasureMode, Measurements, CalculatorOptions } from '../types/index.js'

// ── Lining yardage ────────────────────────────────────────────────────────────
//
// Jacket/coat/sportcoat: 85% of a slightly reduced jacket base (no patch pockets
// on lining). Slacks: 75% of outseam (pocket bags + trouser lining).
// Vest lining is derived in calculate() as a fraction of shell (vest shell varies
// by vestBack option, so it's cleaner to compute there).

export function calcLining(
  type: GarmentType,
  m: Measurements,
  opts: CalculatorOptions,
  measureMode: MeasureMode
): number {
  if (type === 'suit2' || type === 'suit3' || type === 'sportcoat') {
    const body          = measureMode === 'body'
    const fit           = opts.fit
    const finishedChest = (m.chest || 40) + (body ? FIT_EASE[fit].chest : 0)
    const base          = ((m.backLength || 30) * 1.5 + (m.sleeveLength || 24) + 10) / 36
    const chestAdj      = Math.max(0, (finishedChest - 43) * 0.018)
    return parseFloat(((base + chestAdj) * 0.85).toFixed(2))
  }
  if (type === 'slacks') {
    return parseFloat((((m.outseam ?? 42) / 36) * 0.75).toFixed(2))
  }
  return 0
}

// ── Interfacing yardage (fixed per garment type) ──────────────────────────────
//
// Canvas/fusible for jacket front, collar, and cuffs — calibrated for a
// standard full-chest canvas. Adjust upward for floating canvas construction.

export const INTERFACING: Partial<Record<GarmentType, number>> = {
  suit2:     0.75,
  suit3:     0.75,
  sportcoat: 0.50,
  shirt:     0.30,
  vest:      0.25,
  // slacks: 0 — no interfacing for trousers
}
