import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: { value: number; isPositive: boolean };
  variant?: 'default' | 'warning' | 'danger';
}

const variantStyles = {
  default: {
    iconBg: 'bg-[#f89020]/10',
    iconText: 'text-[#f89020]',
  },
  warning: {
    iconBg: 'bg-amber-100',
    iconText: 'text-amber-600',
  },
  danger: {
    iconBg: 'bg-red-100',
    iconText: 'text-red-600',
  },
};

export function MetricCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  variant = 'default',
}: MetricCardProps) {
  const styles = variantStyles[variant];

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <div
              className={`w-10 h-10 rounded-full ${styles.iconBg} ${styles.iconText} flex items-center justify-center`}
            >
              {icon}
            </div>
          </div>
          <p className="text-xs font-medium uppercase tracking-wider text-gray-500 mb-1">
            {title}
          </p>
          <p className="text-2xl font-bold text-[#0a1f44]">{value}</p>
          {subtitle && (
            <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>
        {trend && (
          <div
            className={`flex items-center gap-1 text-sm font-medium ${
              trend.isPositive ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {trend.isPositive ? (
              <TrendingUp className="w-4 h-4" />
            ) : (
              <TrendingDown className="w-4 h-4" />
            )}
            <span>{trend.value}%</span>
          </div>
        )}
      </div>
    </div>
  );
}
