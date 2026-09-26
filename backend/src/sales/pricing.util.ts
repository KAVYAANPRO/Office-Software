import Decimal from 'decimal.js';
import { roundMoney, toDecimal } from '../common/utils/decimal';

/** tech.md §8.1: one pure function, no database access, so it is exhaustively unit-testable. */
export interface InvoiceLineInput {
  designVariantId: string;
  qty: number;
  unitRate: number;
  discountPct: number;
  extraDiscountAmt: number;
  hsn: string;
}

export interface TaxRuleInput {
  hsn: string;
  valueBandMin: number;
  valueBandMax?: number;
  ratePct: number;
  validFrom: Date;
  validTo?: Date;
}

export interface ComputeInvoiceInput {
  lines: InvoiceLineInput[];
  customer: { state?: string; gstin?: string };
  company: { state: string };
  invoiceDate: Date;
  taxRules: TaxRuleInput[];
}

export interface InvoiceLineOutput extends InvoiceLineInput {
  grossAmount: number;
  discountAmount: number;
  taxableValue: number;
  taxRatePct: number;
  cgst: number;
  sgst: number;
  igst: number;
  lineTotal: number;
}

export interface ComputeInvoiceOutput {
  lines: InvoiceLineOutput[];
  subtotal: number;
  discountTotal: number;
  taxableTotal: number;
  cgstTotal: number;
  sgstTotal: number;
  igstTotal: number;
  roundOff: number;
  grandTotal: number;
  placeOfSupply?: string;
  isIntraState: boolean;
}

export class TaxRuleNotFoundError extends Error {
  constructor(hsn: string, unitTaxable: number, invoiceDate: Date) {
    super(
      `No tax rule matches HSN ${hsn} for a per-piece taxable value of ${unitTaxable} on ${invoiceDate.toISOString().slice(0, 10)}.`,
    );
  }
}

function findTaxRule(
  rules: TaxRuleInput[],
  hsn: string,
  unitTaxable: number,
  invoiceDate: Date,
): TaxRuleInput {
  const match = rules.find(
    (r) =>
      r.hsn === hsn &&
      unitTaxable >= r.valueBandMin &&
      (r.valueBandMax === undefined || unitTaxable < r.valueBandMax) &&
      invoiceDate >= r.validFrom &&
      (r.validTo === undefined || invoiceDate < r.validTo),
  );
  if (!match) throw new TaxRuleNotFoundError(hsn, unitTaxable, invoiceDate);
  return match;
}

/**
 * tech.md §8.1's `computeInvoice`. Checked against prd.md §10 step 13: 20 x Rs 1,400 = Rs
 * 28,000, less 5% customer discount = Rs 26,600 taxable, unit taxable Rs 1,330 falls in the 5%
 * band, CGST Rs 665 + SGST Rs 665, total Rs 27,930.
 */
export function computeInvoice(input: ComputeInvoiceInput): ComputeInvoiceOutput {
  const isIntraState = !!input.customer.state && input.customer.state === input.company.state;

  let subtotal = new Decimal(0);
  let discountTotal = new Decimal(0);
  let taxableTotal = new Decimal(0);
  let cgstTotal = new Decimal(0);
  let sgstTotal = new Decimal(0);
  let igstTotal = new Decimal(0);

  const lines: InvoiceLineOutput[] = input.lines.map((line) => {
    const grossAmount = toDecimal(line.qty).times(line.unitRate);
    const discountAmount = grossAmount
      .times(toDecimal(line.discountPct).dividedBy(100))
      .plus(line.extraDiscountAmt);
    const taxableValue = grossAmount.minus(discountAmount);
    const unitTaxable = toDecimal(line.qty).gt(0)
      ? taxableValue.dividedBy(line.qty)
      : new Decimal(0);

    const rule = findTaxRule(input.taxRules, line.hsn, unitTaxable.toNumber(), input.invoiceDate);

    let cgst = new Decimal(0);
    let sgst = new Decimal(0);
    let igst = new Decimal(0);
    if (isIntraState) {
      cgst = toDecimal(roundMoney(taxableValue.times(rule.ratePct).dividedBy(200)));
      sgst = cgst;
    } else {
      igst = toDecimal(roundMoney(taxableValue.times(rule.ratePct).dividedBy(100)));
    }

    const lineTotalDecimal = taxableValue.plus(cgst).plus(sgst).plus(igst);

    subtotal = subtotal.plus(grossAmount);
    discountTotal = discountTotal.plus(discountAmount);
    taxableTotal = taxableTotal.plus(taxableValue);
    cgstTotal = cgstTotal.plus(cgst);
    sgstTotal = sgstTotal.plus(sgst);
    igstTotal = igstTotal.plus(igst);

    return {
      ...line,
      grossAmount: roundMoney(grossAmount),
      discountAmount: roundMoney(discountAmount),
      taxableValue: roundMoney(taxableValue),
      taxRatePct: rule.ratePct,
      cgst: roundMoney(cgst),
      sgst: roundMoney(sgst),
      igst: roundMoney(igst),
      lineTotal: roundMoney(lineTotalDecimal),
    };
  });

  const preRoundGrandTotal = taxableTotal.plus(cgstTotal).plus(sgstTotal).plus(igstTotal);
  const grandTotal = roundMoney(preRoundGrandTotal);
  const roundOff = roundMoney(toDecimal(grandTotal).minus(preRoundGrandTotal));

  return {
    lines,
    subtotal: roundMoney(subtotal),
    discountTotal: roundMoney(discountTotal),
    taxableTotal: roundMoney(taxableTotal),
    cgstTotal: roundMoney(cgstTotal),
    sgstTotal: roundMoney(sgstTotal),
    igstTotal: roundMoney(igstTotal),
    roundOff,
    grandTotal,
    placeOfSupply: input.customer.state,
    isIntraState,
  };
}
