export type SteelProfileType = 'SHS' | 'RHS' | 'CHS' | 'UPE' | 'IPN' | 'EA' | 'H_BEAM';

export interface SteelThicknessOption {
  thickness: string; // e.g., '1.2mm', '1.6mm', '2.0mm'
  weight_per_meter: number; // in kg/m
}

export interface SteelSizeOption {
  size: string; // e.g., '20x20', '50x25', '48.3 (1 1/2")', '100x100x6x8'
  thicknesses: SteelThicknessOption[];
}

export interface SteelProfileDefinition {
  type: SteelProfileType;
  label: string; // e.g., 'Square Pipe (SHS)'
  description: string;
  hasThicknessDropdown?: boolean;
  sizes: SteelSizeOption[];
}

/**
 * Standard Mathematical Calculation Formulas for Hollow Steel Sections
 * Density of steel = 7850 kg/m³ = 0.00785 g/mm³
 */

// Square Hollow Section: 4 * t * (A - t) * 0.00785
export function calculateSHSWeight(sizeMm: number, thicknessMm: number): number {
  const weight = 4 * thicknessMm * (sizeMm - thicknessMm) * 0.00785;
  return Number(weight.toFixed(2));
}

// Rectangular Hollow Section: 2 * t * (A + B - 2t) * 0.00785
export function calculateRHSWeight(widthMm: number, heightMm: number, thicknessMm: number): number {
  const weight = 2 * thicknessMm * (widthMm + heightMm - 2 * thicknessMm) * 0.00785;
  return Number(weight.toFixed(2));
}

// Circular Hollow Section: π * (D - t) * t * 0.00785
export function calculateCHSWeight(diameterMm: number, thicknessMm: number): number {
  const weight = Math.PI * (diameterMm - thicknessMm) * thicknessMm * 0.00785;
  return Number(weight.toFixed(2));
}

/**
 * Standard Gauges for Hollow Sections (SHS, RHS, CHS)
 */
export const STANDARD_HOLLOW_GAUGES = [1.2, 1.6, 2.0, 3.0, 4.0];

function generateSHSThicknesses(sizeMm: number): SteelThicknessOption[] {
  return STANDARD_HOLLOW_GAUGES.map((t) => ({
    thickness: `${t.toFixed(1)}mm`,
    weight_per_meter: calculateSHSWeight(sizeMm, t),
  }));
}

function generateRHSThicknesses(widthMm: number, heightMm: number): SteelThicknessOption[] {
  return STANDARD_HOLLOW_GAUGES.map((t) => ({
    thickness: `${t.toFixed(1)}mm`,
    weight_per_meter: calculateRHSWeight(widthMm, heightMm, t),
  }));
}

function generateCHSThicknesses(diameterMm: number): SteelThicknessOption[] {
  return STANDARD_HOLLOW_GAUGES.map((t) => ({
    thickness: `${t.toFixed(1)}mm`,
    weight_per_meter: calculateCHSWeight(diameterMm, t),
  }));
}

/**
 * Exact Fixed Lookup Table for H Beam Sections
 * Maps Size (Height x Flange Width x Web Thickness x Flange Thickness in mm) -> Weight (kg/m)
 */
