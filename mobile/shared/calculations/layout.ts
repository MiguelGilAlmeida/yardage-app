import { FIT_EASE, GarmentType, MeasureMode, Measurements, CalculatorOptions } from '../types/index.js'

// ── Piece geometry ────────────────────────────────────────────────────────────

interface Piece {
  n:       string
  w:       number
  h:       number
  shape?:   string
  mirror?:  boolean
  fold?:    boolean
  flip180?: boolean
  props?:   Record<string, number>
}

type PackedPiece = { piece: Piece; xOff: number; yOff: number }

// Layout ease: wearing ease + seam allowance / cutting margin.
// Larger than FIT_EASE because pattern pieces need SA on every edge.
const LAYOUT_EASE = {
  slim:    { chest: 3.5, waist: 0.75, seat: 1.5 },
  modern:  { chest: 5,   waist: 1,    seat: 2   },
  classic: { chest: 7.5, waist: 2,    seat: 4   },
}

// ── FFD packer ────────────────────────────────────────────────────────────────
//
// Two-phase greedy first-fit-decreasing strip packer.
//
// Phase 1 — FFD: sort pieces by height desc, greedily fill rows.
//   Height threshold (40%) stops tall rows from stealing short pieces.
//   Minimum margin (0.5") prevents razor-thin fits that split flap pairs.
//
// Phase 2 — 2D dead-space tuck: short overflow rows (maxH < 6") are
//   re-examined. Each piece is slotted below a shorter host piece in a
//   tall row (host.h < rowMaxH) if the dead zone is tall/wide enough.
//   Tucked pieces cost zero extra yardage — they fit within existing row height.

function pack(pieces: Piece[], avail: number): PackedPiece[][] {
  const PG     = 0.45   // gap between pieces in a row
  const MARGIN = 0.5    // minimum margin to prevent razor-thin fits

  const sorted  = [...pieces].sort((a, b) => b.h - a.h || b.w - a.w)
  const placed  = new Array(sorted.length).fill(false)
  const rows:    PackedPiece[][] = []
  const rowUsed: number[] = []

  // Phase 1: FFD strip packing
  for (let i = 0; i < sorted.length; i++) {
    if (placed[i]) continue
    const p = sorted[i]

    let addedToExisting = false
    for (let r = 0; r < rows.length; r++) {
      if (rowUsed[r] + PG + p.w <= avail - MARGIN) {
        rows[r].push({ piece: p, xOff: rowUsed[r] + PG, yOff: 0 })
        rowUsed[r] += PG + p.w
        placed[i] = true
        addedToExisting = true
        break
      }
    }

    if (!addedToExisting) {
      const row  = [{ piece: p, xOff: 0, yOff: 0 }]
      placed[i]  = true
      let used   = p.w
      const minH = p.h * 0.4
      for (let j = i + 1; j < sorted.length; j++) {
        if (placed[j]) continue
        if (sorted[j].h < minH) continue
        if (used + PG + sorted[j].w <= avail) {
          row.push({ piece: sorted[j], xOff: used + PG, yOff: 0 })
          used += PG + sorted[j].w
          placed[j] = true
        }
      }
      rows.push(row)
      rowUsed.push(used)
    }
  }

  // Phase 2: 2D dead-space tuck
  const rowMaxH = rows.map(row => Math.max(...row.map(e => e.piece.h)))
  const SHORT_H = 6
  const TALL_H  = 10

  for (let r = rows.length - 1; r >= 0; r--) {
    if (rowMaxH[r] >= SHORT_H) continue
    const remaining: PackedPiece[] = []

    for (const entry of rows[r]) {
      const sp = entry.piece
      let tucked = false

      outer: for (let rr = 0; rr < rows.length; rr++) {
        if (rr === r || rowMaxH[rr] < TALL_H) continue
        for (const host of rows[rr]) {
          if (host.yOff > 0) continue
          const hp = host.piece
          if (hp.h >= rowMaxH[rr]) continue
          const deadH = rowMaxH[rr] - hp.h - PG
          if (deadH < sp.h || sp.w > hp.w) continue
          const occupied = rows[rr].some(e =>
            e.yOff > 0 &&
            e.xOff < host.xOff + hp.w &&
            e.xOff + e.piece.w > host.xOff
          )
          if (occupied) continue
          rows[rr].push({ piece: sp, xOff: host.xOff, yOff: hp.h + PG })
          tucked = true
          break outer
        }
      }

      if (!tucked) remaining.push(entry)
    }

    rows[r] = remaining
    rowMaxH[r] = remaining.length
      ? Math.max(...remaining.map(e => e.piece.h))
      : 0
  }

  return rows.filter(row => row.length > 0)
}

