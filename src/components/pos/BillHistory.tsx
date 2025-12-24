import { useState, useEffect } from 'react';
import { Search, Printer, Eye, Scan } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ReceiptView } from './ReceiptView';
import { BarcodeScanner } from './BarcodeScanner';

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
  status: string;
  created_at: string;
}

interface BillItem {
  id: string;
  item_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export function BillHistory() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [billItems, setBillItems] = useState<BillItem[]>([]);
  const [showReceipt, setShowReceipt] = useState(false);
  const [showScanner, setShowScanner] = useState(false);

  useEffect(() => {
    fetchBills();
  }, []);

  const fetchBills = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('bills')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('Error fetching bills:', error);
      toast.error('Failed to load bills');
    } else {
      setBills(data || []);
    }
    setLoading(false);
  };

  const fetchBillItems = async (billId: string) => {
    const { data, error } = await supabase
      .from('bill_items')
      .select('*')
      .eq('bill_id', billId);

    if (error) {
      console.error('Error fetching bill items:', error);
    } else {
      setBillItems(data || []);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      fetchBills();
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from('bills')
      .select('*')
      .or(`reference_number.ilike.%${searchQuery}%,barcode.ilike.%${searchQuery}%,customer_name.ilike.%${searchQuery}%`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error searching bills:', error);
      toast.error('Search failed');
    } else {
      setBills(data || []);
    }
    setLoading(false);
  };

  const handleViewBill = async (bill: Bill) => {
    setSelectedBill(bill);
    await fetchBillItems(bill.id);
    setShowReceipt(true);
  };

  const handleReprint = async (bill: Bill) => {
    await supabase
      .from('bills')
      .update({ status: 'reprinted' })
      .eq('id', bill.id);
    
    setSelectedBill(bill);
    await fetchBillItems(bill.id);
    setShowReceipt(true);
    toast.success('Bill marked for reprint');
  };

  const handleBarcodeScanned = (barcode: string) => {
    setSearchQuery(barcode);
    setShowScanner(false);
    handleSearch();
  };

  const filteredBills = bills.filter(bill =>
    bill.reference_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    bill.barcode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    bill.customer_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 bg-background min-h-full">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-foreground mb-4">Bill History</h2>
        
        <div className="flex gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by reference number, barcode, or customer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="pl-9"
            />
          </div>
          <Button onClick={handleSearch}>Search</Button>
          <Button variant="outline" onClick={() => setShowScanner(true)}>
            <Scan className="h-4 w-4 mr-2" />
            Scan Barcode
          </Button>
        </div>
      </div>

      <div className="bg-card rounded-lg shadow-sm border border-border overflow-hidden">
        <div className="pos-table-header">
          <div className="grid grid-cols-8 gap-4 px-4 py-3 text-sm font-medium text-muted-foreground">
            <span>Reference #</span>
            <span>Customer</span>
            <span className="text-right">Subtotal</span>
            <span className="text-right">Discount</span>
            <span className="text-right">Total</span>
            <span className="text-right">Paid</span>
            <span className="text-center">Status</span>
            <span className="text-center">Actions</span>
          </div>
        </div>

        <div className="divide-y divide-border">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">Loading...</div>
          ) : filteredBills.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">No bills found</div>
          ) : (
            filteredBills.map((bill) => (
              <div
                key={bill.id}
                className="grid grid-cols-8 gap-4 px-4 py-3 items-center hover:bg-table-hover transition-colors"
              >
                <span className="font-mono text-sm">{bill.reference_number}</span>
                <span className="text-sm">{bill.customer_name || 'Walk-in'}</span>
                <span className="text-right">Rs. {Number(bill.subtotal).toLocaleString()}</span>
                <span className="text-right text-accent">
                  {Number(bill.discount) > 0 ? `-Rs. ${Number(bill.discount).toLocaleString()}` : '-'}
                </span>
                <span className="text-right font-medium">Rs. {Number(bill.total).toLocaleString()}</span>
                <span className="text-right">Rs. {Number(bill.paid_amount).toLocaleString()}</span>
                <span className="text-center">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    bill.status === 'completed' ? 'bg-accent/20 text-accent' :
                    bill.status === 'reprinted' ? 'bg-info/20 text-info' :
                    'bg-warning/20 text-warning'
                  }`}>
                    {bill.status}
                  </span>
                </span>
                <div className="flex justify-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleViewBill(bill)}
                    title="View Receipt"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleReprint(bill)}
                    title="Reprint"
                  >
                    <Printer className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Receipt Dialog */}
      <Dialog open={showReceipt} onOpenChange={setShowReceipt}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Receipt</DialogTitle>
          </DialogHeader>
          {selectedBill && (
            <ReceiptView bill={selectedBill} items={billItems} />
          )}
        </DialogContent>
      </Dialog>

      {/* Barcode Scanner Dialog */}
      <Dialog open={showScanner} onOpenChange={setShowScanner}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Scan Bill Barcode</DialogTitle>
          </DialogHeader>
          <BarcodeScanner onScan={handleBarcodeScanned} onClose={() => setShowScanner(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
