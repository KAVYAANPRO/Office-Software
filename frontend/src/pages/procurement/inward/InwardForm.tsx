import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import { ConfirmDialog } from '../../../components/feedback/ConfirmDialog';

interface InwardItem {
  id: string;
  materialName: string;
  orderedQty: number;
  previouslyReceived: number;
  receivingQty: number;
  uom: string;
}

export function InwardForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>(); // PO ID
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [poDetails, setPoDetails] = useState({
    poNumber: '',
    supplierName: '',
  });

  const [items, setItems] = useState<InwardItem[]>([]);

  useEffect(() => {
    // Mock fetch pending items for this PO
    const timer = setTimeout(() => {
      setPoDetails({
        poNumber: 'PO-24-002',
        supplierName: 'Zeta Dyeing',
      });
      setItems([
        { id: 'item-1', materialName: 'Cotton Fabric - Blue', orderedQty: 500, previouslyReceived: 200, receivingQty: 300, uom: 'm' },
        { id: 'item-2', materialName: 'Silk Thread - Gold', orderedQty: 10, previouslyReceived: 0, receivingQty: 10, uom: 'kg' },
      ]);
      setIsLoading(false);
    }, 700);
    return () => clearTimeout(timer);
  }, [id]);

  const handleQtyChange = (itemId: string, value: number) => {
    setItems(prev => prev.map(item => 
      item.id === itemId ? { ...item, receivingQty: value } : item
    ));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setShowConfirm(true);
  };

  const confirmSubmit = async () => {
    setShowConfirm(false);
    setIsSaving(true);

    // Mock save
    await new Promise(resolve => setTimeout(resolve, 800));

    setIsSaving(false);
    navigate('/procurement/inward');
  };

  const receivingSummary = items
    .filter(item => item.receivingQty > 0)
    .map(item => `${item.receivingQty} ${item.uom} of ${item.materialName}`)
    .join(', ');

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
        <button onClick={() => navigate('/procurement/inward')} className="icon-btn">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold">Inward Material</h1>
          <p className="text-muted">Receiving items for {poDetails.poNumber} ({poDetails.supplierName})</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <Card className="flex flex-col gap-4">
          <h3 className="font-semibold text-lg border-b border-[var(--color-border)] pb-2 mb-2">Items to Receive</h3>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--color-border)] bg-[var(--color-background)]">
                  <th className="p-3 text-sm font-semibold text-muted">Material</th>
                  <th className="p-3 text-sm font-semibold text-muted text-center">Ordered</th>
                  <th className="p-3 text-sm font-semibold text-muted text-center">Prev. Received</th>
                  <th className="p-3 text-sm font-semibold text-muted text-center">Pending</th>
                  <th className="p-3 text-sm font-semibold text-muted w-[200px]">Receive Qty</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const pending = item.orderedQty - item.previouslyReceived;
                  return (
                    <tr key={item.id} className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-background)]">
                      <td className="p-3 font-medium">{item.materialName}</td>
                      <td className="p-3 text-center text-muted">{item.orderedQty} {item.uom}</td>
                      <td className="p-3 text-center text-muted">{item.previouslyReceived} {item.uom}</td>
                      <td className="p-3 text-center font-semibold text-yellow-600">{pending} {item.uom}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <input 
                            type="number" 
                            min="0"
                            max={pending}
                            step="0.01"
                            className="input-field w-full text-right"
                            value={item.receivingQty === 0 ? '' : item.receivingQty}
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

        <Card className="bg-blue-50 border-blue-100 flex gap-4 p-4 items-start">
          <CheckCircle className="text-blue-500 mt-1 flex-shrink-0" size={20} />
          <div>
            <h4 className="font-semibold text-blue-900">Traceability Notice</h4>
            <p className="text-sm text-blue-800 mt-1">
              Upon submission, the system will generate unique <strong>Lot Numbers</strong> for each received material. 
              These lot numbers will be printed on the Goods Receipt Note (GRN) for warehouse tracking.
            </p>
          </div>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-3 sticky bottom-0 bg-[var(--color-background)] p-4 border-t border-[var(--color-border)] -mx-6 px-6">
          <Button type="button" variant="secondary" onClick={() => navigate('/procurement/inward')}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSaving}>
            Confirm Inward & Generate Lots
          </Button>
        </div>
      </form>

      <ConfirmDialog
        open={showConfirm}
        title="Confirm Inward"
        impact={`Confirm inward and add ${receivingSummary || 'the entered quantities'} to raw material stock at Main Warehouse? Lot numbers will be generated for traceability.`}
        confirmLabel="Confirm Inward"
        isLoading={isSaving}
        onConfirm={confirmSubmit}
        onCancel={() => setShowConfirm(false)}
      />
    </div>
  );
}
