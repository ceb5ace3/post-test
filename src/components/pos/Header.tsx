import { Search, Menu, User } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onMenuToggle: () => void;
}

export function Header({ searchQuery, onSearchChange, onMenuToggle }: HeaderProps) {
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
        <Button 
          variant="ghost" 
          size="icon" 
          className="text-header-foreground hover:bg-sidebar-accent rounded-full bg-sidebar-accent"
        >
          <User className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
}
