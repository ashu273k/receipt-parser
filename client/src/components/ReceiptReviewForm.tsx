import { useState, useEffect, type FormEvent } from 'react';
import type { ParsedReceipt } from '../types';
import { LineItemsTable } from './LineItemsTable';
import { computeMathCheck } from '../mathCheck';
import './ReceiptReviewForm.css';

interface ReceiptReviewFormProps {
  initialData: ParsedReceipt | null;
  parseFailed: boolean;
  onSaveSuccess: () => void;
}

const emptyData: ParsedReceipt = {
  merchant: '',
  date: '',
  currency: 'USD',
  line_items: [],
  subtotal: null,
  tax: null,
  tip: null,
  discount: null,
  total: 0,
  overall_confidence: 'high'
};

export function ReceiptReviewForm({ initialData, parseFailed, onSaveSuccess }: ReceiptReviewFormProps) {
  const [data, setData] = useState<ParsedReceipt>(initialData || emptyData);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setData(initialData || emptyData);
  }, [initialData]);

  const updateField = (field: keyof ParsedReceipt, value: any) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/receipts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        onSaveSuccess();
      } else {
        alert('Failed to save receipt');
      }
    } catch (err) {
      console.error(err);
      alert('Network error');
    } finally {
      setSaving(false);
    }
  };

  const computedTotal = computeMathCheck(data.line_items, data.tax, data.tip, data.discount);
  const mathMismatch = Math.abs(computedTotal - data.total) > 0.01;

  const isSaveDisabled = !data.merchant.trim() || !data.date.trim() || data.total === null || data.total === undefined || data.total.toString() === '';

  const getConfClass = (fieldConf?: 'high'|'medium'|'low') => {
    const conf = fieldConf || data.overall_confidence;
    if (conf === 'low') return 'input-conf-low';
    if (conf === 'medium') return 'input-conf-medium';
    return '';
  };

  return (
    <form className="review-form" onSubmit={handleSave}>
      {parseFailed && (
        <div className="banner banner-error">
          We couldn't read this receipt automatically — please fill in the fields below.
        </div>
      )}

      {mathMismatch && data.line_items.length > 0 && (
        <div className="banner banner-warning">
          Items + tax + tip − discount = {computedTotal.toFixed(2)}, but total says {data.total} — check for a missing line item or typo.
        </div>
      )}

      <div className="form-grid">
        <div className="form-group">
          <label>Merchant</label>
          <input 
            type="text" 
            className={`form-control ${getConfClass()}`}
            value={data.merchant} 
            onChange={e => updateField('merchant', e.target.value)} 
          />
        </div>

        <div className="form-group">
          <label>Date</label>
          <input 
            type="date" 
            className={`form-control ${getConfClass()}`}
            value={data.date} 
            onChange={e => updateField('date', e.target.value)} 
          />
        </div>
      </div>

      <LineItemsTable 
        items={data.line_items} 
        onChange={items => updateField('line_items', items)} 
        defaultConfidence={data.overall_confidence}
      />

      <div className="totals-section">
        <div className="totals-grid">
          <div className="form-group">
            <label>Subtotal</label>
            <input 
              type="number" 
              step="0.01" 
              className="form-control"
              value={data.subtotal === null ? '' : data.subtotal} 
              onChange={e => updateField('subtotal', e.target.value === '' ? null : parseFloat(e.target.value))} 
            />
          </div>
          
          <div className="form-group">
            <label>Tax</label>
            <input 
              type="number" 
              step="0.01" 
              className="form-control"
              value={data.tax === null ? '' : data.tax} 
              onChange={e => updateField('tax', e.target.value === '' ? null : parseFloat(e.target.value))} 
            />
          </div>

          <div className="form-group">
            <label>Tip</label>
            <input 
              type="number" 
              step="0.01" 
              className="form-control"
              value={data.tip === null ? '' : data.tip} 
              onChange={e => updateField('tip', e.target.value === '' ? null : parseFloat(e.target.value))} 
            />
          </div>

          <div className="form-group">
            <label>Discount</label>
            <input 
              type="number" 
              step="0.01" 
              className="form-control"
              value={data.discount === null ? '' : data.discount} 
              onChange={e => updateField('discount', e.target.value === '' ? null : parseFloat(e.target.value))} 
            />
          </div>

          <div className="form-group total-group">
            <label>Total</label>
            <input 
              type="number" 
              step="0.01" 
              className={`form-control total-input ${getConfClass()}`}
              value={data.total === null ? '' : data.total} 
              onChange={e => updateField('total', e.target.value === '' ? 0 : parseFloat(e.target.value))} 
            />
          </div>
        </div>
      </div>

      <div className="form-actions">
        <button 
          type="submit" 
          className="save-btn" 
          disabled={isSaveDisabled || saving}
        >
          {saving ? 'Saving...' : 'Save Receipt'}
        </button>
      </div>
    </form>
  );
}
