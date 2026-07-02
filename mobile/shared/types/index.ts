// ── Primitives & enums ───────────────────────────────────────────────────────

export type GarmentType = 'suit2' | 'suit3' | 'sportcoat' | 'slacks' | 'vest' | 'shirt'

export type MeasureMode = 'body' | 'garment'

/** The unit in which results are displayed to the user. All internal calculations use inches/yards. */
export type ResultUnit = 'yards' | 'meters'

export type FitStyle = 'slim' | 'modern' | 'classic'

export type LapelStyle = 'notch' | 'peak' | 'shawl'

/** Jacket hip-pocket style. Does not affect trousers. */
export type PocketStyle = 'flap' | 'jetted' | 'patch'

export type VestBack = 'lining' | 'fabric'

export type FabricType = 'plain' | 'pattern'

export type PatternType = 'stripe' | 'check'

// ── Measurements ─────────────────────────────────────────────────────────────
//
// All values stored in inches (the calculation engine works in inches throughout).
// Body mode: raw body measurements — ease is applied inside the formula.
// Garment mode: finished garment measurements — no ease added.
// Every field is optional; required fields per garment are enforced at validation time.

export interface Measurements {
  chest?: number          // body: fullest chest / garment: finished chest (half × 2)
  stomach?: number        // fullest part of stomach/belly
  bicep?: number          // arm circumference at fullest point
  shoulder?: number       // seam to seam across back
  sleeveLength?: number   // shoulder seam to cuff edge
  backLength?: number     // nape of neck to jacket hem
  vestLength?: number     // nape of neck to waistcoat hem
  waist?: number          // natural waist circumference / finished waistband
  hip?: number            // fullest part of seat
  outseam?: number        // waistband top to trouser hem
  inseam?: number         // crotch to hem
  legOpen?: number        // leg opening circumference
  shirtLength?: number    // nape to shirt hem
  neck?: number           // neck circumference / collar band length
  thigh?: number          // leg circumference at fullest point
  calf?: number           // leg circumference at calf
  cuff?: number           // wrist/cuff circumference
  urise?: number          // front waist → crotch → back waist (u-rise)
}

// Which measurement keys each garment type requires/uses (mirrors garmentFields in index.html)
export const GARMENT_FIELDS: Record<GarmentType, (keyof Measurements)[]> = {
  suit2:     ['chest','stomach','bicep','shoulder','sleeveLength','backLength','waist','hip','thigh','outseam','inseam','legOpen'],
  suit3:     ['chest','stomach','bicep','shoulder','sleeveLength','backLength','vestLength','waist','hip','thigh','outseam','inseam','legOpen'],
  sportcoat: ['chest','stomach','bicep','shoulder','sleeveLength','backLength'],
  slacks:    ['waist','hip','thigh','outseam','inseam','legOpen'],
  vest:      ['chest','stomach','backLength','waist'],
  shirt:     ['chest','shoulder','shirtLength','sleeveLength','bicep','neck','cuff'],
}

// Minimum required fields to produce any estimate
export const GARMENT_REQUIRED: Record<GarmentType, (keyof Measurements)[]> = {
  suit2:     ['chest','backLength','waist','hip','outseam','inseam'],
  suit3:     ['chest','backLength','vestLength','waist','hip','outseam','inseam'],
  sportcoat: ['chest','backLength'],
  slacks:    ['waist','hip','outseam','inseam'],
  vest:      ['chest','backLength','waist'],
  shirt:     ['chest','shirtLength'],
}

// ── Calculator options ────────────────────────────────────────────────────────

export interface CalculatorOptions {
  fit: FitStyle
  lapelStyle: LapelStyle
  pockets: PocketStyle
  ticketPocket: boolean
  /** Finished waistband height in inches (default 1.5) */
  waistbandWidth: number
  /** Turn-up/cuff depth in inches, or 'none' for plain hem */
  cuffs: 'none' | string
  vestBack: VestBack
  vestPockets: 'jetted' | 'flap'
  fabricType: FabricType
  patternType: PatternType
  /** Pattern repeat width in inches, '' if not specified */
  patternRepeatW: string
  /** Pattern repeat height in inches, '' if not specified */
  patternRepeatH: string
}

