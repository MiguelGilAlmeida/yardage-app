import {
  CalculationResult,
  CalculatorState,
  GarmentResult,
  GarmentType,
  PatternType,
  YardageRow,
} from '../types/index.js'
import { layoutYards } from './layout.js'
import { calcLining, INTERFACING } from './lining.js'

export { layoutYards } from './layout.js'
export { calcLining, INTERFACING } from './lining.js'

// ── Width factor ──────────────────────────────────────────────────────────────
//
// All base formulas are calibrated for 60"-wide fabric.
// This factor scales yardage up for narrower widths.

export function widthFactor(fabricWidth: number): number {
  return 60 / fabricWidth
}

// ── Pattern matching extra ────────────────────────────────────────────────────
//
// Applied to shell only; lining does not need pattern matching.
// repeatH > 0: extra = min(0.5, repeatH / 18) — one extra repeat per seam zone.
// Flat rates below apply when repeat dimensions are not entered.

export const PATTERN_EXTRA: Record<PatternType, number> = {
  stripe: 0.15,
  check:  0.25,
}

// ── Human-readable garment names ──────────────────────────────────────────────

export const GARMENT_NAMES: Record<GarmentType, string> = {
  suit2:     '2-Piece Suit',
  suit3:     '3-Piece Suit',
  sportcoat: 'Sport Coat',
  slacks:    'Slacks',
  vest:      'Waistcoat',
  shirt:     'Dress Shirt',
}

// ── Main calculate function ───────────────────────────────────────────────────

export function calculate(state: CalculatorState): CalculationResult {
  const { garments, fabricWidth, measureMode, unit, measurements: m, options: opts } = state

  let totalShell       = 0
  let totalLining      = 0
  let totalInterfacing = 0

  const garmentResults: GarmentResult[] = garments.map(g => {
    const shellRows:        YardageRow[] = []
    const liningRows:       YardageRow[] = []
    const interfacingRows:  YardageRow[] = []

    let shell       = layoutYards(g, m, opts, fabricWidth, measureMode)
    let lining      = 0
    let interfacing = INTERFACING[g] ?? 0

    switch (g) {
      case 'suit2':
        lining = calcLining(g, m, opts, measureMode)
        shellRows.push       ({ label: 'Jacket + Pants shell',       value: shell })
        liningRows.push      ({ label: 'Jacket + pant lining',       value: lining })
        interfacingRows.push ({ label: 'Canvas / fusible',           value: interfacing })
        break

      case 'suit3':
        // suit3 lining = suit2 jacket/trouser lining + 0.4 yd for vest back/facing
        lining = parseFloat((calcLining('suit2', m, opts, measureMode) + 0.4).toFixed(2))
        shellRows.push       ({ label: 'Jacket, Pants + Waistcoat shell', value: shell })
        liningRows.push      ({ label: 'Jacket + pant lining',            value: lining })
        interfacingRows.push ({ label: 'Canvas / fusible',                value: interfacing })
        break

      case 'sportcoat':
        lining = calcLining(g, m, opts, measureMode)
        shellRows.push       ({ label: 'Jacket shell',      value: shell })
        liningRows.push      ({ label: 'Jacket lining',     value: lining })
        interfacingRows.push ({ label: 'Canvas / fusible',  value: interfacing })
        break

      case 'slacks':
        lining = calcLining(g, m, opts, measureMode)
        shellRows.push  ({ label: 'Pant shell',         value: shell })
        liningRows.push ({ label: 'Pocketing / lining', value: lining })
        break

      case 'shirt':
        shellRows.push       ({ label: 'Shirt shell',          value: shell })
        interfacingRows.push ({ label: 'Collar / cuff fusing', value: interfacing })
        break

      case 'vest':
        // Vest lining is a fixed 85% of shell (vest shell already accounts for vestBack option)
        lining = parseFloat((shell * 0.85).toFixed(2))
        shellRows.push       ({ label: 'Waistcoat shell',       value: shell })
        liningRows.push      ({ label: 'Back + facing lining',  value: lining })
        interfacingRows.push ({ label: 'Fusible',               value: interfacing })
        break
    }

    // Pattern matching extra — applied to shell only
    if (opts.fabricType === 'pattern') {
      const repeatH = parseFloat(opts.patternRepeatH) || 0
      const extra   = repeatH > 0
        ? Math.min(0.5, repeatH / 18)
        : (PATTERN_EXTRA[opts.patternType] || 0.15)
      shell = parseFloat((shell * (1 + extra)).toFixed(2))
      if (shellRows.length > 0) shellRows[shellRows.length - 1].value = shell
    }

    totalShell       += shell
    totalLining      += lining
    totalInterfacing += interfacing

    return { garmentType: g, shell, lining, interfacing, shellRows, liningRows, interfacingRows }
  })

  return {
    garments:         garmentResults,
    totalShell:       parseFloat(totalShell.toFixed(2)),
    totalLining:      parseFloat(totalLining.toFixed(2)),
    totalInterfacing: parseFloat(totalInterfacing.toFixed(2)),
    fabricWidth,
    measureMode,
    unit,
  }
}