export const H_BEAM: Record<string, number> = {
  "100x100x6x8": 17.2,
  "125x125x6.5x9": 23.8,
  "150x150x7x10": 31.1,
  "175x175x7.5x11": 40.4,
  "200x100x5.5x8": 18.2,
  "200x200x8x12": 49.9,
  "250x125x6x9": 25.7,
  "250x250x9x14": 72.4,
  "300x150x6.5x9": 32.0,
  "300x300x10x15": 94.5,
  "350x175x7x11": 41.4,
  "350x350x11x16": 121.0,
  "400x200x8x13": 56.2,
  "400x400x13x21": 172.0,
  "450x200x9x14": 60.5,
  "450x300x11x15": 93.9,
  "450x450x14x23": 212.0,
  "500x200x10x16": 72.3,
  "500x300x11x15": 101.0,
  "500x400x13x21": 166.0,
  "500x500x15x25": 244.0,
  "600x200x10x17": 79.5,
  "600x300x12x20": 133.0,
  "600x400x13x24": 178.0,
  "600x600x15x28": 291.0,
  "700x300x13x24": 168.0,
  "700x400x15x28": 218.0,
  "700x500x16x30": 260.0,
  "800x300x14x26": 191.0,
  "800x400x16x30": 241.0,
  "800x800x18x34": 386.0,
  "900x300x15x28": 226.0,
  "900x400x16x32": 254.0,
  "900x900x20x36": 442.0,
  "1000x300x16x30": 255.0,
  "1000x400x18x35": 317.0,
  "1000x500x20x36": 354.0,
  "1000x600x22x40": 429.0,
  "1000x1000x24x40": 524.0,
};

/**
 * Static Lookup Table for Structural Steel Sections
 * All weight values are in kg/m (Kilograms per Linear Meter)
 */
