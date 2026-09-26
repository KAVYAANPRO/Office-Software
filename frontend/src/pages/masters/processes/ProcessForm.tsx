import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { ArrowLeft } from 'lucide-react';

export function ProcessForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);

  const [isLoading, setIsLoading] = useState(isEditing);
  const [isSaving, setIsSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    defaultCost: '',
    status: 'Active'
  });

  useEffect(() => {
    if (isEditing) {
      // Mock fetch
      const timer = setTimeout(() => {
        setFormData({
          name: 'Stitching',
          description: 'Garment assembly',
          defaultCost: '120',
          status: 'Active'
        });
        setIsLoading(false);
      }, 400);
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
    await new Promise(resolve => setTimeout(resolve, 600));
    
    setIsSaving(false);
    navigate('/masters/processes');
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
        <button onClick={() => navigate('/masters/processes')} className="icon-btn">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold">{isEditing ? 'Edit Process' : 'New Process'}</h1>
          <p className="text-muted">Define processing steps for job slips.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="flex flex-col gap-4">
          <Input 
            label="Process Name" 
            name="name" 
            value={formData.name} 
            onChange={handleChange} 
            placeholder="e.g. Stitching, Cutting"
            required 
          />
          
          <Input 
            label="Description" 
            name="description" 
            value={formData.description} 
            onChange={handleChange} 
            placeholder="Optional details about this process"
          />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input 
              label="Default Cost / Rate (₹)" 
              name="defaultCost" 
              type="number"
              value={formData.defaultCost} 
              onChange={handleChange} 
              placeholder="e.g. 15"
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
            <Button type="button" variant="secondary" onClick={() => navigate('/masters/processes')}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSaving}>
              Save Process
            </Button>
          </div>
        </Card>
      </form>
    </div>
  );
}
