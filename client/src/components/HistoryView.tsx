import React, { useEffect, useState } from 'react';
import { SavedReceipt } from '../types';
import './HistoryView.css';

export function HistoryView() {
  const [receipts, setReceipts] = useState<SavedReceipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchReceipts() {
      try {
        const res = await fetch('/api/receipts');
        const data = await res.json();
        setReceipts(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchReceipts();
  }, []);

  if (loading) {
    return <div className="history-loading">Loading past receipts...</div>;
  }

  if (receipts.length === 0) {
    return <div className="history-empty">No receipts saved yet.</div>;
  }

  return (
    <div className="history-container">
      <h2>Past Receipts</h2>
      <div className="receipts-list">
        {receipts.map(receipt => (
          <div key={receipt.id} className="receipt-card">
            <div 
              className="receipt-header"
              onClick={() => setExpandedId(expandedId === receipt.id ? null : receipt.id)}
            >
              <div className="receipt-summary">
                <span className="merchant">{receipt.merchant || 'Unknown Merchant'}</span>
                <span className="date">{receipt.date}</span>
              </div>
              <div className="receipt-total">
                {receipt.currency} {receipt.total?.toFixed(2)}
              </div>
            </div>
            
            {expandedId === receipt.id && (
              <div className="receipt-details">
                <table className="history-table">
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th className="right-align">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {receipt.line_items?.map((item, idx) => (
                      <tr key={idx}>
                        <td>{item.name}</td>
                        <td className="right-align">{item.amount?.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="history-totals">
                  {receipt.subtotal != null && (
                    <div className="history-totals-row">
                      <span>Subtotal:</span>
                      <span>{receipt.subtotal.toFixed(2)}</span>
                    </div>
                  )}
                  {receipt.tax != null && (
                    <div className="history-totals-row">
                      <span>Tax:</span>
                      <span>{receipt.tax.toFixed(2)}</span>
                    </div>
                  )}
                  {receipt.tip != null && (
                    <div className="history-totals-row">
                      <span>Tip:</span>
                      <span>{receipt.tip.toFixed(2)}</span>
                    </div>
                  )}
                  {receipt.discount != null && (
                    <div className="history-totals-row">
                      <span>Discount:</span>
                      <span>{receipt.discount.toFixed(2)}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
