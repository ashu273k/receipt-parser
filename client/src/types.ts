export interface LineItem {
  name: string;
  amount: number;
  confidence: 'high' | 'medium' | 'low';
}

export interface ParsedReceipt {
  merchant: string;
  date: string;
  currency: string;
  line_items: LineItem[];
  subtotal: number | null;
  tax: number | null;
  tip: number | null;
  discount: number | null;
  total: number;
  overall_confidence: 'high' | 'medium' | 'low';
}

export interface SavedReceipt extends ParsedReceipt {
  id: string;
  reviewed: boolean;
}
