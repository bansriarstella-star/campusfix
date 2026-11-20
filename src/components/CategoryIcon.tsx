import { Shirt, Wrench, Printer, Sparkles } from 'lucide-react';
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
    case 'repairs':
      return <Wrench className={className} />;
    case 'printing':
      return <Printer className={className} />;
    case 'housekeeping':
      return <Sparkles className={className} />;
  }
}
