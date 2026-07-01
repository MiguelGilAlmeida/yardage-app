import { useMemo, useRef, useState } from 'react'
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native'
import { SvgXml } from 'react-native-svg'
import { calculate, getLayoutRows, GARMENT_NAMES } from '../../../shared/calculations/index'
import { DEFAULT_OPTIONS, GARMENT_FIELDS } from '../../../shared/types/index'
import { colors, fonts, radius } from '../../lib/theme'
import type {
  CalculationResult,
  CalculatorOptions,
  FitStyle,
  GarmentType,
  MeasureMode,
  Measurements,
} from '../../../shared/types/index'

// ── Mode selection SVGs ───────────────────────────────────────────────────────

const BODY_MODE_SVG = `<svg viewBox="0 0 44 52" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="22" cy="6" r="5" stroke="#2A2A2A" stroke-width="1.2"/>
  <path d="M8,18 C10,15 16,13 22,13 C28,13 34,15 36,18 L36,46 L8,46 Z" stroke="#2A2A2A" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M8,31 C12,29 32,29 36,31" stroke="#2A2A2A" stroke-width="0.6" stroke-dasharray="1.5,2"/>
  <line x1="2" y1="23" x2="42" y2="23" stroke="#2A2A2A" stroke-width="1"/>
  <path d="M2,23 L6,21 M2,23 L6,25" stroke="#2A2A2A" stroke-width="0.9" stroke-linecap="round"/>
  <path d="M42,23 L38,21 M42,23 L38,25" stroke="#2A2A2A" stroke-width="0.9" stroke-linecap="round"/>
  <line x1="14" y1="21" x2="14" y2="25" stroke="#2A2A2A" stroke-width="0.7"/>
  <line x1="22" y1="21" x2="22" y2="25" stroke="#2A2A2A" stroke-width="0.7"/>
  <line x1="30" y1="21" x2="30" y2="25" stroke="#2A2A2A" stroke-width="0.7"/>
</svg>`

const GARMENT_MODE_SVG = `<svg viewBox="0 0 44 52" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M10,10 C5,13 2,22 2,36 L10,37 C10,26 11,16 10,10" stroke="#2A2A2A" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M34,10 C39,13 42,22 42,36 L34,37 C34,26 33,16 34,10" stroke="#2A2A2A" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M10,10 C9,22 9,36 9,50 L35,50 C35,36 35,22 34,10" stroke="#2A2A2A" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M22,5 L10,10 L13,32 L22,38" stroke="#2A2A2A" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M22,5 L34,10 L31,32 L22,38" stroke="#2A2A2A" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M13,32 C17,28 19,26 22,25 C25,26 27,28 31,32" stroke="#2A2A2A" stroke-width="0.75" stroke-linecap="round"/>
  <path d="M13,32 L16,28" stroke="#2A2A2A" stroke-width="0.75" stroke-linecap="round"/>
  <path d="M31,32 L28,28" stroke="#2A2A2A" stroke-width="0.75" stroke-linecap="round"/>
  <circle cx="22" cy="42" r="1.5" fill="#2A2A2A"/>
  <circle cx="22" cy="48" r="1.5" fill="#2A2A2A"/>
  <line x1="27" y1="19" x2="33" y2="21" stroke="#2A2A2A" stroke-width="0.7"/>
  <line x1="9" y1="43" x2="20" y2="43" stroke="#2A2A2A" stroke-width="0.7"/>
  <line x1="24" y1="43" x2="35" y2="43" stroke="#2A2A2A" stroke-width="0.7"/>
</svg>`

// ── Garment SVG illustrations ─────────────────────────────────────────────────

