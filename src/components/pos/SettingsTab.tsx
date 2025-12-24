import { useState, useEffect } from 'react';
import { Plus, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from 'recharts';

interface ShopSettings {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  created_by: string;
  created_by_phone: string;
}

interface Admin {
  id: string;
  name: string;
  role: 'owner' | 'manager' | 'cashier';
  phone: string | null;
}

export function SettingsTab() {
  const [settings, setSettings] = useState<ShopSettings | null>(null);
  const [adminList, setAdminList] = useState<Admin[]>([]);
  const [showAddAdminDialog, setShowAddAdminDialog] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { canManageStock, canManageAdmins, profile } = useAuth();

  // Weekly sales data for charts
  const weeklySalesData = [
    { label: 'Week 1', value: 320000 },
    { label: 'Week 2', value: 380000 },
    { label: 'Week 3', value: 290000 },
    { label: 'Week 4', value: 420000 },
  ];

  useEffect(() => {
    fetchSettings();
    fetchAdmins();
  }, []);

  const fetchSettings = async () => {
    const { data } = await supabase
      .from('shop_settings')
      .select('*')
      .limit(1)
      .maybeSingle();
    
    if (data) {
      setSettings(data);
    }
    setLoading(false);
  };

  const fetchAdmins = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .order('role');
    
    if (data) {
      setAdminList(data as Admin[]);
    }
  };

  const handleSaveSettings = async (field: string, value: string) => {
    if (!settings) return;

    const { error } = await supabase
      .from('shop_settings')
      .update({ [field]: value })
      .eq('id', settings.id);

    if (error) {
      toast.error('Failed to update settings');
    } else {
      toast.success('Settings saved successfully');
      setSettings(prev => prev ? { ...prev, [field]: value } : null);
    }
    setEditingField(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-background min-h-full">
      <div className="grid grid-cols-3 gap-6">
        {/* Shop Information */}
        <div className="space-y-6">
          <div className="bg-card rounded-lg border border-border p-4">
            <h3 className="font-semibold text-foreground uppercase mb-4">Shop Information</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                <span className="text-foreground">Shop Name</span>
                {editingField === 'name' ? (
                  <div className="flex gap-2">
                    <Input 
                      defaultValue={settings?.name}
                      onBlur={(e) => handleSaveSettings('name', e.target.value)}
                      className="w-48"
                      autoFocus
                    />
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">{settings?.name}</span>
                    {canManageStock && (
                      <Button size="sm" variant="outline" onClick={() => setEditingField('name')}>
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                )}
              </div>
              
              <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                <span className="text-foreground">Shop Address</span>
                {editingField === 'address' ? (
                  <div className="flex gap-2">
                    <Input 
                      defaultValue={settings?.address || ''}
                      onBlur={(e) => handleSaveSettings('address', e.target.value)}
                      className="w-48"
                      autoFocus
                    />
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground truncate max-w-32">
                      {settings?.address || 'Not set'}
                    </span>
                    {canManageStock && (
                      <Button size="sm" variant="outline" onClick={() => setEditingField('address')}>
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                )}
              </div>
              
              <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                <span className="text-foreground">Shop Phone</span>
                {editingField === 'phone' ? (
                  <div className="flex gap-2">
                    <Input 
                      defaultValue={settings?.phone || ''}
                      onBlur={(e) => handleSaveSettings('phone', e.target.value)}
                      className="w-48"
                      autoFocus
                    />
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">{settings?.phone || 'Not set'}</span>
                    {canManageStock && (
                      <Button size="sm" variant="outline" onClick={() => setEditingField('phone')}>
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {canManageAdmins && (
              <Button 
                className="w-full mt-4 bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={() => setShowAddAdminDialog(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add New Admin
              </Button>
            )}
          </div>

          {/* Administrators */}
          <div className="bg-card rounded-lg border border-border p-4">
            <h3 className="font-semibold text-foreground uppercase mb-4">Administrators</h3>
            <div className="space-y-3">
              {adminList.map((admin) => (
                <div key={admin.id} className="flex justify-between items-center p-2 rounded hover:bg-secondary/30">
                  <div>
                    <p className="font-medium text-foreground">{admin.name}</p>
                    <p className="text-sm text-muted-foreground capitalize">{admin.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Backup & Restore */}
          <div className="bg-card rounded-lg border border-border p-4">
            <h3 className="font-semibold text-foreground uppercase mb-4">Backup & Restore</h3>
            <div className="space-y-3">
              <Button variant="outline" className="w-full" onClick={() => toast.info('Backup feature coming soon')}>
                Create Backup
              </Button>
              <Button variant="outline" className="w-full" onClick={() => toast.info('Restore feature coming soon')}>
                Restore from Backup
              </Button>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="col-span-2 space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-card rounded-lg border border-border p-4">
              <h3 className="font-semibold text-foreground uppercase mb-4">Weekly Sales</h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklySalesData}>
                    <XAxis 
                      dataKey="label" 
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                    />
                    <YAxis 
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                      tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                    />
                    <Bar dataKey="value" fill="hsl(var(--chart-2))" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="bg-card rounded-lg border border-border p-4">
              <h3 className="font-semibold text-foreground uppercase mb-4">Monthly Trend</h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklySalesData}>
                    <XAxis 
                      dataKey="label" 
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                    />
                    <YAxis 
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                      tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                    />
                    <Bar dataKey="value" fill="hsl(var(--chart-2))" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Current Admin Info */}
          <div className="bg-card rounded-lg border border-border p-4">
            <div className="grid grid-cols-2 gap-8">
              <div>
                <h4 className="font-medium text-foreground mb-2">Current Admin</h4>
                <p className="text-lg">{profile?.name} - <span className="capitalize">{profile?.role}</span></p>
              </div>
              <div>
                <h4 className="font-medium text-foreground mb-2">Session Status</h4>
                <p className="text-lg text-accent">Active</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Credit */}
      <div className="mt-8 text-center text-sm text-muted-foreground border-t border-border pt-4">
        POS System by {settings?.created_by || 'Imesh S Abeysinghe'} | {settings?.created_by_phone || '+94 77 00 25 374'}
      </div>

      {/* Add Admin Dialog */}
      <Dialog open={showAddAdminDialog} onOpenChange={setShowAddAdminDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Admin</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              New admins need to create an account using the signup page. 
              They can select their role during registration.
            </p>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowAddAdminDialog(false)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
