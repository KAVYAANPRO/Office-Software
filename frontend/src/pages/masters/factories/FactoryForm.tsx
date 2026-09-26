import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { ArrowLeft } from 'lucide-react';

export function FactoryForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);

  const [isLoading, setIsLoading] = useState(isEditing);
  const [isSaving, setIsSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    contact: '',
    specialty: 'Dyeing',
    address: '',
    status: 'Active'
  });

  useEffect(() => {
    if (isEditing) {
      // Mock fetch
      const timer = setTimeout(() => {
        setFormData({
          name: 'Krishna Dyeing Works',
          contact: 'Kishore (9876500001)',
          specialty: 'Dyeing',
          address: 'Plot 45, GIDC',
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
    navigate('/masters/factories');
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
        <button onClick={() => navigate('/masters/factories')} className="icon-btn">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold">{isEditing ? 'Edit Factory/Artisan' : 'New Factory/Artisan'}</h1>
          <p className="text-muted">Enter the master details for this production partner.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input 
              label="Factory/Artisan Name" 
              name="name" 
              value={formData.name} 
              onChange={handleChange} 
              placeholder="e.g. Krishna Dyeing Works"
              required 
            />
            
            <Input 
              label="Contact Person & Phone" 
              name="contact" 
              value={formData.contact} 
              onChange={handleChange} 
              placeholder="e.g. Kishore (9876500001)"
              required 
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="input-group">
              <label className="input-label">Specialty</label>
              <select 
                name="specialty" 
                value={formData.specialty} 
                onChange={handleChange}
                className="input-field"
              >
                <option value="Cutting">Cutting</option>
                <option value="Dyeing">Dyeing</option>
                <option value="Stitching">Stitching</option>
                <option value="Embroidery">Embroidery</option>
                <option value="Finishing">Finishing / Packing</option>
              </select>
            </div>
            
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
          
          <Input 
            label="Address" 
            name="address" 
            value={formData.address} 
            onChange={handleChange} 
            placeholder="Complete physical address"
          />

          <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-[var(--color-border)]">
            <Button type="button" variant="secondary" onClick={() => navigate('/masters/factories')}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSaving}>
              Save Factory
            </Button>
          </div>
        </Card>
      </form>
    </div>
  );
}
