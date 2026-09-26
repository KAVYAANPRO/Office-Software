import type { ReactNode } from 'react';
import { Card } from './Card';

interface KPICardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  trend?: {
    value: string | number;
    isPositive: boolean;
    label: string;
  };
  isLoading?: boolean;
}

export function KPICard({ title, value, icon, trend, isLoading }: KPICardProps) {
  if (isLoading) {
    return (
      <Card className="animate-pulse flex flex-col gap-4">
        <div className="flex justify-between items-start">
          <div className="h-4 bg-[var(--color-border)] rounded w-1/2"></div>
          <div className="h-10 w-10 bg-[var(--color-border)] rounded-full"></div>
        </div>
        <div className="h-8 bg-[var(--color-border)] rounded w-3/4"></div>
        <div className="h-3 bg-[var(--color-border)] rounded w-1/4 mt-2"></div>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col gap-2">
      <div className="flex justify-between items-start mb-2">
        <h4 className="text-sm font-medium text-[var(--color-text-muted)]">{title}</h4>
        <div className="text-[var(--color-text-muted)]">{icon}</div>
      </div>
      <div className="text-2xl font-bold text-[var(--color-text-main)]">{value}</div>
      
      {trend && (
        <div className="flex items-center gap-2 mt-1">
          <span className={`text-sm font-medium ${trend.isPositive ? 'text-[var(--color-success)]' : 'text-[var(--color-error)]'}`}>
            {trend.isPositive ? '↑' : '↓'} {trend.value}
          </span>
          <span className="text-xs text-[var(--color-text-muted)]">{trend.label}</span>
        </div>
      )}
    </Card>
  );
}
