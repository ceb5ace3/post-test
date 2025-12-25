import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Printer } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface OrderItem {
  id: string;
  menuItem: { name: string; price: number };
  quantity: number;
}

interface PrintDialogProps {
  open: boolean;
  onClose: () => void;
  totalAmount: number;
  subtotal: number;
  discount: number;
  customerName: string;
  orderItems: OrderItem[];
  onPrintComplete: (paidAmount: number, discount: number, discountType: 'percentage' | 'amount') => Promise<void>;
}

export function PrintDialog({ open, onClose, totalAmount, subtotal, discount: initialDiscount, customerName, orderItems, onPrintComplete }: PrintDialogProps) {
  const [paidAmount, setPaidAmount] = useState<string>('');
  const [discountValue, setDiscountValue] = useState<string>('0');
  const [discountType, setDiscountType] = useState<'percentage' | 'amount'>('amount');
  const [isPrinting, setIsPrinting] = useState(false);
  const [shopSettings, setShopSettings] = useState<any>(null);
  const paidAmountInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    supabase.from('shop_settings').select('*').limit(1).maybeSingle().then(({ data }) => { if (data) setShopSettings(data); });
  }, []);

  useEffect(() => {
    if (open && orderItems.length > 0) {
      setPaidAmount(totalAmount.toString());
      setDiscountValue('0');
      setTimeout(() => { paidAmountInputRef.current?.focus(); paidAmountInputRef.current?.select(); }, 100);
    }
  }, [open, totalAmount, orderItems]);

  const calculateDiscount = () => {
    const value = parseFloat(discountValue) || 0;
    return discountType === 'percentage' ? (subtotal * value) / 100 : value;
  };

  const discountAmount = calculateDiscount();
  const finalTotal = subtotal - discountAmount;
  const change = (parseFloat(paidAmount) || 0) - finalTotal;

  const handlePrintComplete = async () => {
    const paid = parseFloat(paidAmount) || 0;
    if (paid < finalTotal) {
      toast.error(`Need Rs. ${(finalTotal - paid).toLocaleString()} more`);
      return;
    }

    setIsPrinting(true);
    try {
      await onPrintComplete(paid, discountAmount, discountType);
      toast.success('Bill printed!');
      setTimeout(onClose, 1000);
    } catch (error) {
      toast.error('Failed to print');
    }
    setIsPrinting(false);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle className="text-2xl font-bold text-center flex items-center justify-center gap-2"><Printer className="h-6 w-6" />Payment & Print</DialogTitle></DialogHeader>
        <div className="space-y-4 py-4">
          <div className="flex justify-between items-center bg-accent/10 p-4 rounded-lg">
            <span className="text-lg font-medium">Total:</span>
            <span className="text-2xl font-bold text-success">Rs. {totalAmount.toLocaleString()}</span>
          </div>
          <div className="space-y-2">
            <Label>Paid Amount:</Label>
            <Input ref={paidAmountInputRef} type="number" value={paidAmount} onChange={(e) => setPaidAmount(e.target.value)} className="text-lg font-bold" disabled={isPrinting} />
          </div>
          <div className="space-y-2">
            <Label>Discount Type:</Label>
            <RadioGroup value={discountType} onValueChange={(v) => setDiscountType(v as any)} className="flex gap-4">
              <div className="flex items-center space-x-2"><RadioGroupItem value="amount" id="amount" /><Label htmlFor="amount">Amount</Label></div>
              <div className="flex items-center space-x-2"><RadioGroupItem value="percentage" id="percentage" /><Label htmlFor="percentage">%</Label></div>
            </RadioGroup>
          </div>
          <div className="space-y-2">
            <Label>Discount:</Label>
            <Input type="number" value={discountValue} onChange={(e) => setDiscountValue(e.target.value)} disabled={isPrinting} />
          </div>
          {discountAmount > 0 && <div className="flex justify-between text-success bg-success/10 p-3 rounded-lg"><span>Discount:</span><span className="font-medium">-Rs. {discountAmount.toLocaleString()}</span></div>}
          <div className="flex justify-between items-center border-t-2 pt-3"><span className="font-semibold">Final Total:</span><span className="text-2xl font-bold">Rs. {finalTotal.toLocaleString()}</span></div>
          {change >= 0 && <div className={`flex justify-between items-center p-4 rounded-lg ${change > 0 ? 'bg-success/20 border-2 border-success' : 'bg-blue-50'}`}><span className="font-semibold">Change:</span><span className="text-2xl font-bold text-success">Rs. {change.toLocaleString()}</span></div>}
        </div>
        <div className="flex gap-3">
          <Button onClick={handlePrintComplete} className="flex-1 bg-success hover:bg-success/90 h-12" disabled={isPrinting || change < 0}><Printer className="h-5 w-5 mr-2" />{isPrinting ? 'Printing...' : 'Print'}</Button>
          <Button variant="outline" onClick={onClose} disabled={isPrinting} className="h-12">Cancel</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