export const DEFAULT_OPTIONS: CalculatorOptions = {
  fit:            'modern',
  lapelStyle:     'notch',
  pockets:        'flap',
  ticketPocket:   false,
  waistbandWidth: 1.5,
  cuffs:          'none',
  vestBack:       'lining',
  vestPockets:    'jetted',
  fabricType:     'plain',
  patternType:    'stripe',
  patternRepeatW: '',
  patternRepeatH: '',
}

// ── Fit ease table (mirrors _FIT_EASE in index.html) ─────────────────────────

export interface FitEase {
  chest: number
  waist: number
  seat:  number
  bicep: number
  thigh: number
}

export const FIT_EASE: Record<FitStyle, FitEase> = {
  slim:    { chest: 2,   waist: 0.75, seat: 1.5, bicep: 0.75, thigh: 1.5 },
  modern:  { chest: 3,   waist: 1,    seat: 2,   bicep: 1,    thigh: 2   },
  classic: { chest: 4.5, waist: 2,    seat: 3,   bicep: 1.5,  thigh: 3   },
}

// ── Calculator runtime state ──────────────────────────────────────────────────

export interface CalculatorState {
  garments: GarmentType[]
  /** Fabric width in inches */
  fabricWidth: number
  measureMode: MeasureMode
  unit: ResultUnit
  measurements: Measurements
  options: CalculatorOptions
}

// ── Calculation results ───────────────────────────────────────────────────────

export interface YardageRow {
  label: string
  /** Yards */
  value: number
}

export interface GarmentResult {
  garmentType: GarmentType
  /** Shell fabric yards */
  shell: number
  /** Lining fabric yards */
  lining: number
  /** Interfacing yards */
  interfacing: number
  shellRows: YardageRow[]
  liningRows: YardageRow[]
  interfacingRows: YardageRow[]
}

export interface CalculationResult {
  garments: GarmentResult[]
  /** Sum of shell across all garments, in yards */
  totalShell: number
  /** Sum of lining across all garments, in yards */
  totalLining: number
  /** Sum of interfacing across all garments, in yards */
  totalInterfacing: number
  fabricWidth: number
  measureMode: MeasureMode
  unit: ResultUnit
}

// ── Database entities (match Supabase schema) ─────────────────────────────────
//
// These are the TypeScript representations of the Supabase rows.
// Snake_case DB columns map to camelCase here; the Supabase client handles conversion.

export interface Client {
  id: string
  userId: string
  name: string
  email?: string
  phone?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface MeasurementSet {
  id: string
  clientId: string
  /** User-assigned label, e.g. "2024 fitting" or "Slim profile" */
  label: string
  measureMode: MeasureMode
  unit: ResultUnit
  measurements: Measurements
  createdAt: string
  updatedAt: string
}

export interface SavedCalculation {
  id: string
  clientId: string
  measurementSetId?: string
  garments: GarmentType[]
  fabricWidth: number
  options: CalculatorOptions
  results: CalculationResult
  notes?: string
  createdAt: string
}

export interface UserSubscription {
  userId: string
  isActive: boolean
  /** RevenueCat product ID */
  productId?: string
  /** ISO timestamp — undefined means no active subscription */
  expiresAt?: string
  updatedAt: string
}

// ── Input DTOs (for creating/updating records) ───────────────────────────────

export type CreateClient = Omit<Client, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
export type UpdateClient = Partial<CreateClient>

export type CreateMeasurementSet = Omit<MeasurementSet, 'id' | 'createdAt' | 'updatedAt'>
export type UpdateMeasurementSet = Partial<CreateMeasurementSet>

export type CreateSavedCalculation = Omit<SavedCalculation, 'id' | 'createdAt'>
