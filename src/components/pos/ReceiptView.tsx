import { useRef, useEffect, useState } from 'react';
import { Printer, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

interface BillItem {
  id: string;
  item_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface Bill {
  id: string;
  reference_number: string;
  barcode: string | null;
  customer_name: string | null;
  subtotal: number;
  discount: number;
  total: number;
  paid_amount: number;
  change_amount: number;
  created_at: string;
}

interface ShopSettings {
  name: string;
  address: string | null;
  phone: string | null;
  created_by: string;
  created_by_phone: string;
}

interface ReceiptViewProps {
  bill: Bill;
  items: BillItem[];
}

export function ReceiptView({ bill, items }: ReceiptViewProps) {
  const receiptRef = useRef<HTMLDivElement>(null);
  const [shopSettings, setShopSettings] = useState<ShopSettings | null>(null);

  useEffect(() => {
    fetchShopSettings();
  }, []);

  const fetchShopSettings = async () => {
    const { data } = await supabase
      .from('shop_settings')
      .select('*')
      .limit(1)
      .maybeSingle();
    
    if (data) {
      setShopSettings(data);
    }
  };

  const handlePrint = () => {
    const printContent = receiptRef.current?.innerHTML;
    const printWindow = window.open('', '_blank');
    if (printWindow && printContent) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Receipt - ${bill.reference_number}</title>
            <style>
              body { font-family: 'Courier New', monospace; font-size: 12px; padding: 20px; max-width: 300px; margin: 0 auto; }
              .header { text-align: center; margin-bottom: 20px; }
              .shop-name { font-size: 18px; font-weight: bold; }
              .divider { border-top: 1px dashed #000; margin: 10px 0; }
              .item-row { display: flex; justify-content: space-between; margin: 5px 0; }
              .total-row { font-weight: bold; }
              .footer { text-align: center; margin-top: 20px; font-size: 10px; }
              @media print { body { margin: 0; padding: 10px; } }
            </style>
          </head>
          <body>${printContent}</body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-4">
      {/* Receipt Content */}
      <div ref={receiptRef} className="bg-card p-4 rounded-lg font-mono text-sm">
        {/* Header */}
        <div className="text-center mb-4">
          <h2 className="text-lg font-bold">{shopSettings?.name || 'Newsiri Trade Center'}</h2>
          {shopSettings?.address && <p className="text-xs">{shopSettings.address}</p>}
          {shopSettings?.phone && <p className="text-xs">Tel: {shopSettings.phone}</p>}
        </div>

        <div className="border-t border-dashed border-border my-3" />

        {/* Bill Info */}
        <div className="space-y-1 text-xs">
          <div className="flex justify-between">
            <span>Ref #:</span>
            <span>{bill.reference_number}</span>
          </div>
          <div className="flex justify-between">
            <span>Date:</span>
            <span>{formatDate(bill.created_at)}</span>
          </div>
          {bill.customer_name && (
            <div className="flex justify-between">
              <span>Customer:</span>
              <span>{bill.customer_name}</span>
            </div>
          )}
        </div>

        <div className="border-t border-dashed border-border my-3" />

        {/* Items */}
        <div className="space-y-2">
          <div className="flex justify-between font-semibold text-xs">
            <span>Item</span>
            <span>Amount</span>
          </div>
          {items.map((item) => (
            <div key={item.id} className="space-y-0.5">
              <div className="flex justify-between">
                <span className="flex-1">{item.item_name}</span>
                <span>Rs. {Number(item.total_price).toLocaleString()}</span>
              </div>
              <div className="text-xs text-muted-foreground">
                {item.quantity} x Rs. {Number(item.unit_price).toLocaleString()}
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-dashed border-border my-3" />

        {/* Totals */}
        <div className="space-y-1">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>Rs. {Number(bill.subtotal).toLocaleString()}</span>
          </div>
          {Number(bill.discount) > 0 && (
            <div className="flex justify-between text-accent">
              <span>Discount:</span>
              <span>-Rs. {Number(bill.discount).toLocaleString()}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-base">
            <span>TOTAL:</span>
            <span>Rs. {Number(bill.total).toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span>Paid:</span>
            <span>Rs. {Number(bill.paid_amount).toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span>Change:</span>
            <span>Rs. {Number(bill.change_amount).toLocaleString()}</span>
          </div>
        </div>

        <div className="border-t border-dashed border-border my-3" />

        {/* Barcode placeholder */}
        {bill.barcode && (
          <div className="text-center mb-3">
            <p className="text-xs font-mono tracking-widest">{bill.barcode}</p>
          </div>
        )}

        {/* Footer */}
        <div className="text-center text-xs mt-4">
          <p>Thank you for your purchase!</p>
          <p className="mt-2 text-muted-foreground">
            POS System by {shopSettings?.created_by || 'Imesh S Abeysinghe'}
          </p>
          <p className="text-muted-foreground">
            {shopSettings?.created_by_phone || '+94 77 00 25 374'}
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button onClick={handlePrint} className="flex-1">
          <Printer className="h-4 w-4 mr-2" />
          Print Receipt
        </Button>
        <Button variant="outline" className="flex-1">
          <Download className="h-4 w-4 mr-2" />
          Export PDF
        </Button>
      </div>
    </div>
  );
}