export const STEEL_SECTIONS_DATABASE: SteelProfileDefinition[] = [
  {
    type: 'SHS',
    label: 'Square Pipe (SHS)',
    description: 'Square steel tubes & box pipes (Standard Gauges: 1.2mm, 1.6mm, 2.0mm, 3.0mm, 4.0mm)',
    hasThicknessDropdown: true,
    sizes: [
      { size: '20x20', thicknesses: generateSHSThicknesses(20) },
      { size: '25x25', thicknesses: generateSHSThicknesses(25) },
      { size: '30x30', thicknesses: generateSHSThicknesses(30) },
      { size: '40x40', thicknesses: generateSHSThicknesses(40) },
      { size: '50x50', thicknesses: generateSHSThicknesses(50) },
      { size: '60x60', thicknesses: generateSHSThicknesses(60) },
      { size: '80x80', thicknesses: generateSHSThicknesses(80) },
      { size: '100x100', thicknesses: generateSHSThicknesses(100) },
    ],
  },
  {
    type: 'RHS',
    label: 'Rectangle Pipe (RHS)',
    description: 'Rectangular steel tubes & purlins (Standard Gauges: 1.2mm, 1.6mm, 2.0mm, 3.0mm, 4.0mm)',
    hasThicknessDropdown: true,
    sizes: [
      { size: '40x20', thicknesses: generateRHSThicknesses(40, 20) },
      { size: '50x25', thicknesses: generateRHSThicknesses(50, 25) },
      { size: '50x30', thicknesses: generateRHSThicknesses(50, 30) },
      { size: '60x40', thicknesses: generateRHSThicknesses(60, 40) },
      { size: '80x40', thicknesses: generateRHSThicknesses(80, 40) },
      { size: '100x50', thicknesses: generateRHSThicknesses(100, 50) },
      { size: '120x60', thicknesses: generateRHSThicknesses(120, 60) },
      { size: '150x100', thicknesses: generateRHSThicknesses(150, 100) },
    ],
  },
  {
    type: 'CHS',
    label: 'Round Pipe (CHS)',
    description: 'Round structural steel pipes (Standard Gauges: 1.2mm, 1.6mm, 2.0mm, 3.0mm, 4.0mm)',
    hasThicknessDropdown: true,
    sizes: [
      { size: '21.3mm (1/2")', thicknesses: generateCHSThicknesses(21.3) },
      { size: '26.9mm (3/4")', thicknesses: generateCHSThicknesses(26.9) },
      { size: '33.7mm (1")', thicknesses: generateCHSThicknesses(33.7) },
      { size: '42.4mm (1 1/4")', thicknesses: generateCHSThicknesses(42.4) },
      { size: '48.3mm (1 1/2")', thicknesses: generateCHSThicknesses(48.3) },
      { size: '60.3mm (2")', thicknesses: generateCHSThicknesses(60.3) },
      { size: '76.1mm (2 1/2")', thicknesses: generateCHSThicknesses(76.1) },
      { size: '88.9mm (3")', thicknesses: generateCHSThicknesses(88.9) },
      { size: '114.3mm (4")', thicknesses: generateCHSThicknesses(114.3) },
    ],
  },
  {
    type: 'UPE',
    label: 'U Channel (UPE)',
    description: 'European standard channels with parallel flanges (DIN 1026-2)',
    hasThicknessDropdown: true,
    sizes: [
      { size: 'UPE 80', thicknesses: [{ thickness: 'Standard (tw 4.5mm / tf 6.5mm)', weight_per_meter: 7.90 }] },
      { size: 'UPE 100', thicknesses: [{ thickness: 'Standard (tw 5.0mm / tf 7.5mm)', weight_per_meter: 9.82 }] },
      { size: 'UPE 120', thicknesses: [{ thickness: 'Standard (tw 5.0mm / tf 8.0mm)', weight_per_meter: 12.10 }] },
      { size: 'UPE 140', thicknesses: [{ thickness: 'Standard (tw 5.5mm / tf 8.5mm)', weight_per_meter: 14.50 }] },
      { size: 'UPE 160', thicknesses: [{ thickness: 'Standard (tw 6.0mm / tf 9.5mm)', weight_per_meter: 17.00 }] },
      { size: 'UPE 180', thicknesses: [{ thickness: 'Standard (tw 6.5mm / tf 10.0mm)', weight_per_meter: 19.70 }] },
      { size: 'UPE 200', thicknesses: [{ thickness: 'Standard (tw 7.0mm / tf 10.5mm)', weight_per_meter: 22.80 }] },
      { size: 'UPE 240', thicknesses: [{ thickness: 'Standard (tw 7.0mm / tf 12.5mm)', weight_per_meter: 30.20 }],
      },
    ],
  },
  {
    type: 'IPN',
    label: 'I Beam (IPN)',
    description: 'Standard European I-beam with inclined inner flange faces (DIN 1025-1)',
    hasThicknessDropdown: true,
    sizes: [
      { size: 'IPN 80', thicknesses: [{ thickness: 'Standard (tw 3.9mm / tf 5.9mm)', weight_per_meter: 5.94 }] },
      { size: 'IPN 100', thicknesses: [{ thickness: 'Standard (tw 4.5mm / tf 6.8mm)', weight_per_meter: 8.34 }] },
      { size: 'IPN 120', thicknesses: [{ thickness: 'Standard (tw 5.1mm / tf 7.7mm)', weight_per_meter: 11.10 }] },
      { size: 'IPN 140', thicknesses: [{ thickness: 'Standard (tw 5.7mm / tf 8.6mm)', weight_per_meter: 14.30 }] },
      { size: 'IPN 160', thicknesses: [{ thickness: 'Standard (tw 6.3mm / tf 9.5mm)', weight_per_meter: 17.90 }] },
      { size: 'IPN 180', thicknesses: [{ thickness: 'Standard (tw 6.9mm / tf 10.4mm)', weight_per_meter: 21.90 }] },
      { size: 'IPN 200', thicknesses: [{ thickness: 'Standard (tw 7.5mm / tf 11.3mm)', weight_per_meter: 26.20 }] },
      { size: 'IPN 240', thicknesses: [{ thickness: 'Standard (tw 8.7mm / tf 13.1mm)', weight_per_meter: 36.20 }] },
    ],
  },
  {
    type: 'EA',
    label: 'Angle (EA)',
    description: 'Hot rolled equal angle steel (EN 10056-1)',
    hasThicknessDropdown: true,
    sizes: [
      {
        size: '25x25',
        thicknesses: [
          { thickness: '3.0mm', weight_per_meter: 1.12 },
          { thickness: '4.0mm', weight_per_meter: 1.45 },
          { thickness: '5.0mm', weight_per_meter: 1.77 },
        ],
      },
      {
        size: '30x30',
        thicknesses: [
          { thickness: '3.0mm', weight_per_meter: 1.36 },
          { thickness: '4.0mm', weight_per_meter: 1.78 },
          { thickness: '5.0mm', weight_per_meter: 2.18 },
        ],
      },
      {
        size: '40x40',
        thicknesses: [
          { thickness: '3.0mm', weight_per_meter: 1.84 },
          { thickness: '4.0mm', weight_per_meter: 2.42 },
          { thickness: '5.0mm', weight_per_meter: 2.97 },
        ],
      },
      {
        size: '50x50',
        thicknesses: [
          { thickness: '4.0mm', weight_per_meter: 3.06 },
          { thickness: '5.0mm', weight_per_meter: 3.77 },
          { thickness: '6.0mm', weight_per_meter: 4.47 },
        ],
      },
      {
        size: '60x60',
        thicknesses: [
          { thickness: '5.0mm', weight_per_meter: 4.57 },
          { thickness: '6.0mm', weight_per_meter: 5.42 },
          { thickness: '8.0mm', weight_per_meter: 7.09 },
        ],
      },
      {
        size: '70x70',
        thicknesses: [
          { thickness: '6.0mm', weight_per_meter: 6.38 },
          { thickness: '7.0mm', weight_per_meter: 7.38 },
          { thickness: '8.0mm', weight_per_meter: 8.36 },
        ],
      },
      {
        size: '80x80',
        thicknesses: [
          { thickness: '6.0mm', weight_per_meter: 7.34 },
          { thickness: '8.0mm', weight_per_meter: 9.63 },
          { thickness: '10.0mm', weight_per_meter: 11.90 },
        ],
      },
      {
        size: '100x100',
        thicknesses: [
          { thickness: '8.0mm', weight_per_meter: 12.20 },
          { thickness: '10.0mm', weight_per_meter: 15.00 },
          { thickness: '12.0mm', weight_per_meter: 17.80 },
        ],
      },
    ],
  },
  {
    type: 'H_BEAM',
    label: 'H Beam',
    description: 'Hot-rolled structural H-beams with fixed weight per meter (dimensions: H x B x tw x tf)',
    hasThicknessDropdown: false,
    sizes: Object.entries(H_BEAM).map(([size, weight]) => ({
      size,
      thicknesses: [{ thickness: 'Standard', weight_per_meter: weight }],
    })),
  },
];