const GARMENT_SVG: Record<GarmentType, string> = {
  suit2: `<svg viewBox="0 0 64 90" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="#2A2A2A" stroke-linecap="round" stroke-linejoin="round">
  <path stroke-width="0.85" d="M13,15 C7,18 3,28 3,46 L11,48 C11,32 12,20 13,15"/>
  <path stroke-width="0.85" d="M51,15 C57,18 61,28 61,46 L53,48 C53,32 52,20 51,15"/>
  <path stroke-width="0.95" d="M13,15 C11,30 10,56 11,82 L53,82 C54,56 53,30 51,15"/>
  <path stroke-width="0.85" d="M32,9 L13,15 L19,50 L32,56"/>
  <path stroke-width="0.85" d="M32,9 L51,15 L45,50 L32,56"/>
  <path stroke-width="0.7" d="M19,50 C24,46 28,43 32,42 C36,43 40,46 45,50"/>
  <path stroke-width="0.7" d="M19,50 L23,46"/>
  <path stroke-width="0.7" d="M45,50 L41,46"/>
  <circle cx="32" cy="62" r="1.3" fill="#2A2A2A" stroke="none"/>
  <circle cx="32" cy="72" r="1.3" fill="#2A2A2A" stroke="none"/>
  <line x1="40" y1="34" x2="50" y2="37" stroke-width="0.6"/>
  <line x1="11" y1="71" x2="24" y2="71" stroke-width="0.65"/>
  <line x1="40" y1="71" x2="53" y2="71" stroke-width="0.65"/>
  <line x1="4" y1="42" x2="4" y2="46" stroke-width="0.6"/>
  <line x1="6" y1="42" x2="6" y2="46" stroke-width="0.6"/>
  <line x1="58" y1="42" x2="58" y2="46" stroke-width="0.6"/>
  <line x1="60" y1="42" x2="60" y2="46" stroke-width="0.6"/>
</svg>`,
  suit3: `<svg viewBox="0 0 64 90" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="#2A2A2A" stroke-linecap="round" stroke-linejoin="round">
  <path stroke-width="0.85" d="M13,15 C7,18 3,28 3,46 L11,48 C11,32 12,20 13,15"/>
  <path stroke-width="0.85" d="M51,15 C57,18 61,28 61,46 L53,48 C53,32 52,20 51,15"/>
  <path stroke-width="0.95" d="M13,15 C11,30 10,56 11,82 L53,82 C54,56 53,30 51,15"/>
  <path stroke-width="0.85" d="M32,9 L13,15 L19,50 L32,56"/>
  <path stroke-width="0.85" d="M32,9 L51,15 L45,50 L32,56"/>
  <path stroke-width="0.7" d="M19,50 C24,46 28,43 32,42 C36,43 40,46 45,50"/>
  <path stroke-width="0.7" d="M19,50 L23,46"/>
  <path stroke-width="0.7" d="M45,50 L41,46"/>
  <path stroke-width="0.7" fill="#EDE8DF" d="M19,50 L32,56 L45,50 L46,78 L32,80 L18,78 Z"/>
  <path stroke-width="0.65" d="M19,50 L32,60 L45,50"/>
  <circle cx="32" cy="57" r="1.0" fill="#2A2A2A" stroke="none"/>
  <circle cx="32" cy="63" r="1.0" fill="#2A2A2A" stroke="none"/>
  <circle cx="32" cy="69" r="1.0" fill="#2A2A2A" stroke="none"/>
  <circle cx="32" cy="75" r="1.0" fill="#2A2A2A" stroke="none"/>
  <line x1="40" y1="34" x2="50" y2="37" stroke-width="0.6"/>
  <line x1="11" y1="71" x2="24" y2="71" stroke-width="0.65"/>
  <line x1="40" y1="71" x2="53" y2="71" stroke-width="0.65"/>
  <line x1="4" y1="42" x2="4" y2="46" stroke-width="0.6"/>
  <line x1="6" y1="42" x2="6" y2="46" stroke-width="0.6"/>
  <line x1="58" y1="42" x2="58" y2="46" stroke-width="0.6"/>
  <line x1="60" y1="42" x2="60" y2="46" stroke-width="0.6"/>
</svg>`,
  sportcoat: `<svg viewBox="0 0 64 90" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="#2A2A2A" stroke-linecap="round" stroke-linejoin="round">
  <path stroke-width="0.85" d="M13,15 C6,18 2,28 2,48 L11,50 C11,32 12,20 13,15"/>
  <path stroke-width="0.85" d="M51,15 C58,18 62,28 62,48 L53,50 C53,32 52,20 51,15"/>
  <path stroke-width="0.95" d="M13,15 C11,28 9,54 10,84 L54,84 C55,54 53,28 51,15"/>
  <path stroke-width="0.85" d="M32,9 L13,15 L18,52 L32,58"/>
  <path stroke-width="0.85" d="M32,9 L51,15 L46,52 L32,58"/>
  <path stroke-width="0.7" d="M18,52 C23,47 28,44 32,43 C36,44 41,47 46,52"/>
  <path stroke-width="0.7" d="M18,52 L22,47"/>
  <path stroke-width="0.7" d="M46,52 L42,47"/>
  <circle cx="32" cy="64" r="1.3" fill="#2A2A2A" stroke="none"/>
  <circle cx="32" cy="74" r="1.3" fill="#2A2A2A" stroke="none"/>
  <path stroke-width="0.65" d="M40,33 L51,33 L51,44 L40,44 L40,33"/>
  <path stroke-width="0.65" d="M11,65 L26,65 L26,78 L11,78 L11,65"/>
  <path stroke-width="0.65" d="M38,65 L53,65 L53,78 L38,78 L38,65"/>
  <line x1="3" y1="44" x2="3" y2="48" stroke-width="0.6"/>
  <line x1="5" y1="44" x2="5" y2="48" stroke-width="0.6"/>
  <line x1="59" y1="44" x2="59" y2="48" stroke-width="0.6"/>
  <line x1="61" y1="44" x2="61" y2="48" stroke-width="0.6"/>
</svg>`,
  slacks: `<svg viewBox="0 0 64 92" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="#2A2A2A" stroke-linecap="round" stroke-linejoin="round">
  <path stroke-width="0.95" d="M12,10 C12,8 14,7 16,7 L48,7 C50,7 52,8 52,10 L52,17 C52,19 50,20 48,20 L16,20 C14,20 12,19 12,17 Z"/>
  <rect x="19" y="5" width="2.5" height="5" stroke-width="0.55" fill="none"/>
  <rect x="30" y="5" width="2.5" height="5" stroke-width="0.55" fill="none"/>
  <rect x="42" y="5" width="2.5" height="5" stroke-width="0.55" fill="none"/>
  <path stroke-width="0.6" d="M32,20 C31,24 31,28 32,32"/>
  <path stroke-width="0.9" d="M12,20 C11,44 10,66 10,88 L32,88 L32,20"/>
  <path stroke-width="0.9" d="M52,20 C53,44 54,66 54,88 L32,88 L32,20"/>
  <line x1="22" y1="22" x2="19" y2="86" stroke-width="0.5" stroke-dasharray="2,4"/>
  <line x1="42" y1="22" x2="45" y2="86" stroke-width="0.5" stroke-dasharray="2,4"/>
  <path stroke-width="0.65" d="M12,22 C10,30 10,36 12,40"/>
  <path stroke-width="0.65" d="M52,22 C54,30 54,36 52,40"/>
  <line x1="10" y1="83" x2="32" y2="83" stroke-width="0.65"/>
  <line x1="32" y1="83" x2="54" y2="83" stroke-width="0.65"/>
</svg>`,
  vest: `<svg viewBox="0 0 64 92" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="#2A2A2A" stroke-linecap="round" stroke-linejoin="round">
  <path stroke-width="0.95" d="M10,10 C10,8 13,6 16,6 L48,6 C51,6 54,8 54,10 L54,78 C54,80 52,82 50,82 L14,82 C12,82 10,80 10,78 Z"/>
  <path stroke-width="0.85" d="M10,10 C6,14 5,22 8,30 L10,32"/>
  <path stroke-width="0.85" d="M54,10 C58,14 59,22 56,30 L54,32"/>
  <path stroke-width="0.85" d="M16,6 C18,10 26,22 32,38"/>
  <path stroke-width="0.85" d="M48,6 C46,10 38,22 32,38"/>
  <line x1="32" y1="38" x2="32" y2="82" stroke-width="0.6"/>
  <circle cx="32" cy="44" r="1.2" fill="#2A2A2A" stroke="none"/>
  <circle cx="32" cy="53" r="1.2" fill="#2A2A2A" stroke="none"/>
  <circle cx="32" cy="62" r="1.2" fill="#2A2A2A" stroke="none"/>
  <circle cx="32" cy="71" r="1.2" fill="#2A2A2A" stroke="none"/>
  <path stroke-width="0.6" d="M13,46 L24,46 L24,50 L13,50 Z"/>
  <path stroke-width="0.6" d="M40,46 L51,46 L51,50 L40,50 Z"/>
  <path stroke-width="0.7" d="M10,78 C16,84 24,86 32,85 C40,86 48,84 54,78"/>
</svg>`,
  shirt: `<svg viewBox="0 0 96 76" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="#2A2A2A" stroke-linecap="round" stroke-linejoin="round">
  <path stroke-width="0.95" d="M18,18 L18,68 L78,68 L78,18"/>
  <path stroke-width="0.65" d="M18,24 L78,24"/>
  <path stroke-width="0.9" d="M18,18 C14,16 8,14 4,14 L4,46 C4,48 6,50 8,50 L18,48"/>
  <path stroke-width="0.75" d="M4,44 L18,44 L18,50 L4,50 Z"/>
  <path stroke-width="0.9" d="M78,18 C82,16 88,14 92,14 L92,46 C92,48 90,50 88,50 L78,48"/>
  <path stroke-width="0.75" d="M92,44 L78,44 L78,50 L92,50 Z"/>
  <path stroke-width="0.8" d="M34,6 L62,6 L62,12 L34,12 Z"/>
  <path stroke-width="0.8" d="M34,12 L28,22 L48,18 L48,12"/>
  <path stroke-width="0.8" d="M62,12 L68,22 L48,18 L48,12"/>
  <circle cx="48" cy="9" r="1.1" fill="#2A2A2A" stroke="none"/>
  <line x1="48" y1="18" x2="48" y2="67" stroke-width="0.65"/>
  <circle cx="48" cy="27" r="1.1" fill="#2A2A2A" stroke="none"/>
  <circle cx="48" cy="36" r="1.1" fill="#2A2A2A" stroke="none"/>
  <circle cx="48" cy="45" r="1.1" fill="#2A2A2A" stroke="none"/>
  <circle cx="48" cy="54" r="1.1" fill="#2A2A2A" stroke="none"/>
  <circle cx="48" cy="63" r="1.1" fill="#2A2A2A" stroke="none"/>
  <path stroke-width="0.65" d="M58,28 L70,28 L70,38 L58,38 L58,28"/>
  <path stroke-width="0.75" d="M18,68 C24,72 36,74 48,73 C60,74 72,72 78,68"/>
  <circle cx="7" cy="47" r="1.0" fill="#2A2A2A" stroke="none"/>
  <circle cx="89" cy="47" r="1.0" fill="#2A2A2A" stroke="none"/>
</svg>`,
}

const GARMENT_SUB: Record<GarmentType, string> = {
  suit2:     'Coat + Pants',
  suit3:     'Coat + Vest + Pants',
  sportcoat: 'Coat',
  slacks:    'Pants',
  vest:      'Vest',
  shirt:     'Shirt',
}

const GARMENT_SVG_SIZE: Record<GarmentType, { w: number; h: number }> = {
  suit2:     { w: 54, h: 76 },
  suit3:     { w: 54, h: 76 },
  sportcoat: { w: 54, h: 76 },
  slacks:    { w: 54, h: 78 },
  vest:      { w: 54, h: 78 },
  shirt:     { w: 110, h: 87 },
}

// ── Pattern layout SVG builder ────────────────────────────────────────────────

// ── Piece path (ported from web's piecePath) ──────────────────────────────────

