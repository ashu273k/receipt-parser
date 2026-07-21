import { type KeyboardEvent } from 'react';
import type { LineItem } from '../types';
import './LineItemsTable.css';

interface LineItemsTableProps {
  items: LineItem[];
  onChange: (newItems: LineItem[]) => void;
  defaultConfidence: 'high' | 'medium' | 'low';
}

export function LineItemsTable({ items, onChange, defaultConfidence }: LineItemsTableProps) {
  const updateItem = (index: number, field: keyof LineItem, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    onChange(newItems);
  };

  const deleteItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    onChange(newItems);
  };

  const addItem = () => {
    onChange([...items, { name: '', amount: 0, confidence: 'high' }]);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Enter' && index === items.length - 1) {
      e.preventDefault();
      addItem();
    }
  };

  return (
    <div className="line-items-wrapper">
      <table className="line-items-table">
        <thead>
          <tr>
            <th>Name</th>
            <th className="amount-col">Amount</th>
            <th className="action-col"></th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => {
            const conf = item.confidence || defaultConfidence;
            const rowClass = conf === 'low' ? 'conf-low' : conf === 'medium' ? 'conf-medium' : '';
            return (
              <tr key={index} className={`item-row ${rowClass}`}>
                <td>
                  <input
                    type="text"
                    className="item-input"
                    value={item.name}
                    onChange={(e) => updateItem(index, 'name', e.target.value)}
                  />
                </td>
                <td className="amount-col">
                  <input
                    type="number"
                    step="0.01"
                    className="item-input amount-input"
                    value={item.amount === 0 && items.length > 1 ? '' : item.amount}
                    onChange={(e) => updateItem(index, 'amount', parseFloat(e.target.value) || 0)}
                    onKeyDown={(e) => handleKeyDown(e, index)}
                  />
                </td>
                <td className="action-col">
                  <button
                    type="button"
                    className="delete-btn"
                    onClick={() => deleteItem(index)}
                    aria-label="Delete row"
                  >
                    ×
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <button type="button" className="add-btn" onClick={addItem}>
        + Add Row
      </button>
    </div>
  );
}
