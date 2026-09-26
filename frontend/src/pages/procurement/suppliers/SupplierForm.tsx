import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { ArrowLeft } from 'lucide-react';

export function SupplierForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);

  const [isLoading, setIsLoading] = useState(isEditing);
  const [isSaving, setIsSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    contact: '',
    gstin: '',
    address: '',
    paymentTerms: '',
    status: 'Active'
  });

  useEffect(() => {
    if (isEditing) {
      // Mock fetch
      const timer = setTimeout(() => {
        setFormData({
          name: 'Alpha Fabrics',
          contact: 'Ramesh Kumar (9876543210)',
          gstin: '27AADCB2230M1Z2',
          address: '123 Textile Market, Surat, Gujarat',
          paymentTerms: 'Net 30',
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
    navigate('/procurement/suppliers');
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
        <button onClick={() => navigate('/procurement/suppliers')} className="icon-btn">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold">{isEditing ? 'Edit Supplier' : 'New Supplier'}</h1>
          <p className="text-muted">Enter the master details for this vendor.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input 
              label="Supplier Name" 
              name="name" 
              value={formData.name} 
              onChange={handleChange} 
              required 
            />
            <Input 
              label="GSTIN" 
              name="gstin" 
              value={formData.gstin} 
              onChange={handleChange} 
              placeholder="e.g. 22AAAAA0000A1Z5"
              required 
            />
          </div>
          
          <Input 
            label="Contact Person & Phone" 
            name="contact" 
            value={formData.contact} 
            onChange={handleChange} 
            required 
          />
          
          <Input 
            label="Address" 
            name="address" 
            value={formData.address} 
            onChange={handleChange} 
          />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input 
              label="Payment Terms" 
              name="paymentTerms" 
              value={formData.paymentTerms} 
              onChange={handleChange} 
              placeholder="e.g. Net 30, Advance"
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
            <Button type="button" variant="secondary" onClick={() => navigate('/procurement/suppliers')}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSaving}>
              Save Supplier
            </Button>
          </div>
        </Card>
      </form>
    </div>
  );
}
