import {
  CheckCircle2,
  Clock,
  Loader2,
  ShieldCheck,
  XCircle,
  Ban,
} from 'lucide-react';
import type { BookingStatus } from '../types/campusfix';

const STATUS_CONFIG: Record<
  BookingStatus,
  {
    label: string;
    classes: string;
    Icon: typeof Clock;
  }
> = {
  Requested: {
    label: 'Requested',
    classes: 'bg-slate-100 text-[#0F1F3D] border-slate-200',
    Icon: Clock,
  },
  Accepted: {
    label: 'Accepted',
    classes: 'bg-teal-50 text-teal-800 border-teal-200',
    Icon: ShieldCheck,
  },
  'In Progress': {
    label: 'In Progress',
    classes: 'bg-amber-50 text-amber-800 border-amber-200',
    Icon: Loader2,
  },
  Completed: {
    label: 'Completed',
    classes: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    Icon: CheckCircle2,
  },
  Rejected: {
    label: 'Rejected',
    classes: 'bg-rose-50 text-rose-800 border-rose-200',
    Icon: XCircle,
  },
  Cancelled: {
    label: 'Cancelled',
    classes: 'bg-rose-50 text-rose-800 border-rose-200',
    Icon: Ban,
  },
};

export function StatusTag({ status }: { status: BookingStatus }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.Requested;
  const Icon = cfg.Icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold whitespace-nowrap shrink-0 ${cfg.classes}`}
    >
      <Icon className="w-3.5 h-3.5 shrink-0" />
      <span>{cfg.label}</span>
    </span>
  );
}
