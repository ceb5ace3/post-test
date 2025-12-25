import { useState, useEffect } from 'react';
import { Plus, Edit, Sun, Moon, Monitor, Trash2, Download, Upload, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

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
  email: string | null;
}

interface NewAdminForm {
  name: string;
  email: string;
  role: 'manager' | 'cashier';
  password: string;
}

export function SettingsTab() {
  const [settings, setSettings] = useState<ShopSettings | null>(null);
  const [adminList, setAdminList] = useState<Admin[]>([]);
  const [showAddAdminDialog, setShowAddAdminDialog] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [backupLoading, setBackupLoading] = useState(false);
  const [restoreLoading, setRestoreLoading] = useState(false);
  const { canManageAdmins, profile } = useAuth();
  const navigate = useNavigate();

  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('dark');
  const [themeLoaded, setThemeLoaded] = useState(false);

  const [newAdmin, setNewAdmin] = useState<NewAdminForm>({
    name: '',
    email: '',
    role: 'cashier',
    password: ''
  });

  const themeOptions = [
    { id: 'light', name: 'Light', icon: Sun, description: 'Bright and clean' },
    { id: 'dark', name: 'Dark', icon: Moon, description: 'Easy on the eyes' },
    { id: 'system', name: 'System', icon: Monitor, description: 'Match device settings' }
  ] as const;

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | 'system';
    if (savedTheme) setTheme(savedTheme);
    setThemeLoaded(true);
  }, []);

  useEffect(() => {
    if (!themeLoaded) return;
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.remove('light');
      root.classList.add('dark');
    } else if (theme === 'light') {
      root.classList.remove('dark');
      root.classList.add('light');
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.remove('dark', 'light');
      if (prefersDark) root.classList.add('dark');
      else root.classList.add('light');
    }
  }, [theme, themeLoaded]);

  useEffect(() => {
    fetchSettings();
    fetchAdmins();
  }, []);

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    toast.success(`Theme changed to ${newTheme}`);
  };

  const fetchSettings = async () => {
    const { data } = await supabase.from('shop_settings').select('*').limit(1).maybeSingle();
    if (data) setSettings(data);
    setLoading(false);
  };

  const fetchAdmins = async () => {
    const { data } = await supabase.from('profiles').select('*').order('role');
    if (data) setAdminList(data as Admin[]);
  };

  const handleSaveSettings = async (field: string, value: string) => {
    if (!settings) return;
    const { error } = await supabase.from('shop_settings').update({ [field]: value }).eq('id', settings.id);
    if (error) {
      toast.error('Failed to update settings');
    } else {
      toast.success('Settings saved successfully');
      setSettings(prev => prev ? { ...prev, [field]: value } : null);
    }
    setEditingField(null);
  };

  const handleAddAdmin = async () => {
    if (!newAdmin.name || !newAdmin.email || !newAdmin.password) {
      toast.error('Please fill in all fields');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newAdmin.email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    setSubmitting(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newAdmin.email,
        password: newAdmin.password,
        options: {
          data: {
            name: newAdmin.name,
            role: newAdmin.role
          }
        }
      });

      if (authError) throw authError;

      if (authData.user) {
        const { error: profileError } = await supabase.from('profiles').insert({
          id: authData.user.id,
          name: newAdmin.name,
          email: newAdmin.email,
          role: newAdmin.role
        });

        if (profileError) throw profileError;
      }

      toast.success('Admin added successfully');
      setShowAddAdminDialog(false);
      setNewAdmin({ name: '', email: '', role: 'cashier', password: '' });
      fetchAdmins();
    } catch (error: any) {
      console.error('Add admin error:', error);
      toast.error(error.message || 'Failed to add admin');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAdmin = async (adminId: string, adminName: string) => {
    if (adminId === profile?.id) {
      toast.error('You cannot delete your own account');
      return;
    }

    if (!confirm(`Are you sure you want to delete admin "${adminName}"? This action cannot be undone.`)) return;

    try {
      // First check if the admin exists
      const { data: adminCheck, error: checkError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', adminId)
        .single();

      if (checkError || !adminCheck) {
        toast.error('Admin not found');
        return;
      }

      // Attempt to delete
      const { error, count } = await supabase
        .from('profiles')
        .delete({ count: 'exact' })
        .eq('id', adminId);

      if (error) {
        console.error('Profile delete error:', error);

        // Check if it's an RLS policy error
        if (error.code === '42501' || error.message.includes('row-level security')) {
          toast.error('Permission denied. You may need database admin access to delete users. Please check your RLS policies.');
        } else {
          toast.error(`Failed to delete: ${error.message}`);
        }
        return;
      }

      // Check if anything was actually deleted
      if (count === 0) {
        toast.error('Admin could not be deleted. This may be due to database permissions or RLS policies.');
        console.error('Delete returned 0 rows affected. Possible RLS policy blocking deletion.');
        return;
      }

      toast.success('Admin deleted successfully');
      await fetchAdmins();
    } catch (error: any) {
      console.error('Delete admin error:', error);
      toast.error(error.message || 'Failed to delete admin');
    }
  };

  const handleCreateBackup = async () => {
    setBackupLoading(true);
    try {
      const tables = ['products', 'stock_items', 'bills', 'bill_items', 'shop_settings', 'profiles'];
      const backupData: any = {
        version: '1.0',
        timestamp: new Date().toISOString(),
        data: {}
      };

      for (const table of tables) {
        const { data, error } = await supabase.from(table).select('*');

        if (error) {
          console.error(`Error fetching ${table}:`, error);
          toast.warning(`Could not backup ${table}`);
          backupData.data[table] = [];
        } else {
          backupData.data[table] = data || [];
        }
      }

      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `newsari-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      const counts = Object.entries(backupData.data)
        .filter(([key]) => key !== 'profiles' && key !== 'shop_settings')
        .map(([key, value]: [string, any]) => `${value.length} ${key}`)
        .join(', ');

      toast.success(`Backup created: ${counts}`);
    } catch (error: any) {
      console.error('Backup error:', error);
      toast.error(`Failed to create backup: ${error.message}`);
    } finally {
      setBackupLoading(false);
    }
  };

  const handleRestoreBackup = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';

    input.onchange = async (e: Event) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      setRestoreLoading(true);
      try {
        const text = await file.text();
        const backupData = JSON.parse(text);

        if (!backupData.version || !backupData.data) {
          throw new Error('Invalid backup file format');
        }

        if (!confirm('⚠️ WARNING: This will replace ALL existing data with the backup. This action cannot be undone. Are you sure?')) {
          setRestoreLoading(false);
          return;
        }

        toast.info('Starting restore process...');

        // Define restore order (child tables first for deletion, parent tables first for insertion)
        const deletionOrder = ['bill_items', 'bills', 'stock_items', 'products'];
        const insertionOrder = ['products', 'stock_items', 'bills', 'bill_items'];

        // Step 1: Delete existing data
        for (const table of deletionOrder) {
          try {
            toast.info(`Clearing ${table}...`);
            const { error } = await supabase.from(table).delete().not('id', 'is', null);
            if (error) console.warn(`Delete ${table} warning:`, error);
          } catch (err) {
            console.error(`Error deleting ${table}:`, err);
          }
        }

        // Step 2: Restore data
        for (const table of insertionOrder) {
          if (backupData.data[table] && backupData.data[table].length > 0) {
            toast.info(`Restoring ${backupData.data[table].length} ${table}...`);
            const items = backupData.data[table];
            const batchSize = table === 'bill_items' ? 200 : 100;

            for (let i = 0; i < items.length; i += batchSize) {
              const batch = items.slice(i, i + batchSize);
              const { error } = await supabase.from(table).insert(batch);

              if (error) {
                console.error(`${table} insert error:`, error);
                toast.error(`Error restoring ${table} batch: ${error.message}`);
              }
            }

            toast.success(`✓ Restored ${items.length} ${table}`);
          }
        }

        // Step 3: Restore shop settings (update not insert)
        if (backupData.data.shop_settings && backupData.data.shop_settings.length > 0) {
          toast.info('Restoring shop settings...');
          const shopSettings = backupData.data.shop_settings[0];

          if (shopSettings && shopSettings.id) {
            const { error } = await supabase
              .from('shop_settings')
              .update(shopSettings)
              .eq('id', shopSettings.id);

            if (error) {
              console.error('Shop settings error:', error);
            } else {
              toast.success('✓ Restored shop settings');
            }
          }
        }

        toast.success('🎉 Backup restored successfully! Refreshing page...');
        setTimeout(() => window.location.reload(), 2000);
      } catch (error: any) {
        console.error('Restore error:', error);
        toast.error(error.message || 'Failed to restore backup');
      } finally {
        setRestoreLoading(false);
      }
    };

    input.click();
  };

  const handleLogout = async () => {
    if (!confirm('Are you sure you want to logout?')) return;

    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      toast.success('Logged out successfully');
      navigate('/login');
    } catch (error: any) {
      console.error('Logout error:', error);
      toast.error('Failed to logout');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-background">
      <div className="p-6 pb-20">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Settings</h2>
            <p className="text-sm text-muted-foreground mt-1">Customize your Newsari Trade Center experience</p>
          </div>
          <Button variant="destructive" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>

        <div className="mb-8">
          <h3 className="text-lg font-semibold text-foreground mb-4">Theme Mode</h3>
          <div className="grid grid-cols-3 gap-3 max-w-2xl">
            {themeOptions.map((option) => {
              const Icon = option.icon;
              const isSelected = theme === option.id;
              return (
                <button
                  key={option.id}
                  onClick={() => handleThemeChange(option.id)}
                  className={`relative p-4 rounded-lg border-2 transition-all duration-200 text-left ${isSelected
                      ? 'border-blue-500 bg-blue-100 dark:bg-blue-950/50'
                      : 'border-border bg-card hover:border-muted-foreground/30'
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded ${isSelected ? 'bg-blue-200 dark:bg-blue-900' : 'bg-secondary'}`}>
                      <Icon className={`w-4 h-4 ${isSelected ? 'text-blue-700 dark:text-blue-300' : 'text-muted-foreground'}`} />
                    </div>
                    <div>
                      <div className={`font-medium text-sm ${isSelected ? 'text-blue-900 dark:text-blue-100' : 'text-foreground'}`}>
                        {option.name}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">{option.description}</div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-card rounded-lg border border-border p-6">
            <h3 className="font-semibold text-foreground text-lg mb-4">Shop Information</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                <span className="text-foreground font-medium">Shop Name</span>
                {editingField === 'name' ? (
                  <Input
                    defaultValue={settings?.name}
                    onBlur={(e) => handleSaveSettings('name', e.target.value)}
                    className="w-48"
                    autoFocus
                  />
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">{settings?.name}</span>
                    {canManageAdmins && (
                      <Button size="sm" variant="ghost" onClick={() => setEditingField('name')}>
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                <span className="text-foreground font-medium">Address</span>
                {editingField === 'address' ? (
                  <Input
                    defaultValue={settings?.address || ''}
                    onBlur={(e) => handleSaveSettings('address', e.target.value)}
                    className="w-48"
                    autoFocus
                  />
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground truncate max-w-40">
                      {settings?.address || 'Not set'}
                    </span>
                    {canManageAdmins && (
                      <Button size="sm" variant="ghost" onClick={() => setEditingField('address')}>
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                <span className="text-foreground font-medium">Phone</span>
                {editingField === 'phone' ? (
                  <Input
                    defaultValue={settings?.phone || ''}
                    onBlur={(e) => handleSaveSettings('phone', e.target.value)}
                    className="w-48"
                    autoFocus
                  />
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">{settings?.phone || 'Not set'}</span>
                    {canManageAdmins && (
                      <Button size="sm" variant="ghost" onClick={() => setEditingField('phone')}>
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-card rounded-lg border border-border p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground text-lg">Administrators</h3>
              {canManageAdmins && (
                <Button size="sm" onClick={() => setShowAddAdminDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Admin
                </Button>
              )}
            </div>
            <div className="space-y-3">
              {adminList.map((admin) => (
                <div key={admin.id} className="flex justify-between items-center p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors">
                  <div>
                    <p className="font-medium text-foreground">{admin.name}</p>
                    <p className="text-sm text-muted-foreground">
                      <span className="capitalize">{admin.role}</span>
                      {admin.email && ` • ${admin.email}`}
                      {admin.phone && ` • ${admin.phone}`}
                    </p>
                  </div>
                  {canManageAdmins && admin.role !== 'owner' && admin.id !== profile?.id && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleDeleteAdmin(admin.id, admin.name)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-card rounded-lg border border-border p-6 mb-6">
          <h3 className="font-semibold text-foreground text-lg mb-4">Backup & Restore</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Button
                variant="outline"
                className="w-full"
                onClick={handleCreateBackup}
                disabled={backupLoading}
              >
                {backupLoading ? (
                  <>Processing...</>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Create Backup
                  </>
                )}
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                Download all your data as a JSON file
              </p>
            </div>
            <div>
              <Button
                variant="outline"
                className="w-full"
                onClick={handleRestoreBackup}
                disabled={restoreLoading}
              >
                {restoreLoading ? (
                  <>Processing...</>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Restore from Backup
                  </>
                )}
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                Replace all data with backup file
              </p>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-lg border border-border p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-foreground mb-2">Current User</h4>
              <p className="text-lg">
                {profile?.name} • <span className="capitalize text-muted-foreground">{profile?.role}</span>
              </p>
            </div>
            <div>
              <h4 className="font-medium text-foreground mb-2">Session Status</h4>
              <p className="text-lg text-green-600 dark:text-green-400">Active</p>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center text-sm text-muted-foreground border-t border-border pt-4">
          POS System by {settings?.created_by || 'Imesh S Abeysinghe'} | {settings?.created_by_phone || '+94 77 00 25 374'}
        </div>
      </div>

      <Dialog open={showAddAdminDialog} onOpenChange={setShowAddAdminDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Admin</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                placeholder="Enter full name"
                value={newAdmin.name}
                onChange={(e) => setNewAdmin({ ...newAdmin, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@example.com"
                value={newAdmin.email}
                onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select value={newAdmin.role} onValueChange={(value: 'manager' | 'cashier') => setNewAdmin({ ...newAdmin, role: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="cashier">Cashier</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter password"
                value={newAdmin.password}
                onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Password must be at least 6 characters long
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddAdminDialog(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={handleAddAdmin} disabled={submitting}>
              {submitting ? 'Adding...' : 'Add Admin'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}