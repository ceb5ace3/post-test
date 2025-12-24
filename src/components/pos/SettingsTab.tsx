import { useState } from 'react';
import { Plus, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { shopSettings, admins } from '@/data/mockData';
import { toast } from 'sonner';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import { weeklySalesData } from '@/data/mockData';

export function SettingsTab() {
  const [settings, setSettings] = useState(shopSettings);
  const [adminList, setAdminList] = useState(admins);
  const [showAddAdminDialog, setShowAddAdminDialog] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);

  const handleSaveSettings = () => {
    toast.success('Settings saved successfully');
    setEditingField(null);
  };

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
                      value={settings.name}
                      onChange={(e) => setSettings({...settings, name: e.target.value})}
                      className="w-48"
                    />
                    <Button size="sm" onClick={handleSaveSettings}>Save</Button>
                  </div>
                ) : (
                  <Button size="sm" variant="outline" onClick={() => setEditingField('name')}>
                    <Edit className="h-4 w-4 mr-1" /> Edit
                  </Button>
                )}
              </div>
              
              <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                <span className="text-foreground">Shop Address</span>
                {editingField === 'address' ? (
                  <div className="flex gap-2">
                    <Input 
                      value={settings.address}
                      onChange={(e) => setSettings({...settings, address: e.target.value})}
                      className="w-48"
                    />
                    <Button size="sm" onClick={handleSaveSettings}>Save</Button>
                  </div>
                ) : (
                  <Button size="sm" variant="outline" onClick={() => setEditingField('address')}>
                    <Edit className="h-4 w-4 mr-1" /> Edit
                  </Button>
                )}
              </div>
              
              <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                <span className="text-foreground">Shop Phone Number</span>
                {editingField === 'phone' ? (
                  <div className="flex gap-2">
                    <Input 
                      value={settings.phone}
                      onChange={(e) => setSettings({...settings, phone: e.target.value})}
                      className="w-48"
                    />
                    <Button size="sm" onClick={handleSaveSettings}>Save</Button>
                  </div>
                ) : (
                  <Button size="sm" variant="outline" onClick={() => setEditingField('phone')}>
                    <Edit className="h-4 w-4 mr-1" /> Edit
                  </Button>
                )}
              </div>
            </div>

            <Button 
              className="w-full mt-4 bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => setShowAddAdminDialog(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add New Admin
            </Button>
          </div>

          {/* Administrators */}
          <div className="bg-card rounded-lg border border-border p-4">
            <h3 className="font-semibold text-foreground uppercase mb-4">Administrators</h3>
            <div className="space-y-3">
              {adminList.map((admin) => (
                <div key={admin.id} className="flex justify-between items-center p-2 rounded hover:bg-secondary/30">
                  <div>
                    <p className="font-medium text-foreground">{admin.name}</p>
                    <p className="text-sm text-muted-foreground">{admin.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Backup & Restore */}
          <div className="bg-card rounded-lg border border-border p-4">
            <h3 className="font-semibold text-foreground uppercase mb-4">Backup & Restore</h3>
            <div className="space-y-3">
              <Button variant="outline" className="w-full">
                Create Backup
              </Button>
              <Button variant="outline" className="w-full">
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
                <p className="text-lg">{adminList[0].name} - {adminList[0].role}</p>
              </div>
              <div>
                <h4 className="font-medium text-foreground mb-2">Selected Session</h4>
                <p className="text-lg">Active Session</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Credit */}
      <div className="mt-8 text-center text-sm text-muted-foreground border-t border-border pt-4">
        POS System by {settings.createdBy} | {settings.createdByPhone}
      </div>

      {/* Add Admin Dialog */}
      <Dialog open={showAddAdminDialog} onOpenChange={setShowAddAdminDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Admin</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="adminName">Name</Label>
              <Input id="adminName" placeholder="Enter admin name" />
            </div>
            <div>
              <Label htmlFor="adminPhone">Phone Number</Label>
              <Input id="adminPhone" placeholder="Enter phone number" />
            </div>
            <div>
              <Label htmlFor="adminRole">Role</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Owner">Owner</SelectItem>
                  <SelectItem value="Manager">Manager</SelectItem>
                  <SelectItem value="Cashier">Cashier</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowAddAdminDialog(false)}>Cancel</Button>
            <Button onClick={() => {
              toast.success('Admin added successfully');
              setShowAddAdminDialog(false);
            }}>Add Admin</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
