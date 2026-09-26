import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';

interface POItem {
  id: string;
  materialId: string;
  quantity: number;
  rate: number;
}

export function PurchaseOrderForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);

  const [isLoading, setIsLoading] = useState(isEditing);
  const [isSaving, setIsSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    supplierId: '',
    expectedDelivery: '',
    notes: '',
  });

  const [items, setItems] = useState<POItem[]>([
    { id: 'item-1', materialId: '', quantity: 1, rate: 0 }
  ]);

  useEffect(() => {
    if (isEditing) {
      // Mock fetch existing PO
      const timer = setTimeout(() => {
        setFormData({
          supplierId: 'sup-1',
          expectedDelivery: '2024-11-01',
          notes: 'Deliver to unit 2',
        });
        setItems([
          { id: 'item-1', materialId: 'mat-1', quantity: 500, rate: 90 },
          { id: 'item-2', materialId: 'mat-2', quantity: 10, rate: 1200 },
        ]);
        setIsLoading(false);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [isEditing]);

  const handleHeaderChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleItemChange = (itemId: string, field: keyof POItem, value: string | number) => {
    setItems(prev => prev.map(item => 
      item.id === itemId ? { ...item, [field]: value } : item
    ));
  };

  const addItem = () => {
    setItems(prev => [...prev, { 
      id: `item-${Date.now()}`, 
      materialId: '', 
      quantity: 1, 
      rate: 0 
    }]);
  };

  const removeItem = (itemId: string) => {
    if (items.length > 1) {
      setItems(prev => prev.filter(item => item.id !== itemId));
    }
  };

  const calculateTotal = () => {
    return items.reduce((total, item) => total + (item.quantity * item.rate), 0);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    // Mock save
    await new Promise(resolve => setTimeout(resolve, 800));
    
    setIsSaving(false);
    navigate('/procurement/purchases');
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-12">
        <div className="spinner !border-primary" style={{ borderTopColor: 'transparent' }} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-5xl">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/procurement/purchases')} className="icon-btn">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold">{isEditing ? 'Edit Purchase Order' : 'Create Purchase Order'}</h1>
          <p className="text-muted">Procure raw materials from suppliers.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {/* Header Details */}
        <Card className="flex flex-col gap-4">
          <h3 className="font-semibold text-lg border-b border-[var(--color-border)] pb-2 mb-2">Order Details</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="input-group">
              <label className="input-label">Supplier</label>
              <select 
                name="supplierId" 
                value={formData.supplierId} 
                onChange={handleHeaderChange}
                className="input-field"
                required
              >
                <option value="">Select Supplier...</option>
                <option value="sup-1">Alpha Fabrics</option>
                <option value="sup-2">Zeta Dyeing</option>
                <option value="sup-3">Premium Trims Ltd</option>
              </select>
            </div>
            
            <Input 
              label="Expected Delivery Date" 
              name="expectedDelivery" 
              type="date"
              value={formData.expectedDelivery} 
              onChange={handleHeaderChange} 
              required 
            />
          </div>
          
          <div className="input-group">
            <label className="input-label">Notes / Instructions</label>
            <textarea 
              name="notes" 
              value={formData.notes} 
              onChange={handleHeaderChange}
              className="input-field min-h-[80px] resize-y"
              placeholder="Any special instructions for the supplier..."
            />
          </div>
        </Card>

        {/* Line Items */}
        <Card className="flex flex-col gap-4">
          <div className="flex justify-between items-center border-b border-[var(--color-border)] pb-2 mb-2">
            <h3 className="font-semibold text-lg">Materials</h3>
            <Button type="button" variant="outline" onClick={addItem}>
              <Plus size={16} /> Add Item
            </Button>
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--color-border)]">
                  <th className="p-2 text-sm font-semibold text-muted w-[40%]">Material</th>
                  <th className="p-2 text-sm font-semibold text-muted w-[20%]">Quantity</th>
                  <th className="p-2 text-sm font-semibold text-muted w-[20%]">Rate (₹)</th>
                  <th className="p-2 text-sm font-semibold text-muted w-[15%]">Total (₹)</th>
                  <th className="p-2 text-sm font-semibold text-muted w-[5%]"></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-b border-[var(--color-border)] last:border-0">
                    <td className="p-2">
                      <select 
                        className="input-field w-full"
                        value={item.materialId}
                        onChange={(e) => handleItemChange(item.id, 'materialId', e.target.value)}
                        required
                      >
                        <option value="">Select Material...</option>
                        <option value="mat-1">Cotton Fabric - Blue (m)</option>
                        <option value="mat-2">Silk Thread - Gold (kg)</option>
                        <option value="mat-3">Poly Blend - Red (m)</option>
                      </select>
                    </td>
                    <td className="p-2">
                      <input 
                        type="number" 
                        min="1"
                        step="0.01"
                        className="input-field w-full"
                        value={item.quantity || ''}
                        onChange={(e) => handleItemChange(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                        required
                      />
                    </td>
                    <td className="p-2">
                      <input 
                        type="number" 
                        min="0"
                        step="0.01"
                        className="input-field w-full"
                        value={item.rate || ''}
                        onChange={(e) => handleItemChange(item.id, 'rate', parseFloat(e.target.value) || 0)}
                        required
                      />
                    </td>
                    <td className="p-2 font-medium">
                      {((item.quantity || 0) * (item.rate || 0)).toLocaleString('en-IN')}
                    </td>
                    <td className="p-2">
                      <button 
                        type="button" 
                        onClick={() => removeItem(item.id)}
                        disabled={items.length === 1}
                        className="icon-btn text-red-500 hover:bg-red-50 disabled:opacity-30 disabled:hover:bg-transparent"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden flex flex-col gap-4">
            {items.map((item, index) => (
              <div key={item.id} className="flex flex-col gap-3 p-4 border border-[var(--color-border)] rounded-md bg-[var(--color-background)]">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-sm">Item {index + 1}</span>
                  <button 
                    type="button" 
                    onClick={() => removeItem(item.id)}
                    disabled={items.length === 1}
                    className="text-red-500 disabled:opacity-30"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                
                <div className="input-group">
                  <label className="input-label text-xs">Material</label>
                  <select 
                    className="input-field"
                    value={item.materialId}
                    onChange={(e) => handleItemChange(item.id, 'materialId', e.target.value)}
                    required
                  >
                    <option value="">Select Material...</option>
                    <option value="mat-1">Cotton Fabric - Blue</option>
                    <option value="mat-2">Silk Thread - Gold</option>
                  </select>
                </div>
                
                <div className="flex gap-3">
                  <div className="input-group flex-1">
                    <label className="input-label text-xs">Qty</label>
                    <input 
                      type="number" 
                      className="input-field"
                      value={item.quantity || ''}
                      onChange={(e) => handleItemChange(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                      required
                    />
                  </div>
                  <div className="input-group flex-1">
                    <label className="input-label text-xs">Rate</label>
                    <input 
                      type="number" 
                      className="input-field"
                      value={item.rate || ''}
                      onChange={(e) => handleItemChange(item.id, 'rate', parseFloat(e.target.value) || 0)}
                      required
                    />
                  </div>
                </div>
                
                <div className="text-right text-sm font-semibold pt-2 border-t border-[var(--color-border)]">
                  Line Total: ₹ {((item.quantity || 0) * (item.rate || 0)).toLocaleString('en-IN')}
                </div>
              </div>
            ))}
          </div>

          {/* Order Total */}
          <div className="flex justify-end pt-4 mt-2">
            <div className="bg-[var(--color-background)] p-4 rounded-lg border border-[var(--color-border)] w-full md:w-64 text-right">
              <span className="text-muted text-sm block">Total Order Amount</span>
              <span className="text-2xl font-bold text-primary">₹ {calculateTotal().toLocaleString('en-IN')}</span>
            </div>
          </div>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-3 sticky bottom-0 bg-[var(--color-background)] p-4 border-t border-[var(--color-border)] -mx-6 px-6">
          <Button type="button" variant="secondary" onClick={() => navigate('/procurement/purchases')}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSaving}>
            Submit Purchase Order
          </Button>
        </div>
      </form>
    </div>
  );
}