/**
 * Helper to lookup weight per meter for given profile, size, and thickness
 */
export function getWeightPerMeter(
  profileType: SteelProfileType,
  size: string,
  thickness?: string
): number {
  const profile = STEEL_SECTIONS_DATABASE.find((p) => p.type === profileType);
  if (!profile) return 0;
  const sizeOption = profile.sizes.find((s) => s.size === size) || profile.sizes[0];
  if (!sizeOption) return 0;
  if (profile.hasThicknessDropdown === false || !thickness) {
    return sizeOption.thicknesses[0]?.weight_per_meter || 0;
  }
  const thicknessOption =
    sizeOption.thicknesses.find((t) => t.thickness === thickness) ||
    sizeOption.thicknesses[0];
  return thicknessOption?.weight_per_meter || 0;
}

/**
 * Calculation helper for Structural Steel
 */
export function calculateSteelSectionWeight({
  weightPerMeter,
  lengthMeters,
  quantity,
}: {
  weightPerMeter: number;
  lengthMeters: number;
  quantity: number;
}) {
  const totalLengthMeters = Number(((lengthMeters || 0) * (quantity || 0)).toFixed(2));
  const weightPerPieceKg = Number(((weightPerMeter || 0) * (lengthMeters || 0)).toFixed(3));
  const totalWeightKg = Number(((weightPerPieceKg || 0) * (quantity || 0)).toFixed(2));

  return {
    totalLengthMeters,
    weightPerPieceKg,
    totalWeightKg,
  };
}
