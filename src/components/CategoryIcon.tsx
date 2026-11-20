import {
  Droplets,
  Laptop,
  Printer,
  Scissors,
  Shirt,
  ShoppingBag,
  Sparkles,
  Wrench,
  Zap,
} from 'lucide-react';
import type { ServiceCategory } from '../types/campusfix';

export function CategoryIcon({
  category,
  className = 'w-5 h-5',
}: {
  category: ServiceCategory;
  className?: string;
}) {
  switch (category) {
    case 'laundry':
      return <Shirt className={className} />;
    case 'plumbing':
      return <Droplets className={className} />;
    case 'electrical':
      return <Zap className={className} />;
    case 'housekeeping':
      return <Sparkles className={className} />;
    case 'printing':
      return <Printer className={className} />;
    case 'tech_repairs':
      return <Laptop className={className} />;
    case 'delivery':
      return <ShoppingBag className={className} />;
    case 'personal_care':
      return <Scissors className={className} />;
    case 'repairs':
    default:
      return <Wrench className={className} />;
  }
}
