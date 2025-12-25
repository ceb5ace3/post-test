import { useState, useEffect } from 'react';
import { Search, Printer, Eye, Scan, Calendar } from 'lucide-react';
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
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
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
    let query = supabase
      .from('bills')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(500);

    const { data, error } = await query;

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

  const handleClearFilters = () => {
    setSearchQuery('');
    setStartDate('');
    setEndDate('');
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
    fetchBills(); // Refresh the list
  };

  const handleBarcodeScanned = (barcode: string) => {
    setSearchQuery(barcode);
    setShowScanner(false);

    // Find bill by barcode
    const foundBill = bills.find(b => b.barcode === barcode || b.reference_number === barcode);
    if (foundBill) {
      handleViewBill(foundBill);
      toast.success('Bill found!');
    } else {
      toast.error('Bill not found with this barcode');
    }
  };

  const filteredBills = bills.filter(bill => {
    // Text search filter
    const matchesSearch = !searchQuery ||
      bill.reference_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bill.barcode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bill.customer_name?.toLowerCase().includes(searchQuery.toLowerCase());

    // Date range filter
    const billDate = new Date(bill.created_at);
    const matchesStartDate = !startDate || billDate >= new Date(startDate);
    const matchesEndDate = !endDate || billDate <= new Date(endDate + 'T23:59:59');

    return matchesSearch && matchesStartDate && matchesEndDate;
  });

  return (
    <div className="h-full overflow-y-auto bg-background">
      <div className="p-6 pb-20">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-foreground mb-4">Bill History</h2>

          <div className="space-y-3">
            <div className="flex gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by reference number, barcode, or customer..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button variant="outline" onClick={() => setShowScanner(true)}>
                <Scan className="h-4 w-4 mr-2" />
                Scan Barcode
              </Button>
            </div>

            <div className="flex gap-3 items-end">
              <div className="flex-1 max-w-xs">
                <label className="text-sm font-medium text-foreground mb-1.5 block">
                  From Date
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="flex-1 max-w-xs">
                <label className="text-sm font-medium text-foreground mb-1.5 block">
                  To Date
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              {(searchQuery || startDate || endDate) && (
                <Button variant="outline" onClick={handleClearFilters}>
                  Clear Filters
                </Button>
              )}
            </div>

            <div className="text-sm text-muted-foreground">
              Showing {filteredBills.length} of {bills.length} bills
            </div>
          </div>
        </div>

        <div className="bg-card rounded-lg shadow-sm border border-border overflow-hidden">
          <div className="pos-table-header">
            <div className="grid grid-cols-9 gap-4 px-4 py-3 text-sm font-medium text-muted-foreground">
              <span>Date & Time</span>
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
              <div className="p-8 text-center text-muted-foreground">
                {bills.length === 0 ? 'No bills found' : 'No bills match your search criteria'}
              </div>
            ) : (
              filteredBills.map((bill) => (
                <div
                  key={bill.id}
                  className="grid grid-cols-9 gap-4 px-4 py-3 items-center hover:bg-table-hover transition-colors"
                >
                  <div className="text-sm">
                    <div className="font-medium">
                      {new Date(bill.created_at).toLocaleDateString()}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(bill.created_at).toLocaleTimeString()}
                    </div>
                  </div>
                  <span className="font-mono text-sm">{bill.reference_number}</span>
                  <span className="text-sm">{bill.customer_name || 'Walk-in'}</span>
                  <span className="text-right">Rs. {Number(bill.subtotal).toLocaleString()}</span>
                  <span className="text-right text-accent">
                    {Number(bill.discount) > 0 ? `-Rs. ${Number(bill.discount).toLocaleString()}` : '-'}
                  </span>
                  <span className="text-right font-medium">Rs. {Number(bill.total).toLocaleString()}</span>
                  <span className="text-right">Rs. {Number(bill.paid_amount).toLocaleString()}</span>
                  <span className="text-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${bill.status === 'completed' ? 'bg-accent/20 text-accent' :
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
      </div>

      {/* Receipt Dialog */}
      <Dialog open={showReceipt} onOpenChange={setShowReceipt}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
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