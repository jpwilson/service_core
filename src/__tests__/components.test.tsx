import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MetricCard } from '../components/shared/MetricCard';
import { ChartCard } from '../components/shared/ChartCard';
import { Clock } from 'lucide-react';

describe('MetricCard', () => {
  it('renders title and value', () => {
    render(
      <MetricCard
        title="Active Employees"
        value={12}
        icon={<Clock data-testid="icon" />}
      />
    );
    expect(screen.getByText('Active Employees')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
  });

  it('renders subtitle when provided', () => {
    render(
      <MetricCard
        title="Hours"
        value="1,234h"
        subtitle="+5% from last period"
        icon={<Clock />}
      />
    );
    expect(screen.getByText('+5% from last period')).toBeInTheDocument();
  });
});

describe('ChartCard', () => {
  it('renders title and children', () => {
    render(
      <ChartCard title="Test Chart">
        <div>Chart content</div>
      </ChartCard>
    );
    expect(screen.getByText('Test Chart')).toBeInTheDocument();
    expect(screen.getByText('Chart content')).toBeInTheDocument();
  });

  it('renders subtitle when provided', () => {
    render(
      <ChartCard title="Chart" subtitle="Last 30 days">
        <div>Content</div>
      </ChartCard>
    );
    expect(screen.getByText('Last 30 days')).toBeInTheDocument();
  });
});