function piecePath(
  type: string, x: number, y: number, w: number, h: number,
  mirror: boolean, props?: Record<string, number>
): string {
  const f  = (v: number) => +v.toFixed(3)
  const mx = (px: number) => mirror ? f(x + w - (px - x)) : f(px)
  const my = (py: number) => f(py)
  const L  = (px: number, py: number) => `L ${mx(px)},${my(py)}`
  const M  = (px: number, py: number) => `M ${mx(px)},${my(py)}`
  const C  = (x1: number, y1: number, x2: number, y2: number, ex: number, ey: number) =>
    `C ${mx(x1)},${my(y1)} ${mx(x2)},${my(y2)} ${mx(ex)},${my(ey)}`
  const Q  = (cx: number, cy: number, ex: number, ey: number) =>
    `Q ${mx(cx)},${my(cy)} ${mx(ex)},${my(ey)}`
  const pr = props || {}

  switch (type) {
    case 'jacket-back':
      return [
        M(x+w*0.05, y+h*0.025),
        Q(x+w*0.04, y,  x+w*0.17, y),
        L(x+w*0.84, y+h*0.018),
        C(x+w*0.96, y+h*0.018, x+w, y+h*0.07, x+w, y+h*0.155),
        C(x+w*0.99, y+h*0.22,  x+w*0.93, y+h*0.205, x+w*0.93, y+h*0.25),
        C(x+w*0.93, y+h*0.30,  x+w*0.96, y+h*0.45, x+w*0.96, y+h),
        L(x+w*0.05, y+h),
        C(x+w*0.07, y+h*0.65, x+w*0.04, y+h*0.35, x+w*0.05, y+h*0.025),
        'Z',
      ].join(' ')
    case 'jacket-front':
      return [
        M(x+w*0.20, y),
        L(x+w*0.94, y+h*0.01),
        L(x+w,      y+h*0.10),
        C(x+w*0.98, y+h*0.40, x+w*0.97, y+h*0.62, x+w*0.97, y+h),
        L(x+w*0.03, y+h),
        C(x+w*0.05, y+h*0.55, x+w*0.09, y+h*0.26, x+w*0.09, y+h*0.21),
        C(x+w*0.09, y+h*0.16, x,        y+h*0.12, x,        y+h*0.08),
        C(x,        y+h*0.04, x+w*0.07, y,   x+w*0.20, y),
        'Z',
      ].join(' ')
    case 'vest-front':
      return [
        M(x+w*0.16, y),
        L(x+w*0.94, y+h*0.01),
        L(x+w,      y+h*0.09),
        C(x+w*0.98, y+h*0.40, x+w*0.97, y+h*0.62, x+w*0.97, y+h),
        L(x+w*0.03, y+h),
        C(x+w*0.05, y+h*0.55, x+w*0.07, y+h*0.24, x+w*0.07, y+h*0.19),
        C(x+w*0.07, y+h*0.14, x,        y+h*0.10, x,        y+h*0.07),
        C(x,        y+h*0.03, x+w*0.07, y,        x+w*0.16, y),
        'Z',
      ].join(' ')
    case 'jacket-sleeve-top':
      return [
        M(x,         y+h*0.21),
        C(x,         y+h*0.07, x+w*0.22, y,   x+w*0.50, y),
        C(x+w*0.68,  y,        x+w,      y+h*0.11, x+w, y+h*0.19),
        C(x+w*0.99,  y+h*0.52, x+w*0.90, y+h*0.82, x+w*0.87, y+h),
        L(x+w*0.13,  y+h),
        C(x+w*0.10,  y+h*0.82, x+w*0.01, y+h*0.52, x, y+h*0.21),
        'Z',
      ].join(' ')
    case 'jacket-sleeve-under':
      return [
        M(x,         y+h*0.055),
        C(x+w*0.12,  y+h*0.015, x+w*0.38, y,          x+w*0.50, y+h*0.02),
        C(x+w*0.62,  y,         x+w*0.88, y+h*0.015,  x+w,      y+h*0.055),
        L(x+w*0.91,  y+h),
        L(x+w*0.09,  y+h),
        L(x,         y+h*0.055),
        'Z',
      ].join(' ')
    case 'facing':
      return [
        M(x, y),
        C(x+w*0.4,  y,        x+w*0.85, y+h*0.04, x+w,      y+h*0.08),
        C(x+w*0.92, y+h*0.30, x+w*0.72, y+h*0.60, x+w*0.60, y+h),
        L(x,        y+h),
        L(x,        y),
        'Z',
      ].join(' ')
    case 'trouser-front': {
      const wf = pr.wf ?? 0.55; const hif = pr.hif ?? 0.91; const rf = pr.rf ?? 0.26
      const jd = rf * 0.70
      return [
        M(x,               y),
        L(x+w*wf,          y),
        C(x+w*(wf+0.10),   y-h*0.05, x+w*1.02, y+h*jd*0.5, x+w, y+h*jd),
        L(x+w*hif,         y+h),
        L(x+w*0.09,        y+h),
        C(x+w*0.03,        y+h*0.62, x, y+h*0.28, x, y),
        'Z',
      ].join(' ')
    }
    case 'trouser-back': {
      const wf = pr.wf ?? 0.62; const hif = pr.hif ?? 0.93; const rf = pr.rf ?? 0.26
      return [
        M(x+w*0.06,        y+h*0.09),
        C(x+w*0.20,        y+h*0.01, x+w*wf,      y,         x+w*wf, y),
        C(x+w*(wf+0.16),   y,        x+w,         y+h*0.06,  x+w,    y+h*rf),
        L(x+w*hif,         y+h),
        L(x+w*0.06,        y+h),
        C(x,               y+h*0.62, x,           y+h*0.28,  x+w*0.06, y+h*0.09),
        'Z',
      ].join(' ')
    }
    case 'waistband':
      return [
        M(x,    y),
        L(x+w,  y),
        L(x+w,  y+h),
        C(x+w*0.75, y+h*1.20, x+w*0.25, y+h*1.20, x, y+h),
        L(x,    y),
        'Z',
      ].join(' ')
    case 'shirt-back':
      return [
        M(x+w*0.03, y+h*0.02),
        Q(x+w*0.03, y,        x+w*0.14, y),
        L(x+w*0.87, y+h*0.01),
        C(x+w*0.96, y+h*0.01, x+w,      y+h*0.05, x+w, y+h*0.12),
        L(x+w*0.97, y+h),
        L(x+w*0.03, y+h),
        L(x,        y+h*0.12),
        C(x,        y+h*0.05, x+w*0.03, y+h*0.01, x+w*0.03, y+h*0.02),
        'Z',
      ].join(' ')
    case 'shirt-front':
      return [
        M(x+w*0.15, y),
        L(x+w,      y),
        L(x+w,      y+h),
        L(x,        y+h),
        L(x,        y+h*0.12),
        C(x,        y+h*0.06, x+w*0.05, y+h*0.01, x+w*0.15, y),
        'Z',
      ].join(' ')
    case 'shirt-sleeve':
      return [
        M(x,         y+h*0.23),
        C(x,         y+h*0.06, x+w*0.28, y,        x+w*0.50, y),
        C(x+w*0.72,  y,        x+w,      y+h*0.06, x+w,      y+h*0.23),
        C(x+w*0.99,  y+h*0.52, x+w*0.91, y+h*0.83, x+w*0.87, y+h),
        L(x+w*0.13,  y+h),
        C(x+w*0.09,  y+h*0.83, x+w*0.01, y+h*0.52, x, y+h*0.23),
        'Z',
      ].join(' ')
    case 'collar':
      return [
        M(x,         y+h*0.45),
        C(x+w*0.10,  y+h*0.15, x+w*0.35, y,  x+w*0.50, y),
        C(x+w*0.65,  y,        x+w*0.90, y+h*0.15, x+w, y+h*0.45),
        L(x+w,       y+h),
        Q(x+w*0.75,  y+h*0.80, x+w*0.50, y+h*0.75),
        Q(x+w*0.25,  y+h*0.80, x,        y+h),
        L(x,         y+h*0.45),
        'Z',
      ].join(' ')
    case 'collar-band':
      return [
        M(x,         y+h*0.35),
        C(x+w*0.20,  y+h*0.10, x+w*0.50, y,  x+w*0.80, y+h*0.10),
        Q(x+w*0.90,  y+h*0.22, x+w,      y+h*0.35),
        L(x+w,       y+h),
        L(x,         y+h),
        L(x,         y+h*0.35),
        'Z',
      ].join(' ')
    case 'pocket-bag':
      return [
        M(x,         y),
        L(x+w*0.72,  y),
        L(x+w,       y+h*0.12),
        L(x+w,       y+h*0.80),
        C(x+w,       y+h*0.93, x+w*0.75, y+h, x+w*0.60, y+h),
        L(x+w*0.40,  y+h),
        C(x+w*0.25,  y+h,      x,         y+h*0.93, x, y+h*0.80),
        L(x,         y),
        'Z',
      ].join(' ')
    default:
      return `M ${f(x)},${f(y)} L ${f(x+w)},${f(y)} L ${f(x+w)},${f(y+h)} L ${f(x)},${f(y+h)} Z`
  }
}

// ── Layout SVG builder ────────────────────────────────────────────────────────

