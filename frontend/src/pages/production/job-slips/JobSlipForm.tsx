import { useState, useEffect, useMemo } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { ArrowLeft, Calculator } from 'lucide-react';
import { JOB_SLIP_STATUSES } from '../../../types/domain';

interface BOMItem {
  materialName: string;
  quantityPerUnit: number;
  uom: string;
}

const mockBOMs: Record<string, BOMItem[]> = {
  'des-1': [ // Summer Floral Dress
    { materialName: 'Cotton Fabric - Blue', quantityPerUnit: 2.5, uom: 'm' },
    { materialName: 'Silk Thread - Gold', quantityPerUnit: 0.05, uom: 'kg' },
  ],
  'des-2': [ // Kurti
    { materialName: 'Poly Blend - Red', quantityPerUnit: 2.0, uom: 'm' },
    { materialName: 'Buttons - Wood', quantityPerUnit: 5, uom: 'pcs' },
  ]
};

export function JobSlipForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);

  const [isLoading, setIsLoading] = useState(isEditing);
  const [isSaving, setIsSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    designId: '',
    factoryId: '',
    batchQty: '',
    targetDate: '',
    status: 'Created' as string,
  });

  useEffect(() => {
    if (isEditing) {
      // Mock fetch existing Job Slip
      const timer = setTimeout(() => {
        setFormData({
          designId: 'des-1',
          factoryId: 'fac-1',
          batchQty: '500',
          targetDate: '2024-10-25',
          status: 'In Process',
        });
        setIsLoading(false);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [isEditing]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const calculatedMaterials = useMemo(() => {
    if (!formData.designId || !formData.batchQty) return [];
    
    const qty = parseInt(formData.batchQty, 10);
    if (isNaN(qty) || qty <= 0) return [];

    const bom = mockBOMs[formData.designId] || [];
    return bom.map(item => ({
      ...item,
      totalRequired: item.quantityPerUnit * qty
    }));
  }, [formData.designId, formData.batchQty]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    // Mock save
    await new Promise(resolve => setTimeout(resolve, 800));
    
    setIsSaving(false);
    navigate('/production/job-slips');
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
        <button onClick={() => navigate('/production/job-slips')} className="icon-btn">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold">{isEditing ? 'Edit Job Slip' : 'Create Job Slip'}</h1>
          <p className="text-muted">Issue production batch orders to factories/artisans.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        
        {/* Header Details */}
        <Card className="flex flex-col gap-4">
          <h3 className="font-semibold text-lg border-b border-[var(--color-border)] pb-2 mb-2">Order Details</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="input-group">
              <label className="input-label">Design / SKU</label>
              <select 
                name="designId" 
                value={formData.designId} 
                onChange={handleChange}
                className="input-field"
                required
              >
                <option value="">Select Design...</option>
                <option value="des-1">DR-1024 - Summer Floral Dress</option>
                <option value="des-2">KU-5501 - Cotton Block Print Kurti</option>
              </select>
            </div>
            
            <div className="input-group">
              <label className="input-label">Assigned Factory / Artisan</label>
              <select 
                name="factoryId" 
                value={formData.factoryId} 
                onChange={handleChange}
                className="input-field"
                required
              >
                <option value="">Select Factory...</option>
                <option value="fac-1">Super Stitchers</option>
                <option value="fac-2">Krishna Dyeing Works</option>
                <option value="fac-3">Precision Cutters</option>
              </select>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input 
              label="Batch Quantity" 
              name="batchQty" 
              type="number"
              min="1"
              value={formData.batchQty} 
              onChange={handleChange} 
              placeholder="e.g. 500"
              required 
            />
            
            <Input 
              label="Target Completion Date" 
              name="targetDate" 
              type="date"
              value={formData.targetDate} 
              onChange={handleChange} 
              required 
            />
            
            <div className="input-group">
              <label className="input-label">Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                disabled={!isEditing}
                className="input-field"
              >
                {JOB_SLIP_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                <option value="Cancelled">Cancelled</option>
              </select>
              {!isEditing && <p className="text-xs text-muted mt-1">New job slips always start as "Created"; status then advances automatically (JOB-03).</p>}
            </div>
          </div>
        </Card>

        {/* Auto-Calculated Material Requirements */}
        <Card className="flex flex-col gap-4">
          <div className="flex justify-between items-center border-b border-[var(--color-border)] pb-2 mb-2">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <Calculator size={20} className="text-primary" />
              Material Requirement Calculation
            </h3>
          </div>
          
          {!formData.designId || !formData.batchQty ? (
            <div className="py-8 text-center text-muted bg-slate-50 rounded-md border border-dashed">
              Select a Design and enter a Batch Quantity to see raw material requirements.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[var(--color-border)] bg-[var(--color-background)]">
                    <th className="p-3 text-sm font-semibold text-muted">Raw Material</th>
                    <th className="p-3 text-sm font-semibold text-muted text-center">BOM Qty (Per Unit)</th>
                    <th className="p-3 text-sm font-semibold text-muted text-center bg-blue-50 text-blue-900 border-l border-blue-100">
                      Total Required (For Batch)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {calculatedMaterials.map((item, index) => (
                    <tr key={index} className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-background)]">
                      <td className="p-3 font-medium">{item.materialName}</td>
                      <td className="p-3 text-center text-muted">
                        {item.quantityPerUnit} {item.uom}
                      </td>
                      <td className="p-3 text-center font-bold text-blue-700 bg-blue-50/50 border-l border-blue-100">
                        {item.totalRequired.toFixed(2)} {item.uom}
                      </td>
                    </tr>
                  ))}
                  {calculatedMaterials.length === 0 && (
                    <tr>
                      <td colSpan={3} className="p-4 text-center text-muted">
                        No BOM found for this design.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              
              {calculatedMaterials.length > 0 && (
                <div className="mt-4 text-xs text-muted text-right">
                  * Automatically calculated as: (BOM Quantity per unit) × (Batch Quantity {formData.batchQty})
                </div>
              )}
            </div>
          )}
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-3 sticky bottom-0 bg-[var(--color-background)] p-4 border-t border-[var(--color-border)] -mx-6 px-6">
          <Button type="button" variant="secondary" onClick={() => navigate('/production/job-slips')}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSaving}>
            Save Job Slip
          </Button>
        </div>
      </form>
    </div>
  );
}
