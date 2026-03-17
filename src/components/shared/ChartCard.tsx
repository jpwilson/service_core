import React from 'react';

interface ChartCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}

export function ChartCard({
  title,
  subtitle,
  children,
  className = '',
}: ChartCardProps) {
  return (
    <div
      className={`bg-white rounded-xl border border-gray-200 overflow-hidden ${className}`}
    >
      <div className="px-5 pt-5 pb-3">
        <h3 className="text-base font-semibold text-[#0a1f44]">{title}</h3>
        {subtitle && (
          <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>
        )}
      </div>
      <div className="px-5 pb-5">{children}</div>
    </div>
  );
}