function buildLayoutSvg(
  garment: GarmentType,
  m: Measurements,
  opts: CalculatorOptions,
  fabricWidth: number,
  measureMode: MeasureMode,
  unit: 'yards' | 'meters'
): { svg: string; totalH: number } | null {
  const rows = getLayoutRows(garment, m, opts, fabricWidth, measureMode)
  if (!rows.length) return null

  const FW  = fabricWidth
  const GAP = 1.5
  const PAD = 1.5
  const PG  = 0.45

  let totalH = PAD
  rows.forEach(row => { totalH += Math.max(...row.map(e => e.piece.h)) + GAP })
  totalH += PAD - GAP

  const metric   = unit === 'meters'
  const fwLabel  = metric ? `← ${(FW * 2.54).toFixed(0)} cm fabric width →` : `← ${FW}" fabric width →`
  const selLabel = metric ? `${(totalH / 36 * 0.9144).toFixed(1)} m total` : `${(totalH / 36).toFixed(1)} yds total`
  const F = 'system-ui,sans-serif'

  const p: string[] = []

  // Fabric background
  p.push(`<rect width="${FW}" height="${totalH.toFixed(2)}" fill="#0C0C0C"/>`)

  // 10" grid
  for (let gx = 10; gx < FW; gx += 10) {
    p.push(`<line x1="${gx}" y1="0" x2="${gx}" y2="${totalH.toFixed(2)}" stroke="#1E1E1E" stroke-width="0.15"/>`)
  }

  // Double selvedge edges
  p.push(`<line x1="0.5"  y1="0" x2="0.5"  y2="${totalH.toFixed(2)}" stroke="#555" stroke-width="0.25"/>`)
  p.push(`<line x1="1.1"  y1="0" x2="1.1"  y2="${totalH.toFixed(2)}" stroke="#333" stroke-width="0.12"/>`)
  p.push(`<line x1="${(FW-0.5).toFixed(1)}"  y1="0" x2="${(FW-0.5).toFixed(1)}"  y2="${totalH.toFixed(2)}" stroke="#555" stroke-width="0.25"/>`)
  p.push(`<line x1="${(FW-1.1).toFixed(1)}"  y1="0" x2="${(FW-1.1).toFixed(1)}"  y2="${totalH.toFixed(2)}" stroke="#333" stroke-width="0.12"/>`)

  // Width label
  p.push(`<text x="${(FW/2).toFixed(1)}" y="${(PAD*0.62).toFixed(2)}" text-anchor="middle" font-size="1.6" fill="#444" font-family="${F}">${fwLabel}</text>`)

  let rowY = PAD
  rows.forEach((row, ri) => {
    const rowH = Math.max(...row.map(e => e.piece.h))

    row.forEach(({ piece, xOff, yOff }) => {
      const x     = 1.2 + PG + xOff
      const y     = rowY + (yOff || 0)
      const pw    = Math.min(piece.w, FW - x - PG - 1.2)
      const ph    = piece.h
      const shape = (piece as any).shape as string | undefined
      const mir   = !!(piece as any).mirror
      const cx    = x + pw / 2
      const cy    = y + ph / 2

      const d    = piecePath(shape || 'rect', x, y, pw, ph, mir, (piece as any).props)
      const SA_VIS = 0.5
      const iw   = pw - SA_VIS * 2
      const ih   = ph - SA_VIS * 2
      const dSA  = (iw > 1.5 && ih > 1.5)
        ? piecePath(shape || 'rect', x + SA_VIS, y + SA_VIS, iw, ih, mir, (piece as any).props)
        : null

      if ((piece as any).flip180) {
        p.push(`<g transform="rotate(180,${cx.toFixed(3)},${cy.toFixed(3)})">`)
        p.push(`<path d="${d}" fill="none" stroke="#FFF" stroke-width="0.18" stroke-linejoin="round"/>`)
        if (dSA) p.push(`<path d="${dSA}" fill="none" stroke="#555" stroke-width="0.1" stroke-dasharray="0.5,0.35" stroke-linejoin="round"/>`)
        p.push(`</g>`)
      } else {
        p.push(`<path d="${d}" fill="none" stroke="#FFF" stroke-width="0.18" stroke-linejoin="round"/>`)
        if (dSA) p.push(`<path d="${dSA}" fill="none" stroke="#555" stroke-width="0.1" stroke-dasharray="0.5,0.35" stroke-linejoin="round"/>`)
      }

      // Fold line
      if ((piece as any).fold) {
        p.push(`<line x1="${x.toFixed(2)}" y1="${y.toFixed(2)}" x2="${x.toFixed(2)}" y2="${(y+ph).toFixed(2)}" stroke="#FFF" stroke-width="0.2" stroke-dasharray="1,0.6"/>`)
      }

      // Labels: piece name + dimensions
      const dimStr = metric
        ? `${(pw * 2.54).toFixed(1)} × ${(ph * 2.54).toFixed(1)} cm`
        : `${pw.toFixed(1)}" × ${ph.toFixed(1)}"`
      const chars  = piece.n.length
      const dChars = dimStr.length
      const GTXT   = 0.4
      const fs     = Math.min(1.9, pw / (Math.max(chars, dChars) * 0.62), (ph * 0.8 - GTXT) / (1 + 0.68))
      const dimFs  = fs * 0.68
      const showLabel = fs    >= 0.5 && pw > 2 && ph > 2
      const showDim   = dimFs >= 0.35 && ph > 4 && pw > 2
      if (showLabel && showDim) {
        const ny = cy - GTXT / 2 - dimFs / 2
        const dy = cy + GTXT / 2 + fs    / 2
        p.push(`<text x="${cx.toFixed(2)}" y="${ny.toFixed(2)}" text-anchor="middle" dominant-baseline="middle" font-size="${fs.toFixed(2)}" fill="#FFF" font-family="${F}" font-weight="500">${piece.n}</text>`)
        p.push(`<text x="${cx.toFixed(2)}" y="${dy.toFixed(2)}" text-anchor="middle" dominant-baseline="middle" font-size="${dimFs.toFixed(2)}" fill="#888" font-family="${F}">${dimStr}</text>`)
      } else if (showLabel) {
        p.push(`<text x="${cx.toFixed(2)}" y="${cy.toFixed(2)}" text-anchor="middle" dominant-baseline="middle" font-size="${fs.toFixed(2)}" fill="#FFF" font-family="${F}" font-weight="500">${piece.n}</text>`)
      }
    })

    // Row separator
    if (ri < rows.length - 1) {
      const lineY = (rowY + rowH + GAP / 2).toFixed(2)
      p.push(`<line x1="1.2" y1="${lineY}" x2="${(FW-1.2).toFixed(1)}" y2="${lineY}" stroke="#222" stroke-width="0.18" stroke-dasharray="1.5,1"/>`)
    }
    rowY += rowH + GAP
  })

  // Total yardage on right selvedge
  const rx = (FW - 0.4).toFixed(1)
  const ry = (totalH / 2).toFixed(1)
  p.push(`<text x="${rx}" y="${ry}" text-anchor="middle" dominant-baseline="middle" font-size="1.6" fill="#444" font-family="${F}" transform="rotate(90,${rx},${ry})">${selLabel}</text>`)

  return {
    svg: `<svg viewBox="0 0 ${FW} ${totalH.toFixed(1)}" xmlns="http://www.w3.org/2000/svg">${p.join('')}</svg>`,
    totalH,
  }
}

// ── Constants ─────────────────────────────────────────────────────────────────

const COMMON_WIDTHS = [45, 54, 58, 60]
const FIT_OPTIONS: FitStyle[] = ['slim', 'modern', 'classic']

const FIELD_LABELS: Record<keyof Measurements, string> = {
  chest:        'Chest',
  stomach:      'Stomach',
  bicep:        'Bicep',
  shoulder:     'Shoulder',
  sleeveLength: 'Sleeve Length',
  backLength:   'Back Length',
  vestLength:   'Vest Length',
  waist:        'Waist',
  hip:          'Hip / Seat',
  outseam:      'Outseam',
  inseam:       'Inseam',
  legOpen:      'Leg Opening',
  shirtLength:  'Shirt Length',
  neck:         'Neck',
  thigh:        'Thigh',
  calf:         'Calf',
  cuff:         'Cuff',
  urise:        'U-Rise',
}

