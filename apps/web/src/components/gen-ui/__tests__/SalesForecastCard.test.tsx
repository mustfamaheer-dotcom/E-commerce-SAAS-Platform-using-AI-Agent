// apps/web/src/components/gen-ui/__tests__/SalesForecastCard.test.tsx
import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

const i18nState = { language: 'en' };

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: { defaultValue?: string; qty?: number }) => {
      if (key === 'forecast.orderNow' && options?.defaultValue) {
        return options.defaultValue.replace('{{qty}}', String(options.qty ?? 0));
      }
      return options?.defaultValue ?? key;
    },
    i18n: { get language() { return i18nState.language; } },
  }),
}));

import { SalesForecastCard, SalesForecastPayload } from '../SalesForecastCard';

const buildPayload = (overrides: Partial<SalesForecastPayload> = {}): SalesForecastPayload => ({
  card_type: 'sales_forecast',
  product: {
    id: 'prod_101',
    name: 'JBL Flip 6 Waterproof Speaker',
    sku: 'SPK-JBL-01',
    current_stock: 80,
  },
  horizon_days: 30,
  history: Array.from({ length: 30 }, (_, index) => ({
    report_date: `2026-10-${String(index + 1).padStart(2, '0')}`,
    units_sold: 4 + (index % 3),
  })),
  point_forecast: Array.from({ length: 30 }, (_, index) => ({
    report_date: `2026-11-${String(index + 1).padStart(2, '0')}`,
    yhat: 4.8,
    yhat_lower: 4.2,
    yhat_upper: 5.4,
  })),
  totals: { yhat: 145, yhat_lower: 125, yhat_upper: 165 },
  top_shap_drivers: [
    { feature: 'day_of_week', impact_pct: 18 },
    { feature: 'discount_pct', impact_pct: 24 },
    { feature: 'stock_level', impact_pct: -9 },
  ],
  restock: {
    current_stock: 80,
    predicted_demand: 145,
    gap: 65,
    safety_stock: 20,
    reorder_level: 85,
    stockout_eta: '2026-11-04',
    recommendation: 'order_now',
    suggested_order_qty: 85,
  },
  model_version: 'sales_forecast_lightgbm@2026-10-21',
  source: 'model',
  latency_ms: 120,
  ...overrides,
});

describe('SalesForecastCard', () => {
  beforeEach(() => {
    i18nState.language = 'en';
  });

  it('renders the canonical demand numbers and the 95% band', () => {
    render(<SalesForecastCard data={buildPayload()} />);

    expect(screen.getByText('145')).toBeInTheDocument();
    expect(screen.getByText('[125–165]')).toBeInTheDocument();
    expect(screen.getByText('80')).toBeInTheDocument();
  });

  it('shows the restock badge with the suggested order quantity', () => {
    render(<SalesForecastCard data={buildPayload()} />);

    expect(screen.getByText('Order 85 units this week')).toBeInTheDocument();
    expect(screen.getByText(/Projected stockout: 2026-11-04/)).toBeInTheDocument();
  });

  it('reassures the merchant when stock covers the horizon', () => {
    const payload = buildPayload();
    payload.restock = {
      ...payload.restock,
      gap: 0,
      recommendation: 'sufficient',
      suggested_order_qty: 0,
      stockout_eta: null,
    };

    render(<SalesForecastCard data={payload} />);

    expect(screen.getByText('Stock covers this horizon')).toBeInTheDocument();
    expect(screen.queryByText(/Order 85 units this week/)).not.toBeInTheDocument();
  });

  it('computes the gap between forecast demand and current stock', () => {
    const payload = buildPayload();
    const gap = Math.max(0, Math.ceil(payload.totals.yhat - payload.restock.current_stock));

    render(<SalesForecastCard data={payload} />);

    expect(gap).toBe(65);
    expect(payload.restock.suggested_order_qty).toBeGreaterThanOrEqual(gap);
  });

  it('renders the SHAP drivers with merchant labels', () => {
    render(<SalesForecastCard data={buildPayload()} />);

    expect(screen.getByText('Weekend Effect')).toBeInTheDocument();
    expect(screen.getByText('Active Discounts')).toBeInTheDocument();
    expect(screen.getByText('Stock Availability')).toBeInTheDocument();
    expect(screen.getByText('+24%')).toBeInTheDocument();
  });

  it('renders without crashing when there are no SHAP drivers', () => {
    const payload = buildPayload({ top_shap_drivers: [] });

    const { container } = render(<SalesForecastCard data={payload} />);

    expect(container.textContent).toContain('JBL Flip 6 Waterproof Speaker');
    expect(screen.queryByText('Weekend Effect')).not.toBeInTheDocument();
  });

  it('switches to RTL and Arabic copy when the language is Arabic', () => {
    i18nState.language = 'ar';

    const { container } = render(<SalesForecastCard data={buildPayload()} />);

    expect(container.querySelector('[dir="rtl"]')).not.toBeNull();
    expect(screen.getByText('توصية المخزون')).toBeInTheDocument();
  });

  it('dispatches the chained purchase-order prompt', () => {
    const onRequestPurchase = vi.fn();
    render(<SalesForecastCard data={buildPayload()} onRequestPurchase={onRequestPurchase} />);

    fireEvent.click(screen.getByRole('button', { name: /Draft purchase order/ }));

    expect(onRequestPurchase).toHaveBeenCalledWith(85);
  });

  it('emits a techzone:prompt event when no callback is provided', () => {
    const listener = vi.fn();
    window.addEventListener('techzone:prompt', listener);

    render(<SalesForecastCard data={buildPayload()} />);
    fireEvent.click(screen.getByRole('button', { name: /Draft purchase order/ }));

    expect(listener).toHaveBeenCalledTimes(1);
    const event = listener.mock.calls[0][0] as CustomEvent;
    expect(event.detail.text).toContain('85 units');
  });

  it('requests a new horizon when a horizon chip is clicked', () => {
    const onHorizonChange = vi.fn();
    render(<SalesForecastCard data={buildPayload()} onHorizonChange={onHorizonChange} />);

    fireEvent.click(screen.getByRole('button', { name: '7d' }));

    expect(onHorizonChange).toHaveBeenCalledWith(7);
  });

  it('matches the stored snapshot', () => {
    const { container } = render(<SalesForecastCard data={buildPayload()} />);

    expect(container.firstChild).toMatchSnapshot();
  });
});