function getPieces(
  garment: GarmentType,
  m: Measurements,
  opts: CalculatorOptions,
  fabricWidth: number,
  measureMode: MeasureMode
): { jacket: Piece[]; trousers: Piece[]; vest: Piece[]; shirt: Piece[] } {
  const SA    = 1.25
  const body  = measureMode === 'body'
  const fit   = opts.fit
  const le    = body ? LAYOUT_EASE[fit] : { chest: 0, waist: 0, seat: 0 }

  const chest    = (m.chest      || 40) + le.chest
  const back     = (m.backLength || 30) + SA
  const vestBack = (m.vestLength || (m.backLength ?? 30) * 0.78 || 24) + SA
  const sleeve   = (m.sleeveLength || 24) + SA
  const shirtL   = (m.shirtLength || 29) + SA
  const outseam  = (m.outseam || ((m.inseam || 30) + 12)) + SA
  const hip      = (m.hip   || 42) + le.seat
  const waist    = (m.waist || 34) + le.waist
  const neck     = m.neck      || 15
  const shoulder = m.shoulder  || 18
  const cuff     = m.cuff      || 9

  const bicep = m.bicep
    ? m.bicep + (body ? (FIT_EASE[fit].bicep || 1) : 0)
    : shoulder * 2 / 3 + 2

  const thigh = m.thigh
    ? m.thigh + (body ? (FIT_EASE[fit].thigh || 2) : 0)
    : hip / 2.1

  const wbH       = parseFloat(String(opts.waistbandWidth)) * 2 || 3
  const cuffDepth = parseFloat(opts.cuffs) || 0
  const trsH      = outseam + cuffDepth * 2

  const facW = opts.lapelStyle === 'shawl' ? 10 : opts.lapelStyle === 'peak' ? 8.5 : 7
  const facH = back * 0.65

  const bkW  = chest / 4 + 2.5
  const frW  = chest / 4 + 3
  const tsW  = bicep / 2 + 2
  const usW  = bicep / 2 + 0.5
  const slvH = sleeve + 7

  const legFW = Math.max(hip / 4 + 0.75, thigh * 0.42 + 0.75)
  const legBW = Math.max(hip / 4 + 2.5,  thigh * 0.55 + 0.75)

  const collarPieces: Piece[] = [
    { n: 'Collar',    w: neck * 0.80, h: 5, shape: 'collar' },
    { n: 'Col. Band', w: neck * 0.75, h: 3, shape: 'collar-band' },
  ]

  const vestPocketPieces: Piece[] = opts.vestPockets === 'flap'
    ? [{ n: 'V.Flap', w: 4, h: 2 }, { n: 'V.Flap', w: 4, h: 2 }, { n: 'V.Welt ×4', w: 8, h: 2 }]
    : [{ n: 'V.Welt ×4', w: 8, h: 2 }]

  const pocketPieces: Piece[] = opts.pockets === 'jetted'
    ? [{ n: 'Welt ×4', w: 10, h: 3 }]
    : opts.pockets === 'patch'
      ? [{ n: 'Patch', w: 6.5, h: 7, shape: 'pocket-bag' }, { n: 'Patch', w: 6.5, h: 7, shape: 'pocket-bag' }, { n: 'Welt ×2', w: 10, h: 3 }]
      : [{ n: 'Flap', w: 5.5, h: 2.5 }, { n: 'Flap', w: 5.5, h: 2.5 }, { n: 'Welt ×4', w: 10, h: 3 }]

  const ticketPieces: Piece[] = opts.ticketPocket
    ? [{ n: 'Ticket Flap', w: 4, h: 2 }]
    : []

  const jacket: Piece[] = [
    { n: 'Back',    w: bkW,  h: back,  shape: 'jacket-back' },
    { n: 'Back',    w: bkW,  h: back,  shape: 'jacket-back',          mirror: true },
    { n: 'Front L', w: frW,  h: back,  shape: 'jacket-front' },
    { n: 'Front R', w: frW,  h: back,  shape: 'jacket-front',         mirror: true },
    { n: 'Top Slv', w: tsW,  h: slvH,  shape: 'jacket-sleeve-top' },
    { n: 'Top Slv', w: tsW,  h: slvH,  shape: 'jacket-sleeve-top' },
    { n: 'Und Slv', w: usW,  h: slvH,  shape: 'jacket-sleeve-under' },
    { n: 'Und Slv', w: usW,  h: slvH,  shape: 'jacket-sleeve-under' },
    { n: 'Facing',  w: facW, h: facH,  shape: 'facing' },
    { n: 'Facing',  w: facW, h: facH,  shape: 'facing',               mirror: true },
    ...collarPieces,
    ...pocketPieces,
    ...ticketPieces,
  ]

  const trousers: Piece[] = [
    { n: 'Front L',   w: legFW,         h: trsH, shape: 'trouser-front' },
    { n: 'Front R',   w: legFW,         h: trsH, shape: 'trouser-front', flip180: true },
    { n: 'Back L',    w: legBW,         h: trsH, shape: 'trouser-back' },
    { n: 'Back R',    w: legBW,         h: trsH, shape: 'trouser-back',  flip180: true },
    { n: 'Waistband', w: waist / 2 + 2, h: wbH,  shape: 'waistband' },
  ]

  const vstW = chest / 4 + 2
  const vest: Piece[] = [
    { n: 'Vest Front', w: vstW,          h: vestBack, shape: 'vest-front' },
    { n: 'Vest Front', w: vstW,          h: vestBack, shape: 'vest-front',    mirror: true },
    ...(opts.vestBack === 'fabric'
      ? [{ n: 'Back L', w: vstW * 1.05, h: vestBack, shape: 'jacket-back' },
         { n: 'Back R', w: vstW * 1.05, h: vestBack, shape: 'jacket-back', mirror: true }]
      : []),
    ...vestPocketPieces,
  ]

  const bodyW  = chest / 4 + 2
  const slvW   = bicep / 2 + 2
  const shSlvH = sleeve + 5
  const shirt: Piece[] = [
    { n: 'Back',    w: bodyW,         h: shirtL,        shape: 'shirt-back',  fold: true },
    { n: 'Front L', w: bodyW,         h: shirtL,        shape: 'shirt-front' },
    { n: 'Front R', w: bodyW,         h: shirtL,        shape: 'shirt-front', mirror: true },
    { n: 'Sleeve',  w: slvW,          h: shSlvH,        shape: 'shirt-sleeve' },
    { n: 'Sleeve',  w: slvW,          h: shSlvH,        shape: 'shirt-sleeve', mirror: true },
    { n: 'Yoke',    w: bodyW * 2 + 2, h: 7,             shape: 'collar' },
    { n: 'Collar',  w: neck * 0.75,   h: 5,             shape: 'collar' },
    { n: 'Band ×2', w: neck * 0.75,   h: 3,             shape: 'collar-band' },
    { n: 'Cuff ×2', w: cuff / 2 + 1,  h: 4.5 },
    { n: 'Placket', w: 3,              h: shirtL * 0.55 },
  ]

  return { jacket, trousers, vest, shirt }
}

