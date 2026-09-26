import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { ArrowLeft } from 'lucide-react';

export function MaterialForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);

  const [isLoading, setIsLoading] = useState(isEditing);
  const [isSaving, setIsSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    type: 'Raw',
    uom: 'meters',
    category: '',
    minStock: '',
    status: 'Active'
  });

  useEffect(() => {
    if (isEditing) {
      // Mock fetch
      const timer = setTimeout(() => {
        setFormData({
          name: 'Cotton Fabric - Blue',
          type: 'Raw',
          uom: 'meters',
          category: 'Fabric',
          minStock: '500',
          status: 'Active'
        });
        setIsLoading(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isEditing]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    // Mock save
    await new Promise(resolve => setTimeout(resolve, 800));
    
    setIsSaving(false);
    navigate('/inventory/materials');
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-12">
        <div className="spinner !border-primary" style={{ borderTopColor: 'transparent' }} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/inventory/materials')} className="icon-btn">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold">{isEditing ? 'Edit Material' : 'New Material'}</h1>
          <p className="text-muted">Enter the master details for this material.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input 
              label="Material Name" 
              name="name" 
              value={formData.name} 
              onChange={handleChange} 
              placeholder="e.g. Cotton Fabric - Blue"
              required 
            />
            
            <div className="input-group">
              <label className="input-label">Type</label>
              <select 
                name="type" 
                value={formData.type} 
                onChange={handleChange}
                className="input-field"
              >
                <option value="Raw">Raw Material</option>
                <option value="Ready">Ready/Finished Good</option>
              </select>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input 
              label="Category" 
              name="category" 
              value={formData.category} 
              onChange={handleChange} 
              placeholder="e.g. Fabric, Thread, Trims"
              required 
            />
            
            <div className="input-group">
              <label className="input-label">Unit of Measure (UOM)</label>
              <select 
                name="uom" 
                value={formData.uom} 
                onChange={handleChange}
                className="input-field"
              >
                <option value="meters">Meters</option>
                <option value="kg">Kilograms</option>
                <option value="pcs">Pieces</option>
                <option value="liters">Liters</option>
              </select>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input 
              label="Minimum Stock Level" 
              name="minStock" 
              type="number"
              value={formData.minStock} 
              onChange={handleChange} 
              required 
            />
            
            <div className="input-group">
              <label className="input-label">Status</label>
              <select 
                name="status" 
                value={formData.status} 
                onChange={handleChange}
                className="input-field"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-[var(--color-border)]">
            <Button type="button" variant="secondary" onClick={() => navigate('/inventory/materials')}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSaving}>
              Save Material
            </Button>
          </div>
        </Card>
      </form>
    </div>
  );
}
