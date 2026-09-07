/**
 * Currency Formatter (INR / Standard format)
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount || 0);
}

export function formatNumber(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount || 0);
}

/**
 * Date Formatter
 */
export function formatDate(dateString: string): string {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(date);
  } catch {
    return dateString;
  }
}

/**
 * Calculates number of days between dates
 */
export function addDays(dateStr: string, days: number): string {
  const date = new Date(dateStr);
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
}

/**
 * Convert numbers to Indian Rupees in words (e.g. "One Lakh Sixty-Five Thousand...")
 */
export function numberToWords(amount: number): string {
  const num = Math.round(amount);
  if (num === 0) return 'Zero Rupees Only';

  const single = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
    'Seventeen', 'Eighteen', 'Nineteen'
  ];

  const tens = [
    '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'
  ];

  function convertTwoDigits(n: number): string {
    if (n < 20) return single[n];
    const ten = Math.floor(n / 10);
    const unit = n % 10;
    return tens[ten] + (unit ? ' ' + single[unit] : '');
  }

  function convertThreeDigits(n: number): string {
    const hundred = Math.floor(n / 100);
    const remainder = n % 100;
    let res = '';
    if (hundred > 0) {
      res += single[hundred] + ' Hundred';
      if (remainder > 0) res += ' and ';
    }
    if (remainder > 0) {
      res += convertTwoDigits(remainder);
    }
    return res;
  }

  let crore = Math.floor(num / 10000000);
  let lakh = Math.floor((num % 10000000) / 100000);
  let thousand = Math.floor((num % 100000) / 1000);
  let hundred = num % 1000;

  let words = '';

  if (crore > 0) {
    words += convertTwoDigits(crore) + ' Crore ';
  }
  if (lakh > 0) {
    words += convertTwoDigits(lakh) + ' Lakh ';
  }
  if (thousand > 0) {
    words += convertTwoDigits(thousand) + ' Thousand ';
  }
  if (hundred > 0) {
    words += convertThreeDigits(hundred) + ' ';
  }

  return words.trim() + ' Rupees Only';
}

/**
 * Quotation calculations helper
 */
export function calculateLineItem(
  unitPrice: number,
  quantity: number,
  taxRate: number = 0
) {
  const lineSubtotal = Number(((unitPrice || 0) * (quantity || 0)).toFixed(2));
  const lineTax = Number(((lineSubtotal * (taxRate || 0)) / 100).toFixed(2));
  // Line total without per-row tax:
  const lineTotal = lineSubtotal;

  return {
    line_subtotal: lineSubtotal,
    line_tax: lineTax,
    line_total: lineTotal,
  };
}

/**
 * Calculates aggregate Steel length, weight, and cost across steel rows
 */
export function calculateSteelTotals(
  items: Array<{
    item_type?: string;
    length_meters?: number;
    quantity?: number;
    weight_kg?: number;
    unit_weight_kg?: number;
    product_name?: string;
  }>,
  steelPricePerKg: number = 0
) {
  let totalSteelLengthMeters = 0;
  let totalSteelWeightKg = 0;

  (items || []).forEach((item) => {
    if (item.item_type === 'steel') {
      const length = typeof item.length_meters === 'number' ? item.length_meters : 0;
      const qty = typeof item.quantity === 'number' ? item.quantity : 0;
      totalSteelLengthMeters += length * qty;
      totalSteelWeightKg += typeof item.weight_kg === 'number' ? item.weight_kg : 0;
    }
  });

  totalSteelLengthMeters = Number(totalSteelLengthMeters.toFixed(2));
  totalSteelWeightKg = Number(totalSteelWeightKg.toFixed(2));
  // Total Steel Cost (₹) = Total Steel Weight (kg) × Steel Price per Kg
  const totalSteelCost = Number((totalSteelWeightKg * (steelPricePerKg || 0)).toFixed(2));

  return {
    totalSteelLengthMeters,
    totalSteelWeightKg,
    totalSteelCost,
  };
}

export function calculateQuotationTotals(
  items: Array<{
    item_type?: string;
    unit_price: number;
    quantity: number;
    tax_rate?: number;
    length_meters?: number;
    weight_kg?: number;
  }>,
  discountType: 'flat' | 'percent',
  discountValue: number,
  steelPricePerKg: number = 0,
  gstRate: number = 18
) {
  let subtotal = 0;

  // 1. Regular items subtotal (sum of unit_price * quantity)
  (items || []).forEach((item) => {
    if (item.item_type !== 'steel') {
      const lineSubtotal = Number(((item.unit_price || 0) * (item.quantity || 0)).toFixed(2));
      subtotal += lineSubtotal;
    }
  });

  // 2. Steel items (weight-based pricing included in Subtotal)
  const steelTotals = calculateSteelTotals(items, steelPricePerKg);
  if (steelTotals.totalSteelCost > 0) {
    subtotal += steelTotals.totalSteelCost;
  }

  subtotal = Number(subtotal.toFixed(2));

  // 3. Single GST % applied to the entire Subtotal
  const taxAmount = Number(((subtotal * (gstRate || 0)) / 100).toFixed(2));

  // 4. Discount calculation
  let discountAmount = 0;
  if (discountType === 'percent') {
    discountAmount = Number(((subtotal * (discountValue || 0)) / 100).toFixed(2));
  } else {
    discountAmount = Number((discountValue || 0).toFixed(2));
  }

  if (discountAmount > (subtotal + taxAmount)) {
    discountAmount = subtotal + taxAmount;
  }

  // Grand Total = Subtotal + (Subtotal × selected GST%) − Discount
  const grandTotal = Number(Math.max(0, subtotal + taxAmount - discountAmount).toFixed(2));

  return {
    subtotal,
    gstRate,
    taxAmount,
    discountAmount,
    grandTotal,
    ...steelTotals,
  };
}

/**
 * Calculates total weight in kg from structural steel items in quotation
 */
export function calculateQuotationTotalWeight(
  items: Array<{
    item_type?: string;
    product_name?: string;
    weight_kg?: number;
    unit_weight_kg?: number;
    quantity?: number;
  }>
): number {
  let totalWeight = 0;
  (items || []).forEach((item) => {
    const qty = typeof item.quantity === 'number' && item.quantity > 0 ? item.quantity : 1;

    if (typeof item.weight_kg === 'number' && item.weight_kg > 0) {
      totalWeight += item.weight_kg;
    } else if (typeof item.unit_weight_kg === 'number' && item.unit_weight_kg > 0) {
      totalWeight += item.unit_weight_kg * qty;
    } else if (item.product_name) {
      // Fallback: parse e.g. "SHS 25x25 x 1.6mm (L: 6000mm, 11.80 kg)"
      const match = item.product_name.match(/([0-9.]+)\s*kg\b/i);
      if (match && match[1]) {
        const parsed = parseFloat(match[1]);
        if (!isNaN(parsed) && parsed > 0) {
          totalWeight += parsed;
        }
      }
    }
  });

  return Number(totalWeight.toFixed(2));
}

