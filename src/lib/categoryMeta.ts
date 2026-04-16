import {
  Utensils,
  Car,
  ShoppingBag,
  Zap,
  Film,
  Heart,
  GraduationCap,
  Gift,
  Plane,
  MoreHorizontal,
  Tag,
  type LucideIcon,
} from 'lucide-react';

type CategoryMeta = {
  icon: LucideIcon;
  accent: string;
  softBg: string;
};

const CATEGORY_META: Record<string, CategoryMeta> = {
  'Food & Dining': { icon: Utensils, accent: 'text-chart-orange', softBg: 'bg-chart-orange/15' },
  Transport: { icon: Car, accent: 'text-chart-blue', softBg: 'bg-chart-blue/15' },
  Shopping: { icon: ShoppingBag, accent: 'text-gold', softBg: 'bg-gold/15' },
  'Bills & Utilities': { icon: Zap, accent: 'text-chart-red', softBg: 'bg-chart-red/15' },
  Entertainment: { icon: Film, accent: 'text-chart-green', softBg: 'bg-chart-green/15' },
  Health: { icon: Heart, accent: 'text-destructive', softBg: 'bg-destructive/15' },
  Education: { icon: GraduationCap, accent: 'text-chart-blue', softBg: 'bg-chart-blue/15' },
  Gift: { icon: Gift, accent: 'text-chart-green', softBg: 'bg-chart-green/15' },
  Travel: { icon: Plane, accent: 'text-accent', softBg: 'bg-accent/20' },
  Other: { icon: MoreHorizontal, accent: 'text-muted-foreground', softBg: 'bg-muted' },
};

const FALLBACK: CategoryMeta = {
  icon: Tag,
  accent: 'text-accent',
  softBg: 'bg-accent/15',
};

export function getCategoryMeta(category: string): CategoryMeta {
  return CATEGORY_META[category] || FALLBACK;
}
