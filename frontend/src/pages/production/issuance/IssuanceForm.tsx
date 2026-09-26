import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { ArrowLeft, Box } from 'lucide-react';

interface IssuanceItem {
  id: string;
  materialName: string;
  requiredQty: number;
  previouslyIssued: number;
  issuingQty: number;
  uom: string;
}

export function IssuanceForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>(); // Job Slip ID
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const [jobSlipDetails, setJobSlipDetails] = useState({
    slipNumber: '',
    factoryName: '',
    designSku: ''
  });

  const [items, setItems] = useState<IssuanceItem[]>([]);

  useEffect(() => {
    // Mock fetch pending items for this Job Slip
    const timer = setTimeout(() => {
      setJobSlipDetails({
        slipNumber: 'JS-24-101',
        factoryName: 'Super Stitchers',
        designSku: 'DR-1024 - Summer Floral Dress'
      });
      setItems([
        { id: 'item-1', materialName: 'Cotton Fabric - Blue', requiredQty: 1250, previouslyIssued: 1000, issuingQty: 250, uom: 'm' },
        { id: 'item-2', materialName: 'Silk Thread - Gold', requiredQty: 25, previouslyIssued: 0, issuingQty: 25, uom: 'kg' },
      ]);
      setIsLoading(false);
    }, 700);
    return () => clearTimeout(timer);
  }, [id]);

  const handleQtyChange = (itemId: string, value: number) => {
    setItems(prev => prev.map(item => 
      item.id === itemId ? { ...item, issuingQty: value } : item
    ));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    // Mock save
    await new Promise(resolve => setTimeout(resolve, 800));
    
    setIsSaving(false);
    navigate('/production/issuance');
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
        <button onClick={() => navigate('/production/issuance')} className="icon-btn">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold">Issue Materials</h1>
          <p className="text-muted">Issuing materials for {jobSlipDetails.slipNumber} to {jobSlipDetails.factoryName}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        
        {/* Header Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4 bg-slate-50">
            <span className="text-xs text-muted font-semibold uppercase tracking-wider block mb-1">Job Slip</span>
            <span className="text-lg font-bold text-slate-800">{jobSlipDetails.slipNumber}</span>
          </Card>
          <Card className="p-4 bg-slate-50">
            <span className="text-xs text-muted font-semibold uppercase tracking-wider block mb-1">Factory / Artisan</span>
            <span className="text-lg font-bold text-slate-800">{jobSlipDetails.factoryName}</span>
          </Card>
          <Card className="p-4 bg-slate-50">
            <span className="text-xs text-muted font-semibold uppercase tracking-wider block mb-1">Design</span>
            <span className="text-lg font-bold text-slate-800 truncate">{jobSlipDetails.designSku}</span>
          </Card>
        </div>

        <Card className="flex flex-col gap-4">
          <h3 className="font-semibold text-lg border-b border-[var(--color-border)] pb-2 mb-2 flex items-center gap-2">
            <Box size={20} className="text-primary" />
            Materials to Issue
          </h3>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--color-border)] bg-[var(--color-background)]">
                  <th className="p-3 text-sm font-semibold text-muted">Material</th>
                  <th className="p-3 text-sm font-semibold text-muted text-center">Total Required</th>
                  <th className="p-3 text-sm font-semibold text-muted text-center">Prev. Issued</th>
                  <th className="p-3 text-sm font-semibold text-muted text-center">Pending</th>
                  <th className="p-3 text-sm font-semibold text-muted w-[200px]">Issue Qty</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const pending = item.requiredQty - item.previouslyIssued;
                  return (
                    <tr key={item.id} className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-background)]">
                      <td className="p-3 font-medium">{item.materialName}</td>
                      <td className="p-3 text-center text-muted">{item.requiredQty} {item.uom}</td>
                      <td className="p-3 text-center text-muted">{item.previouslyIssued} {item.uom}</td>
                      <td className="p-3 text-center font-semibold text-orange-600">{pending} {item.uom}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <input 
                            type="number" 
                            min="0"
                            max={pending}
                            step="0.01"
                            className="input-field w-full text-right"
                            value={item.issuingQty === 0 ? '' : item.issuingQty}
                            onChange={(e) => handleQtyChange(item.id, parseFloat(e.target.value) || 0)}
                            required
                          />
                          <span className="text-muted text-sm">{item.uom}</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-3 sticky bottom-0 bg-[var(--color-background)] p-4 border-t border-[var(--color-border)] -mx-6 px-6">
          <Button type="button" variant="secondary" onClick={() => navigate('/production/issuance')}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSaving}>
            Confirm Material Issuance
          </Button>
        </div>
      </form>
    </div>
  );
}
