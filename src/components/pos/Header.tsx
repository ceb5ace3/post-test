import { Search, Menu, User, LogOut } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onMenuToggle: () => void;
}

export function Header({ searchQuery, onSearchChange, onMenuToggle }: HeaderProps) {
  const { profile, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'owner': return 'bg-accent text-accent-foreground';
      case 'manager': return 'bg-info text-info-foreground';
      case 'cashier': return 'bg-warning text-warning-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <header className="pos-header h-14 flex items-center justify-between px-4 shadow-md">
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="icon" 
          className="text-header-foreground hover:bg-sidebar-accent"
          onClick={onMenuToggle}
        >
          <Menu className="h-5 w-5" />
        </Button>
        
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 bg-card text-foreground border-0 h-9"
          />
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        <Button variant="ghost" className="text-header-foreground hover:bg-sidebar-accent text-sm font-medium">
          POS MODE
        </Button>
        <Button variant="ghost" className="text-header-foreground hover:bg-sidebar-accent text-sm font-medium">
          SHIFT MANAGEMENT
        </Button>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-header-foreground hover:bg-sidebar-accent rounded-full bg-sidebar-accent"
            >
              <User className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col gap-1">
                <span className="font-medium">{profile?.name || 'User'}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full w-fit capitalize ${getRoleBadgeColor(profile?.role || '')}`}>
                  {profile?.role}
                </span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
