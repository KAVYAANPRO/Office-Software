import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { ArrowLeft, Plus, Trash2, Camera } from 'lucide-react';

interface BOMItem {
  id: string;
  materialId: string;
  quantity: number;
}

export function DesignForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);

  const [isLoading, setIsLoading] = useState(isEditing);
  const [isSaving, setIsSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    category: 'Dress',
    description: '',
    status: 'Active'
  });

  const [bomItems, setBomItems] = useState<BOMItem[]>([
    { id: 'item-1', materialId: '', quantity: 1 }
  ]);

  useEffect(() => {
    if (isEditing) {
      // Mock fetch existing Design
      const timer = setTimeout(() => {
        setFormData({
          sku: 'DR-1024',
          name: 'Summer Floral Dress',
          category: 'Dress',
          description: 'A light summer dress with floral prints.',
          status: 'Active'
        });
        setBomItems([
          { id: 'item-1', materialId: 'mat-1', quantity: 2.5 },
          { id: 'item-2', materialId: 'mat-2', quantity: 0.05 },
        ]);
        setIsLoading(false);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [isEditing]);

  const handleHeaderChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleBOMChange = (itemId: string, field: keyof BOMItem, value: string | number) => {
    setBomItems(prev => prev.map(item => 
      item.id === itemId ? { ...item, [field]: value } : item
    ));
  };

  const addBOMItem = () => {
    setBomItems(prev => [...prev, { 
      id: `item-${Date.now()}`, 
      materialId: '', 
      quantity: 1
    }]);
  };

  const removeBOMItem = (itemId: string) => {
    if (bomItems.length > 1) {
      setBomItems(prev => prev.filter(item => item.id !== itemId));
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    // Mock save
    await new Promise(resolve => setTimeout(resolve, 800));
    
    setIsSaving(false);
    navigate('/production/designs');
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
        <button onClick={() => navigate('/production/designs')} className="icon-btn">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold">{isEditing ? 'Edit Design' : 'New Design'}</h1>
          <p className="text-muted">Define SKU details and Bill of Materials (BOM).</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        
        {/* Header Details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <Card className="flex flex-col gap-4 h-full">
              <h3 className="font-semibold text-lg border-b border-[var(--color-border)] pb-2 mb-2">Design Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input 
                  label="SKU Code" 
                  name="sku" 
                  value={formData.sku} 
                  onChange={handleHeaderChange} 
                  placeholder="e.g. DR-1024"
                  required 
                />
                <Input 
                  label="Design Name" 
                  name="name" 
                  value={formData.name} 
                  onChange={handleHeaderChange} 
                  placeholder="e.g. Summer Floral Dress"
                  required 
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="input-group">
                  <label className="input-label">Category</label>
                  <select 
                    name="category" 
                    value={formData.category} 
                    onChange={handleHeaderChange}
                    className="input-field"
                    required
                  >
                    <option value="Dress">Dress</option>
                    <option value="Kurti">Kurti</option>
                    <option value="Bottoms">Bottoms</option>
                    <option value="Tops">Tops</option>
                    <option value="Sets">Sets</option>
                  </select>
                </div>
                
                <div className="input-group">
                  <label className="input-label">Status</label>
                  <select 
                    name="status" 
                    value={formData.status} 
                    onChange={handleHeaderChange}
                    className="input-field"
                  >
                    <option value="Active">Active</option>
                    <option value="Archived">Archived</option>
                  </select>
                </div>
              </div>
              
              <div className="input-group flex-grow">
                <label className="input-label">Description</label>
                <textarea 
                  name="description" 
                  value={formData.description} 
                  onChange={handleHeaderChange}
                  className="input-field min-h-[80px] resize-y"
                  placeholder="Optional details about this design..."
                />
              </div>
            </Card>
          </div>
          
          <div className="md:col-span-1">
            <Card className="flex flex-col gap-4 h-full items-center justify-center min-h-[250px] bg-slate-50 border-dashed border-2">
              <div className="w-16 h-16 rounded-full bg-slate-200 flex items-center justify-center text-slate-400 mb-2">
                <Camera size={32} />
              </div>
              <p className="text-sm font-medium text-slate-600 text-center">Upload Design Image</p>
              <p className="text-xs text-slate-400 text-center max-w-[200px]">PNG, JPG or WEBP up to 5MB.</p>
              <Button type="button" variant="outline" className="mt-2 text-xs py-1 px-3">
                Browse Files
              </Button>
            </Card>
          </div>
        </div>

        {/* Bill of Materials */}
        <Card className="flex flex-col gap-4">
          <div className="flex justify-between items-center border-b border-[var(--color-border)] pb-2 mb-2">
            <div>
              <h3 className="font-semibold text-lg">Bill of Materials (BOM)</h3>
              <p className="text-xs text-muted">Raw materials required to produce exactly ONE unit of this design.</p>
            </div>
            <Button type="button" variant="outline" onClick={addBOMItem}>
              <Plus size={16} /> Add Material
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--color-border)] bg-[var(--color-background)]">
                  <th className="p-2 text-sm font-semibold text-muted w-[60%]">Raw Material</th>
                  <th className="p-2 text-sm font-semibold text-muted w-[30%]">Quantity per Unit</th>
                  <th className="p-2 text-sm font-semibold text-muted w-[10%]"></th>
                </tr>
              </thead>
              <tbody>
                {bomItems.map((item) => (
                  <tr key={item.id} className="border-b border-[var(--color-border)] last:border-0">
                    <td className="p-2">
                      <select 
                        className="input-field w-full"
                        value={item.materialId}
                        onChange={(e) => handleBOMChange(item.id, 'materialId', e.target.value)}
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
                        min="0"
                        step="0.01"
                        className="input-field w-full"
                        value={item.quantity === 0 ? '' : item.quantity}
                        onChange={(e) => handleBOMChange(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                        required
                      />
                    </td>
                    <td className="p-2 text-center">
                      <button 
                        type="button" 
                        onClick={() => removeBOMItem(item.id)}
                        disabled={bomItems.length === 1}
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
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-3 sticky bottom-0 bg-[var(--color-background)] p-4 border-t border-[var(--color-border)] -mx-6 px-6">
          <Button type="button" variant="secondary" onClick={() => navigate('/production/designs')}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSaving}>
            Save Design & BOM
          </Button>
        </div>
      </form>
    </div>
  );
}
