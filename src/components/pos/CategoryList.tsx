import { ChevronRight } from 'lucide-react';
import { Category, MenuItem } from '@/types/pos';
import { cn } from '@/lib/utils';

interface CategoryListProps {
  categories: Category[];
  selectedCategory: string | null;
  onCategorySelect: (categoryId: string) => void;
  onItemSelect: (item: MenuItem) => void;
}

export function CategoryList({ 
  categories, 
  selectedCategory, 
  onCategorySelect, 
  onItemSelect 
}: CategoryListProps) {
  return (
    <div className="flex-1 overflow-auto">
      {categories.map((category) => (
        <div key={category.id}>
          <div
            onClick={() => onCategorySelect(category.id)}
            className={cn(
              'pos-category-item flex items-center justify-between p-4',
              selectedCategory === category.id && 'active'
            )}
          >
            <div>
              <h3 className="font-semibold text-foreground">{category.name}</h3>
              {selectedCategory !== category.id && category.items.length > 0 && (
                <p className="text-sm text-muted-foreground">
                  {category.items.slice(0, 2).map(i => i.name).join(', ')}
                </p>
              )}
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </div>
          
          {selectedCategory === category.id && (
            <div className="bg-secondary/20 animate-slide-in">
              {category.items.map((item) => (
                <div
                  key={item.id}
                  onClick={() => onItemSelect(item)}
                  className="flex items-center justify-between px-8 py-3 border-b border-border/50 cursor-pointer hover:bg-secondary/40 transition-colors"
                >
                  <span className="text-foreground">{item.name}</span>
                  <span className="text-muted-foreground font-medium">
                    Rs. {item.price.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