function fmt(yards: number, unit: 'yards' | 'meters') {
  const v = unit === 'meters' ? yards * 0.9144 : yards
  return `${v.toFixed(2)} ${unit === 'meters' ? 'm' : 'yd'}`
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function CalculatorScreen() {
  const { width: screenWidth } = useWindowDimensions()
  const scrollRef   = useRef<ScrollView>(null)

  // Flow state
  const [step, setStep] = useState<0 | 1 | 2 | 3 | 4>(0)
  const [headerHeight, setHeaderHeight] = useState(96)

  // Feedback state
  const [fbEmail,   setFbEmail]   = useState('')
  const [fbMessage, setFbMessage] = useState('')
  const [fbSending, setFbSending] = useState(false)
  const [fbSent,    setFbSent]    = useState(false)

  async function sendFeedback() {
    if (!fbMessage.trim()) return
    setFbSending(true)
    try {
      await fetch('https://formspree.io/f/mzdldwkk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          _subject: 'Cloth & Chalk Feedback',
          email: fbEmail.trim() || 'not provided',
          message: fbMessage.trim(),
        }),
      })
      setFbSent(true)
      setFbEmail('')
      setFbMessage('')
    } catch {
      Alert.alert('Error', 'Could not send feedback. Please try again.')
    }
    setFbSending(false)
  }

  // Calculator state
  const [garment,      setGarment]      = useState<GarmentType>('suit2')
  const [fabricWidth,  setFabricWidth]  = useState('60')
  const [measureMode,  setMeasureMode]  = useState<MeasureMode>('body')
  const [unit,         setUnit]         = useState<'yards' | 'meters'>('yards')
  const [measurements, setMeasurements] = useState<Record<string, string>>({})
  const [options,      setOptions]      = useState<CalculatorOptions>(DEFAULT_OPTIONS)
  const [result,       setResult]       = useState<CalculationResult | null>(null)
  const [wbWidthStr,   setWbWidthStr]   = useState(String(DEFAULT_OPTIONS.waistbandWidth))
  const [cuffDepthStr, setCuffDepthStr] = useState('1.5')

  const visibleFields = useMemo(() => {
    return GARMENT_FIELDS[garment] as (keyof Measurements)[]
  }, [garment])

  const allMeasurements = useMemo((): Measurements => {
    const m: Measurements = {}
    Object.keys(measurements).forEach(k => {
      const v = parseFloat(measurements[k])
      if (!isNaN(v)) (m as Record<string, number>)[k] = v
    })
    return m
  }, [measurements])

  function goTo(n: 0 | 1 | 2 | 3 | 4) {
    setStep(n)
    setTimeout(() => scrollRef.current?.scrollTo({ y: 0, animated: false }), 0)
  }

  function runCalculation() {
    const m: Measurements = {}
    visibleFields.forEach(f => {
      const v = parseFloat(measurements[f] ?? '')
      if (!isNaN(v)) (m as Record<string, number>)[f] = v
    })
    setResult(calculate({
      garments: [garment],
      fabricWidth: parseFloat(fabricWidth) || 60,
      measureMode, unit,
      measurements: m,
      options,
    }))
    goTo(4)
  }

  function startOver() {
    setGarment('suit2')
    setFabricWidth('60')
    setMeasurements({})
    setOptions(DEFAULT_OPTIONS)
    setResult(null)
    goTo(0)
  }

  const layoutContentWidth = screenWidth - 40

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header} onLayout={e => setHeaderHeight(e.nativeEvent.layout.height)}>
        <HeaderDropdown
          label={`${fabricWidth}"`}
          options={COMMON_WIDTHS.map(w => ({ label: `${w}"`, value: String(w) }))}
          selected={fabricWidth}
          onSelect={setFabricWidth}
          align="left"
          menuTop={headerHeight}
        />
        <TouchableOpacity onPress={startOver}>
          <Text style={styles.headerTitle}>Cloth & Chalk</Text>
        </TouchableOpacity>
        <HeaderDropdown
          label={unit === 'yards' ? 'yds' : 'm'}
          options={[
            { label: 'Yards', value: 'yards' },
            { label: 'Meters', value: 'meters' },
          ]}
          selected={unit}
          onSelect={v => setUnit(v as 'yards' | 'meters')}
          align="right"
          menuTop={headerHeight}
        />
      </View>

      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* Progress track (steps 1-4) */}
        {step > 0 && <ProgressTrack step={step} />}

        {/* ══ STEP 0: Intro + Mode ══ */}
        {step === 0 && (
          <>
            <View style={styles.missionBlock}>
              <Text style={styles.missionTitle}>The Mission.</Text>
              <Text style={styles.missionBody}>
                This calculator estimates the fabric you need based on your measurements,
                so you can order with confidence — no waste, no shortfall. Estimates
                account for piece layout across your fabric width. Results will always
                vary slightly by tailor, seam allowances, and working method, but we
                get you as close as possible.
              </Text>
            </View>

            <Text style={styles.sectionTitle}>How are you{'\n'}measuring?</Text>

            <View style={styles.modeGrid}>
              <ModeCard
                svg={BODY_MODE_SVG}
                label={`Body\nMeasures`}
                sub="Customer's actual body measurements"
                onPress={() => { setMeasureMode('body'); goTo(1) }}
              />
              <ModeCard
                svg={GARMENT_MODE_SVG}
                label={`Finished\nGarment`}
                sub="Dimensions of the finished piece"
                onPress={() => { setMeasureMode('garment'); goTo(1) }}
              />
            </View>

            <View style={styles.fbSection}>
              <Text style={styles.fbTitle}>Leave feedback</Text>
              <Text style={styles.fbSub}>Found a bug? Have a suggestion? Let us know.</Text>
              <TextInput
                style={styles.fbInput}
                value={fbEmail}
                onChangeText={setFbEmail}
                placeholder="Your email (optional)"
                placeholderTextColor={colors.lightGray}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!fbSent}
              />
              <TextInput
                style={[styles.fbInput, styles.fbTextarea]}
                value={fbMessage}
                onChangeText={v => { setFbMessage(v); setFbSent(false) }}
                placeholder="Your feedback…"
                placeholderTextColor={colors.lightGray}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                editable={!fbSent}
              />
              {fbSent ? (
                <Text style={styles.fbThanks}>Thanks — we'll read every note.</Text>
              ) : (
                <TouchableOpacity
                  style={[styles.primaryBtn, (!fbMessage.trim() || fbSending) && styles.btnDisabled, { marginTop: 4 }]}
                  onPress={sendFeedback}
                  disabled={!fbMessage.trim() || fbSending}
                >
                  <Text style={styles.primaryBtnText}>{fbSending ? 'Sending…' : 'Send Feedback'}</Text>
                </TouchableOpacity>
              )}
            </View>
          </>
        )}

        {/* ══ STEP 1: Garments ══ */}
        {step === 1 && (
          <>
            <Text style={styles.stepEyebrow}>Step 1 of 3</Text>
            <Text style={styles.sectionTitle}>What are you{'\n'}making?</Text>

            <View style={styles.gRow}>
              {(['suit2', 'suit3'] as GarmentType[]).map((g, i) => (
                <GarmentCard key={g} garment={g} selected={garment === g}
                  onPress={() => setGarment(g)} first={i === 0} />
              ))}
            </View>
            <View style={[styles.gRow, styles.gRowMt]}>
              {(['sportcoat', 'slacks', 'vest'] as GarmentType[]).map((g, i) => (
                <GarmentCard key={g} garment={g} selected={garment === g}
                  onPress={() => setGarment(g)} first={i === 0} />
              ))}
            </View>
            <View style={[styles.gRow, styles.gRowMt]}>
              <GarmentCard garment="shirt" selected={garment === 'shirt'}
                onPress={() => setGarment('shirt')} first landscape />
            </View>

            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={() => goTo(2)}
            >
              <Text style={styles.primaryBtnText}>Next →</Text>
            </TouchableOpacity>
          </>
        )}

        {/* ══ STEP 2: Style & Fabric ══ */}
        {step === 2 && (() => {
          const hasJacket  = ['suit2','suit3','sportcoat'].includes(garment)
          const hasTrouser = ['suit2','suit3','slacks'].includes(garment)
          const hasVest    = ['suit3','vest'].includes(garment)
          return (
          <>
            <Text style={styles.stepEyebrow}>Step 2 of 3</Text>
            <Text style={styles.sectionTitle}>Style{'\n'}& Fabric</Text>

            {/* ── Fabric ── */}
            <Text style={styles.fieldGroupLabel}>Fabric</Text>
            <View style={styles.chipRow}>
              {(['plain', 'pattern'] as const).map(t => (
                <TouchableOpacity key={t}
                  style={[styles.chip, options.fabricType === t && styles.chipActive]}
                  onPress={() => setOptions(o => ({ ...o, fabricType: t }))}
                >
                  <Text style={[styles.chipText, options.fabricType === t && styles.chipTextActive]}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {options.fabricType === 'pattern' && (
              <>
                <Text style={[styles.fieldGroupLabel, { marginTop: 14 }]}>Pattern Type</Text>
                <View style={styles.chipRow}>
                  {(['stripe', 'check'] as const).map(t => (
                    <TouchableOpacity key={t}
                      style={[styles.chip, options.patternType === t && styles.chipActive]}
                      onPress={() => setOptions(o => ({ ...o, patternType: t }))}
                    >
                      <Text style={[styles.chipText, options.patternType === t && styles.chipTextActive]}>
                        {t === 'check' ? 'Check / Plaid' : 'Stripe'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <Text style={[styles.fieldGroupLabel, { marginTop: 14 }]}>Pattern Repeat Size</Text>
                <View style={styles.repeatRow}>
                  <View style={styles.repeatField}>
                    <Text style={styles.repeatLabel}>Width"</Text>
                    <TextInput style={styles.repeatInput}
                      value={options.patternRepeatW}
                      onChangeText={v => setOptions(o => ({ ...o, patternRepeatW: v }))}
                      keyboardType="decimal-pad" placeholder="—"
                      placeholderTextColor={colors.lightGray}
                    />
                  </View>
                  {options.patternType !== 'stripe' && (
                    <View style={styles.repeatField}>
                      <Text style={styles.repeatLabel}>Height"</Text>
                      <TextInput style={styles.repeatInput}
                        value={options.patternRepeatH}
                        onChangeText={v => setOptions(o => ({ ...o, patternRepeatH: v }))}
                        keyboardType="decimal-pad" placeholder="—"
                        placeholderTextColor={colors.lightGray}
                      />
                    </View>
                  )}
                </View>
                <Text style={styles.optHint}>Leave blank to use default estimates per pattern type.</Text>
              </>
            )}

            {/* ── Fit (body mode only) ── */}
            {measureMode === 'body' && (
              <>
                <Text style={styles.fieldGroupLabel}>Fit</Text>
                <View style={styles.chipRow}>
                  {FIT_OPTIONS.map(f => (
                    <TouchableOpacity key={f}
                      style={[styles.chip, options.fit === f && styles.chipActive]}
                      onPress={() => setOptions(o => ({ ...o, fit: f }))}
                    >
                      <Text style={[styles.chipText, options.fit === f && styles.chipTextActive]}>
                        {f.charAt(0).toUpperCase() + f.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            {/* ── Jacket ── */}
            {hasJacket && (
              <>
                <Text style={styles.optSectionTitle}>Jacket</Text>
                <Text style={styles.fieldGroupLabel}>Lapel</Text>
                <View style={styles.chipRow}>
                  {(['notch','peak','shawl'] as const).map(v => (
                    <TouchableOpacity key={v}
                      style={[styles.chip, options.lapelStyle === v && styles.chipActive]}
                      onPress={() => setOptions(o => ({ ...o, lapelStyle: v }))}
                    >
                      <Text style={[styles.chipText, options.lapelStyle === v && styles.chipTextActive]}>
                        {v.charAt(0).toUpperCase() + v.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <Text style={styles.fieldGroupLabel}>Pockets</Text>
                <View style={styles.chipRow}>
                  {(['flap','jetted','patch'] as const).map(v => (
                    <TouchableOpacity key={v}
                      style={[styles.chip, options.pockets === v && styles.chipActive]}
                      onPress={() => setOptions(o => ({ ...o, pockets: v }))}
                    >
                      <Text style={[styles.chipText, options.pockets === v && styles.chipTextActive]}>
                        {v.charAt(0).toUpperCase() + v.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <Text style={styles.fieldGroupLabel}>Ticket Pocket</Text>
                <View style={styles.chipRow}>
                  {([false, true] as const).map(v => (
                    <TouchableOpacity key={String(v)}
                      style={[styles.chip, options.ticketPocket === v && styles.chipActive]}
                      onPress={() => setOptions(o => ({ ...o, ticketPocket: v }))}
                    >
                      <Text style={[styles.chipText, options.ticketPocket === v && styles.chipTextActive]}>
                        {v ? 'Yes' : 'None'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            {/* ── Pants ── */}
            {hasTrouser && (
              <>
                <Text style={styles.optSectionTitle}>Pants</Text>
                <Text style={styles.fieldGroupLabel}>Waistband Width</Text>
                <View style={styles.numericRow}>
                  <TextInput style={styles.numericInput}
                    value={wbWidthStr}
                    onChangeText={v => {
                      setWbWidthStr(v)
                      const n = parseFloat(v)
                      if (!isNaN(n)) setOptions(o => ({ ...o, waistbandWidth: n }))
                    }}
                    keyboardType="decimal-pad" placeholder="1.5"
                    placeholderTextColor={colors.lightGray}
                  />
                  <Text style={styles.numericUnit}>"</Text>
                  <Text style={styles.numericHint}>¾" – 2½"</Text>
                </View>
                <Text style={styles.fieldGroupLabel}>Cuffs / Turn-ups</Text>
                <View style={styles.chipRow}>
                  <TouchableOpacity
                    style={[styles.chip, options.cuffs === 'none' && styles.chipActive]}
                    onPress={() => setOptions(o => ({ ...o, cuffs: 'none' }))}
                  >
                    <Text style={[styles.chipText, options.cuffs === 'none' && styles.chipTextActive]}>No cuff</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.chip, options.cuffs !== 'none' && styles.chipActive]}
                    onPress={() => setOptions(o => ({ ...o, cuffs: o.cuffs === 'none' ? '1.5' : o.cuffs }))}
                  >
                    <Text style={[styles.chipText, options.cuffs !== 'none' && styles.chipTextActive]}>With cuffs</Text>
                  </TouchableOpacity>
                </View>
                {options.cuffs !== 'none' && (
                  <View style={[styles.numericRow, { marginTop: 8 }]}>
                    <Text style={styles.numericUnit}>Depth </Text>
                    <TextInput style={styles.numericInput}
                      value={cuffDepthStr}
                      onChangeText={v => {
                        setCuffDepthStr(v)
                        const n = parseFloat(v)
                        if (!isNaN(n)) setOptions(o => ({ ...o, cuffs: String(n) }))
                      }}
                      keyboardType="decimal-pad" placeholder="1.5"
                      placeholderTextColor={colors.lightGray}
                    />
                    <Text style={styles.numericUnit}>"</Text>
                    <Text style={styles.numericHint}>¾" – 2½"</Text>
                  </View>
                )}
              </>
            )}

            {/* ── Waistcoat ── */}
            {hasVest && (
              <>
                <Text style={styles.optSectionTitle}>Waistcoat</Text>
                <Text style={styles.fieldGroupLabel}>Pockets</Text>
                <View style={styles.chipRow}>
                  {(['jetted','flap'] as const).map(v => (
                    <TouchableOpacity key={v}
                      style={[styles.chip, options.vestPockets === v && styles.chipActive]}
                      onPress={() => setOptions(o => ({ ...o, vestPockets: v }))}
                    >
                      <Text style={[styles.chipText, options.vestPockets === v && styles.chipTextActive]}>
                        {v.charAt(0).toUpperCase() + v.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <Text style={styles.fieldGroupLabel}>Back</Text>
                <View style={styles.chipRow}>
                  {(['lining','fabric'] as const).map(v => (
                    <TouchableOpacity key={v}
                      style={[styles.chip, options.vestBack === v && styles.chipActive]}
                      onPress={() => setOptions(o => ({ ...o, vestBack: v }))}
                    >
                      <Text style={[styles.chipText, options.vestBack === v && styles.chipTextActive]}>
                        {v === 'lining' ? 'Lining back' : 'Full fabric back'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            <TouchableOpacity style={[styles.primaryBtn, { marginTop: 32 }]} onPress={() => goTo(3)}>
              <Text style={styles.primaryBtnText}>Next →</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryBtn} onPress={() => goTo(1)}>
              <Text style={styles.secondaryBtnText}>← Back</Text>
            </TouchableOpacity>
          </>
          )
        })()}

        {/* ══ STEP 3: Measurements ══ */}
        {step === 3 && (
          <>
            <Text style={styles.stepEyebrow}>Step 3 of 3</Text>
            <Text style={styles.sectionTitle}>Measurements</Text>
            <Text style={styles.measureHint}>
              {measureMode === 'body'
                ? 'Enter the customer\'s actual body measurements in inches.'
                : 'Enter the finished garment dimensions in inches.'}
            </Text>

            <View style={styles.fieldGrid}>
              {visibleFields.map(f => (
                <View key={f} style={styles.fieldItem}>
                  <Text style={styles.fieldLabel}>{FIELD_LABELS[f]}</Text>
                  <TextInput
                    style={styles.fieldInput}
                    value={measurements[f] ?? ''}
                    onChangeText={v => setMeasurements(prev => ({ ...prev, [f]: v }))}
                    keyboardType="decimal-pad"
                    placeholder="—"
                    placeholderTextColor={colors.lightGray}
                  />
                </View>
              ))}
            </View>

            <TouchableOpacity style={[styles.primaryBtn, { marginTop: 32 }]} onPress={runCalculation}>
              <Text style={styles.primaryBtnText}>Calculate Fabric</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryBtn} onPress={() => goTo(2)}>
              <Text style={styles.secondaryBtnText}>← Back</Text>
            </TouchableOpacity>
          </>
        )}

        {/* ══ STEP 4: Results ══ */}
        {step === 4 && result && (() => {
          const totalShell        = result.garments.reduce((s, g) => s + g.shell, 0)
          const totalLining       = result.garments.reduce((s, g) => s + g.lining, 0)
          const totalInterfacing  = result.garments.reduce((s, g) => s + g.interfacing, 0)
          const recommended       = totalShell * 1.1
          const altUnit           = unit === 'yards' ? 'meters' : 'yards'
          const hasPattern        = options.fabricType === 'pattern'
          const patternTypeName   = options.patternType === 'check' ? 'check/plaid' : 'stripe'
          return (
          <>
            <Text style={styles.resultEyebrow}>Estimate Ready</Text>
            <Text style={styles.resultHeadline}>Fabric Required</Text>
            <Text style={styles.resultSubtitle}>
              {fabricWidth}" wide · {measureMode === 'body' ? 'body measures' : 'finished garment'}
            </Text>
            <View style={styles.resultDivider} />

            {/* Per-garment breakdown */}
            {result.garments.map(g => (
              <View key={g.garmentType} style={styles.garmentResult}>
                <Text style={styles.garmentName}>{GARMENT_NAMES[g.garmentType]}</Text>
                {g.shell > 0 && (
                  <View style={styles.resultRow}>
                    <Text style={styles.resultLabel}>Shell</Text>
                    <Text style={styles.resultValue}>{fmt(g.shell, unit)}</Text>
                  </View>
                )}
                {g.lining > 0 && (
                  <View style={styles.resultRow}>
                    <Text style={styles.resultLabel}>Lining</Text>
                    <Text style={styles.resultValue}>{fmt(g.lining, unit)}</Text>
                  </View>
                )}
                {g.interfacing > 0 && (
                  <View style={styles.resultRow}>
                    <Text style={styles.resultLabel}>Interfacing</Text>
                    <Text style={styles.resultValue}>{fmt(g.interfacing, unit)}</Text>
                  </View>
                )}
              </View>
            ))}

            {/* Totals grid */}
            <View style={styles.totalsGrid}>
              <View style={[styles.totalCell, styles.totalCellPrimary]}>
                <Text style={styles.totalCellLabelPrimary}>Cloth</Text>
                <Text style={styles.totalCellAmount}>{fmt(totalShell, unit)}</Text>
                <Text style={styles.totalCellAlt}>{fmt(totalShell, altUnit)}</Text>
              </View>
              {totalLining > 0 && (
                <View style={styles.totalCell}>
                  <Text style={styles.totalCellLabel}>Lining</Text>
                  <Text style={styles.totalCellAmountSec}>{fmt(totalLining, unit)}</Text>
                  <Text style={styles.totalCellAltSec}>{fmt(totalLining, altUnit)}</Text>
                </View>
              )}
              {totalInterfacing > 0 && (
                <View style={styles.totalCell}>
                  <Text style={styles.totalCellLabel}>Interfacing</Text>
                  <Text style={styles.totalCellAmountSec}>{fmt(totalInterfacing, unit)}</Text>
                  <Text style={styles.totalCellAltSec}>{fmt(totalInterfacing, altUnit)}</Text>
                </View>
              )}
            </View>

            {/* Recommended order */}
            <View style={styles.recBox}>
              <Text style={styles.recBoxLabel}>Suggested Order — Cloth</Text>
              <Text style={styles.recBoxAmount}>{fmt(recommended, unit)}</Text>
              <Text style={styles.recBoxAlt}>{fmt(recommended, altUnit)}</Text>
            </View>

            {/* Tip */}
            <View style={styles.tipBox}>
              <Text style={styles.tipText}>
                {'Includes a 10% buffer for cutting and handling. '}
                {hasPattern
                  ? `Pattern matching for ${patternTypeName} fabric is already included.`
                  : 'For plaids or large pattern repeats, add extra yardage to the suggested order.'}
              </Text>
            </View>

            {/* Pattern Layout */}
            <View style={styles.layoutSection}>
              <Text style={styles.layoutTitle}>Pattern Layout</Text>
              <Text style={styles.layoutSub}>
                How pieces fit on {fabricWidth}" wide cloth
              </Text>
              {(() => {
                const fw     = parseFloat(fabricWidth) || 60
                const layout = buildLayoutSvg(garment, allMeasurements, options, fw, measureMode, unit)
                if (!layout) return null
                const displayH = Math.round(layoutContentWidth * (layout.totalH / fw))
                return (
                  <View style={styles.layoutGarment}>
                    <Text style={styles.layoutGarmentLabel}>{GARMENT_NAMES[garment]}</Text>
                    <View style={[styles.layoutFabricWrap, { height: displayH }]}>
                      <SvgXml xml={layout.svg} width={layoutContentWidth} height={displayH} />
                    </View>
                  </View>
                )
              })()}
              <Text style={styles.layoutNote}>
                Representative diagram. Piece proportions are derived from your
                measurements but should not be used as cutting patterns. Always confirm
                yardage with your tailor before ordering.
              </Text>
            </View>

            <TouchableOpacity style={[styles.primaryBtn, { marginTop: 36 }]} onPress={startOver}>
              <Text style={styles.primaryBtnText}>Start Over</Text>
            </TouchableOpacity>
          </>
          )
        })()}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  )
}

// ── Header dropdown ───────────────────────────────────────────────────────────

function HeaderDropdown<T extends string>({
  label, options, selected, onSelect, align, menuTop,
}: {
  label: string
  options: { label: string; value: T }[]
  selected: T
  onSelect: (v: T) => void
  align: 'left' | 'right'
  menuTop: number
}) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <TouchableOpacity style={hdStyles.btn} onPress={() => setOpen(true)} activeOpacity={0.7}>
        <Text style={hdStyles.btnText}>{label}</Text>
        <Text style={hdStyles.chevron}>▾</Text>
      </TouchableOpacity>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <TouchableOpacity style={hdStyles.overlay} activeOpacity={1} onPress={() => setOpen(false)}>
          <View style={[
            hdStyles.menu,
            align === 'left' ? hdStyles.menuLeft : hdStyles.menuRight,
            { top: menuTop + 6 },
          ]}>
            {options.map(opt => (
              <TouchableOpacity
                key={opt.value}
                style={[hdStyles.item, selected === opt.value && hdStyles.itemActive]}
                onPress={() => { onSelect(opt.value); setOpen(false) }}
              >
                <Text style={[hdStyles.itemText, selected === opt.value && hdStyles.itemTextActive]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  )
}

const hdStyles = StyleSheet.create({
  btn:           { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 4, paddingHorizontal: 2 },
  btnText:       { fontFamily: fonts.sansBold, fontSize: 12, color: colors.lightGray, letterSpacing: 0.5 },
  chevron:       { fontSize: 9, color: colors.warmGray, marginTop: 1 },
  overlay:       { flex: 1 },
  menu:          {
    position: 'absolute',
    backgroundColor: colors.offBlack,
    borderRadius: radius.md,
    overflow: 'hidden',
    minWidth: 100,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8,
    elevation: 8,
  },
  menuLeft:      { left: 16 },
  menuRight:     { right: 16 },
  item:          { paddingHorizontal: 18, paddingVertical: 13 },
  itemActive:    { backgroundColor: '#333' },
  itemText:      { fontFamily: fonts.sans, fontSize: 14, color: colors.lightGray },
  itemTextActive:{ fontFamily: fonts.sansBold, color: colors.warmWhite },
})

// ── Progress track ────────────────────────────────────────────────────────────

function ProgressTrack({ step }: { step: number }) {
  // 4 nodes for steps 1-4
  const nodes = [1, 2, 3, 4]
  return (
    <View style={ptStyles.track}>
      {nodes.map((n, i) => (
        <View key={n} style={ptStyles.nodeWrap}>
          {i > 0 && (
            <View style={[ptStyles.line, step >= n && ptStyles.lineDone]} />
          )}
          <View style={[
            ptStyles.node,
            step >= n && ptStyles.nodeDone,
            step === n && ptStyles.nodeActive,
          ]} />
        </View>
      ))}
    </View>
  )
}

const ptStyles = StyleSheet.create({
  track:      { flexDirection: 'row', alignItems: 'center', marginBottom: 28 },
  nodeWrap:   { flexDirection: 'row', alignItems: 'center', flex: 1 },
  line:       { flex: 1, height: 2, backgroundColor: colors.rule },
  lineDone:   { backgroundColor: colors.black },
  node:       { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.rule, flexShrink: 0 },
  nodeDone:   { backgroundColor: colors.black },
  nodeActive: { width: 10, height: 10, borderRadius: 5, marginHorizontal: -1.5 },
})

// ── Mode card ─────────────────────────────────────────────────────────────────

function ModeCard({ svg, label, sub, onPress }: {
  svg: string; label: string; sub: string; onPress: () => void
}) {
  return (
    <TouchableOpacity style={mcStyles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={mcStyles.icon}>
        <SvgXml xml={svg} width={64} height={64} />
      </View>
      <Text style={mcStyles.label}>{label}</Text>
      <Text style={mcStyles.sub}>{sub}</Text>
      <Text style={mcStyles.arrow}>→</Text>
    </TouchableOpacity>
  )
}

const mcStyles = StyleSheet.create({
  card:  {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.rule,
    borderRadius: radius.md,
    backgroundColor: colors.warmWhite,
    padding: 20,
    alignItems: 'center',
  },
  icon:  { marginBottom: 14 },
  label: { fontFamily: fonts.serifBold, fontSize: 16, color: colors.black, textAlign: 'center', marginBottom: 4 },
  sub:   { fontFamily: fonts.sans, fontSize: 11, color: colors.warmGray, textAlign: 'center', lineHeight: 16 },
  arrow: { fontFamily: fonts.sans, fontSize: 14, color: colors.lightGray, marginTop: 14 },
})

// ── Garment card ──────────────────────────────────────────────────────────────

function GarmentCard({
  garment, selected, onPress, first, landscape = false,
}: {
  garment: GarmentType; selected: boolean; onPress: () => void
  first: boolean; landscape?: boolean
}) {
  const size = GARMENT_SVG_SIZE[garment]
  return (
    <TouchableOpacity
      style={[styles.gCard, selected && styles.gCardSelected, !first && styles.gCardGap]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {selected && (
        <View style={styles.gCheckBadge}>
          <Text style={styles.gCheckText}>✓</Text>
        </View>
      )}
      <View style={[styles.gImg, selected && styles.gImgSelected, landscape && styles.gImgLandscape]}>
        <SvgXml xml={GARMENT_SVG[garment]} width={size.w} height={size.h} />
      </View>
      <View style={styles.gInfo}>
        <Text style={styles.gName} numberOfLines={1}>{GARMENT_NAMES[garment]}</Text>
        <Text style={styles.gSub}>{GARMENT_SUB[garment]}</Text>
      </View>
    </TouchableOpacity>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: colors.cream },
  header:     {
    backgroundColor: colors.black,
    paddingTop: 56, paddingBottom: 14, paddingHorizontal: 20,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  headerTitle:     { fontFamily: fonts.serifBold, fontSize: 18, color: colors.warmWhite },
  scroll:          { flex: 1 },
  content:         { paddingHorizontal: 20, paddingTop: 28, paddingBottom: 40 },

  // ── Intro ──
  missionBlock: { marginBottom: 28, paddingBottom: 24, borderBottomWidth: 1, borderBottomColor: colors.rule },
  missionTitle: { fontFamily: fonts.serifBold, fontSize: 26, color: colors.black, lineHeight: 32, marginBottom: 10 },
  missionBody:  { fontFamily: fonts.sans, fontSize: 13, color: colors.black, lineHeight: 22, letterSpacing: 0.2 },
  sectionTitle: { fontFamily: fonts.serifBold, fontSize: 26, color: colors.black, lineHeight: 32, marginBottom: 22 },
  modeGrid:     { flexDirection: 'row', gap: 12 },

  // ── Steps ──
  stepEyebrow:  {
    fontFamily: fonts.sansBold, fontSize: 10, color: colors.warmGray,
    textTransform: 'uppercase', letterSpacing: 3, marginBottom: 6,
  },
  measureHint:  { fontFamily: fonts.sans, fontSize: 13, color: colors.warmGray, marginBottom: 20, lineHeight: 20 },

  // ── Garment cards ──
  gRow:           { flexDirection: 'row' },
  gRowMt:         { marginTop: 6 },
  gCard:          {
    flex: 1, borderWidth: 1, borderColor: colors.rule, borderRadius: radius.sm,
    backgroundColor: colors.warmWhite, overflow: 'hidden', position: 'relative',
  },
  gCardGap:       { marginLeft: 6 },
  gCardSelected:  { borderColor: colors.black, borderWidth: 1.5 },
  gCheckBadge:    {
    position: 'absolute', top: 7, right: 7, zIndex: 2,
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: colors.black, alignItems: 'center', justifyContent: 'center',
  },
  gCheckText:     { fontFamily: fonts.sansBold, fontSize: 10, color: colors.warmWhite },
  gImg:           { backgroundColor: colors.cream, height: 110, alignItems: 'center', justifyContent: 'center', paddingVertical: 12 },
  gImgSelected:   { backgroundColor: colors.creamDark },
  gImgLandscape:  { height: 90 },
  gInfo:          { paddingHorizontal: 10, paddingVertical: 10, borderTopWidth: 1, borderTopColor: colors.rule },
  gName:          { fontFamily: fonts.serifBold, fontSize: 13, color: colors.black },
  gSub:           { fontFamily: fonts.sans, fontSize: 10, color: colors.warmGray, marginTop: 1 },

  // ── Controls ──
  fieldGroupLabel: {
    fontFamily: fonts.sansBold, fontSize: 10, color: colors.warmGray,
    textTransform: 'uppercase', letterSpacing: 2, marginBottom: 10, marginTop: 24,
  },
  chipRow:         { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip:            {
    borderWidth: 1, borderColor: colors.rule, borderRadius: radius.sm,
    paddingHorizontal: 14, paddingVertical: 8, backgroundColor: colors.warmWhite,
  },
  chipActive:      { backgroundColor: colors.black, borderColor: colors.black },
  chipText:        { fontFamily: fonts.sans, fontSize: 13, color: colors.charcoal },
  chipTextActive:  { color: colors.warmWhite },
  fieldGrid:           { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  fieldItem:           { width: '47%' },
  fieldLabel:          {
    fontFamily: fonts.sansBold, fontSize: 10, color: colors.warmGray,
    textTransform: 'uppercase', letterSpacing: 1, marginBottom: 5,
  },
  fieldInput:          {
    borderWidth: 1, borderColor: colors.rule, borderRadius: radius.sm,
    paddingHorizontal: 12, paddingVertical: 10,
    fontFamily: fonts.sans, fontSize: 14, color: colors.text, backgroundColor: colors.warmWhite,
  },

  // ── Buttons ──
  primaryBtn:     {
    backgroundColor: colors.black, borderRadius: radius.sm,
    paddingVertical: 16, alignItems: 'center', marginTop: 28,
  },
  primaryBtnText: { fontFamily: fonts.sansBold, color: colors.warmWhite, fontSize: 13, letterSpacing: 1.5, textTransform: 'uppercase' },
  secondaryBtn:   {
    borderWidth: 1, borderColor: colors.rule, borderRadius: radius.sm,
    paddingVertical: 14, alignItems: 'center', marginTop: 10, backgroundColor: colors.warmWhite,
  },
  secondaryBtnText:{ fontFamily: fonts.sansBold, fontSize: 13, color: colors.charcoal, letterSpacing: 0.5 },
  btnDisabled:    { opacity: 0.35 },

  // ── Results ──
  resultEyebrow:  {
    fontFamily: fonts.sansBold, fontSize: 10, color: colors.warmGray,
    textTransform: 'uppercase', letterSpacing: 3, marginBottom: 6,
  },
  resultHeadline: { fontFamily: fonts.serifBold, fontSize: 28, color: colors.black, marginBottom: 4 },
  resultSubtitle: { fontFamily: fonts.sans, fontSize: 12, color: colors.warmGray },
  resultDivider:  { height: 1, backgroundColor: colors.rule, marginVertical: 20 },
  garmentResult:  { marginBottom: 22 },
  garmentName:    {
    fontFamily: fonts.sansBold, fontSize: 11, color: colors.warmGray,
    textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8,
  },
  resultRow:      {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: colors.creamDark,
  },
  resultLabel:    { fontFamily: fonts.sans, fontSize: 14, color: colors.charcoal },
  resultValue:    { fontFamily: fonts.sansMedium, fontSize: 14, color: colors.offBlack },
  // ── Totals grid ──
  totalsGrid:           { flexDirection: 'row', gap: 8, marginTop: 24, marginBottom: 4 },
  totalCell:            {
    flex: 1, borderWidth: 1, borderColor: colors.rule,
    borderRadius: radius.sm, paddingHorizontal: 12, paddingVertical: 14,
    backgroundColor: colors.warmWhite, alignItems: 'flex-start',
  },
  totalCellPrimary:     { backgroundColor: colors.black, borderColor: colors.black },
  totalCellLabelPrimary:{ fontFamily: fonts.sansBold, fontSize: 9, color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8 },
  totalCellLabel:       { fontFamily: fonts.sansBold, fontSize: 9, color: colors.warmGray, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8 },
  totalCellAmount:      { fontFamily: fonts.serifBold, fontSize: 22, color: colors.warmWhite, marginBottom: 2 },
  totalCellAmountSec:   { fontFamily: fonts.serifBold, fontSize: 20, color: colors.black, marginBottom: 2 },
  totalCellAlt:         { fontFamily: fonts.sans, fontSize: 11, color: 'rgba(255,255,255,0.45)' },
  totalCellAltSec:      { fontFamily: fonts.sans, fontSize: 11, color: colors.warmGray },

  // ── Recommended order ──
  recBox:       {
    backgroundColor: colors.black, borderRadius: radius.sm,
    paddingHorizontal: 20, paddingVertical: 20, marginTop: 16, alignItems: 'center',
  },
  recBoxLabel:  { fontFamily: fonts.sansBold, fontSize: 9, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 10 },
  recBoxAmount: { fontFamily: fonts.serifBold, fontSize: 38, color: colors.warmWhite },
  recBoxAlt:    { fontFamily: fonts.sans, fontSize: 13, color: 'rgba(255,255,255,0.45)', marginTop: 4 },

  // ── Tip box ──
  tipBox:  {
    backgroundColor: colors.warmWhite, borderWidth: 1, borderColor: colors.rule,
    borderRadius: radius.sm, paddingHorizontal: 16, paddingVertical: 14, marginTop: 12,
  },
  tipText: { fontFamily: fonts.sans, fontSize: 12, color: colors.charcoal, lineHeight: 20 },

  // ── Step 2 style options ──
  optSectionTitle: {
    fontFamily: fonts.sansBold, fontSize: 11, color: colors.offBlack,
    textTransform: 'uppercase', letterSpacing: 2.5,
    marginTop: 32, marginBottom: 14, paddingTop: 20,
    borderTopWidth: 1, borderTopColor: colors.rule,
  },
  optHint:         { fontFamily: fonts.sans, fontSize: 11, color: colors.lightGray, lineHeight: 16, marginTop: 6, marginBottom: 4 },
  repeatRow:       { flexDirection: 'row', gap: 10, marginTop: 4 },
  repeatField:     { flex: 1 },
  repeatLabel:     { fontFamily: fonts.sans, fontSize: 11, color: colors.charcoal, marginBottom: 4 },
  repeatInput:     {
    borderWidth: 1, borderColor: colors.rule, borderRadius: radius.sm,
    paddingHorizontal: 12, paddingVertical: 10,
    fontFamily: fonts.sans, fontSize: 14, color: colors.text,
    backgroundColor: colors.warmWhite, textAlign: 'center',
  },
  numericRow:      { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  numericInput:    {
    borderWidth: 1, borderColor: colors.rule, borderRadius: radius.sm,
    paddingHorizontal: 14, paddingVertical: 10,
    fontFamily: fonts.sans, fontSize: 16, color: colors.text,
    backgroundColor: colors.warmWhite, width: 80, textAlign: 'center',
  },
  numericUnit:     { fontFamily: fonts.sansBold, fontSize: 14, color: colors.charcoal },
  numericHint:     { fontFamily: fonts.sans, fontSize: 11, color: colors.warmGray, marginLeft: 4 },

  // ── Layout ──
  layoutSection:      { marginTop: 32, borderTopWidth: 1, borderTopColor: colors.rule, paddingTop: 24 },
  layoutTitle:        { fontFamily: fonts.serifBold, fontSize: 20, color: colors.black, marginBottom: 4 },
  layoutSub:          { fontFamily: fonts.sans, fontSize: 12, color: colors.warmGray, marginBottom: 20 },
  layoutGarment:      { marginBottom: 24 },
  layoutGarmentLabel: {
    fontFamily: fonts.sansBold, fontSize: 10, color: colors.charcoal,
    textTransform: 'uppercase', letterSpacing: 2, marginBottom: 8,
  },
  layoutFabricWrap:   { borderWidth: 1, borderColor: colors.rule, overflow: 'hidden' },
  layoutNote:         { fontFamily: fonts.sans, fontSize: 11, color: colors.warmGray, lineHeight: 18, marginTop: 8 },

  fbSection:  { marginTop: 40, paddingTop: 32, borderTopWidth: 1, borderTopColor: colors.rule },
  fbTitle:    { fontFamily: fonts.serifBold, fontSize: 18, color: colors.black, marginBottom: 4 },
  fbSub:      { fontFamily: fonts.sans, fontSize: 12, color: colors.lightGray, marginBottom: 16 },
  fbInput:    {
    borderWidth: 1, borderColor: colors.rule, borderRadius: radius.sm,
    paddingHorizontal: 12, paddingVertical: 11,
    fontFamily: fonts.sans, fontSize: 13, color: colors.text,
    backgroundColor: colors.warmWhite, marginBottom: 10,
  },
  fbTextarea: { height: 100, paddingTop: 11 },
  fbThanks:   { fontFamily: fonts.sans, fontSize: 12, color: colors.lightGray, marginTop: 4 },

  bottomSpacer: { height: 40 },
})