// ── Layout rows (for yardage derivation only — not SVG rendering) ─────────────

export function getLayoutRows(
  garment: GarmentType,
  m: Measurements,
  opts: CalculatorOptions,
  fabricWidth: number,
  measureMode: MeasureMode
): PackedPiece[][] {
  const AVAIL = fabricWidth - 3.2   // usable width between selvedges minus buffer
  const { jacket, trousers, vest, shirt } = getPieces(garment, m, opts, fabricWidth, measureMode)

  switch (garment) {
    case 'suit2':     return [...pack(jacket, AVAIL), ...pack(trousers, AVAIL)]
    case 'suit3':     return [...pack([...jacket, ...vest], AVAIL), ...pack(trousers, AVAIL)]
    case 'sportcoat': return pack(jacket, AVAIL)
    case 'slacks':    return pack(trousers, AVAIL)
    case 'vest':      return pack(vest, AVAIL)
    case 'shirt':     return pack(shirt, AVAIL)
    default:          return []
  }
}

// ── Shell yardage from layout ─────────────────────────────────────────────────

export function layoutYards(
  garment: GarmentType,
  m: Measurements,
  opts: CalculatorOptions,
  fabricWidth: number,
  measureMode: MeasureMode
): number {
  const GAP = 1.5
  const PAD = 1.5
  const rows = getLayoutRows(garment, m, opts, fabricWidth, measureMode)
  if (!rows.length) return 0
  let totalH = PAD
  rows.forEach(row => { totalH += Math.max(...row.map(e => e.piece.h)) + GAP })
  totalH += PAD - GAP
  return parseFloat((totalH / 36).toFixed(2))
}
