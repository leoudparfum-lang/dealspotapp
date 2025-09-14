import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useQuery } from "@tanstack/react-query";
import { 
  Flame, 
  UtensilsCrossed, 
  Waves, 
  Bed, 
  Dumbbell,
  ShoppingBag,
  Camera,
  Car
} from "lucide-react";

interface Category {
  id: string;
  name: string;
  nameNl: string;
  icon: string;
}

interface CategoryTabsProps {
  selectedCategory: string;
  onCategoryChange: (categoryId: string) => void;
}

const categoryIcons: Record<string, any> = {
  fire: Flame,
  utensils: UtensilsCrossed,
  spa: Waves,
  bed: Bed,
  dumbbell: Dumbbell,
  shopping: ShoppingBag,
  camera: Camera,
  car: Car,
};

export default function CategoryTabs({ selectedCategory, onCategoryChange }: CategoryTabsProps) {
  const { data: categories = [] } = useQuery({
    queryKey: ["/api/categories"],
    queryFn: async () => {
      const res = await fetch("/api/categories");
      return res.json() as Promise<Category[]>;
    },
  });

  const allCategories = [
    { id: "all", nameNl: "Populair", icon: "fire" },
    ...categories
  ];

  return (
    <div className="sticky top-[72px] z-30 px-4 py-4 bg-card/90 backdrop-blur-sm border-b border-border relative">
      {/* Gradient hints for overflow */}
      <div className="absolute inset-y-0 left-0 w-6 bg-gradient-to-r from-card/90 to-transparent pointer-events-none z-10" />
      <div className="absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-card/90 to-transparent pointer-events-none z-10" />
      
      <ScrollArea className="w-full">
        <div className="flex w-max flex-nowrap gap-2 pr-4 snap-x snap-mandatory mobile-scroll" data-testid="scroll-categories">
          {allCategories.map((category) => {
            const IconComponent = categoryIcons[category.icon] || Flame;
            const isSelected = selectedCategory === category.id;
            
            return (
              <Button
                key={category.id}
                variant={isSelected ? "default" : "secondary"}
                size="sm"
                className={`flex-none snap-start min-h-10 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors touch-target ${
                  isSelected 
                    ? "bg-primary text-primary-foreground hover:bg-primary/90" 
                    : "bg-muted text-muted-foreground hover:bg-primary hover:text-primary-foreground"
                }`}
                onClick={() => onCategoryChange(category.id)}
                data-testid={`button-category-${category.id}`}
              >
                <IconComponent className="w-4 h-4 mr-2" />
                {category.nameNl}
              </Button>
            );
          })}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}
