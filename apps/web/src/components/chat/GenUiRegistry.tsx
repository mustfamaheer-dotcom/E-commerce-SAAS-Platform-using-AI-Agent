// apps/web/src/components/chat/GenUiRegistry.tsx
import React from 'react';
import { AnalyticsDashboardCard, AnalyticsDashboardPayload } from '../gen-ui/AnalyticsDashboardCard';
import { ClarificationCard, ClarificationPayload } from '../gen-ui/ClarificationCard';
import { BulkPricePreviewCard, BulkPricePreviewPayload } from '../gen-ui/BulkPricePreviewCard';
import { InventoryAlertsList, InventoryAlertData } from '../gen-ui/InventoryAlertsList';
import { ProductUpdatePreviewCard, ProductUpdateDiff } from '../gen-ui/ProductUpdatePreviewCard';
import { SalesForecastCard, SalesForecastPayload } from '../gen-ui/SalesForecastCard';
import { StoreCreationPreviewCard, StorePreviewData } from '../gen-ui/StoreCreationPreviewCard';
import { CustomerSegmentsCard, CustomerSegmentsPayload } from '../gen-ui/CustomerSegmentsCard';
import { PromotionApprovalCard, PromotionApprovalPayload } from '../gen-ui/PromotionApprovalCard';

export type GenUiCardType =
  | 'analytics_dashboard'
  | 'analytics_card'
  | 'analytics_result'
  | 'clarification'
  | 'sales_forecast'
  | 'bulk_price_preview'
  | 'product_update_preview'
  | 'price_card'
  | 'inventory_alerts'
  | 'inventory_card'
  | 'store_creation_preview'
  | 'customer_segments'
  | 'promotion_approval'
  | 'coupon_card'
  | string;

export interface GenUiRegistryProps {
  cardType: GenUiCardType;
  payload: Record<string, any>;
  onApprove?: (actionId: string) => void;
  onCancel?: (actionId: string) => void;
  onReorder?: (sku: string, quantity: number) => void;
  onHorizonChange?: (horizon: 7 | 14 | 30) => void;
  onRequestPurchase?: (quantity: number) => void;
  onCreatePromo?: (segment: string) => void;
  onSendMessage?: (msg: string) => void;
  isSubmitting?: boolean;
}

export const GenUiRegistry: React.FC<GenUiRegistryProps> = ({
  cardType,
  payload,
  onApprove,
  onCancel,
  onReorder,
  onHorizonChange,
  onRequestPurchase,
  onCreatePromo,
  onSendMessage,
  isSubmitting = false,
}) => {
  const safePayload = (payload?.payload || payload) as any;

  switch (cardType) {
    case 'analytics_dashboard':
    case 'analytics_card':
    case 'analytics_result':
      return <AnalyticsDashboardCard data={safePayload as AnalyticsDashboardPayload} />;

    case 'clarification':
      return (
        <ClarificationCard
          data={safePayload as ClarificationPayload}
          onSubmit={(msg) => onSendMessage?.(msg)}
        />
      );

    case 'sales_forecast':
    case 'forecast_card':
      return (
        <SalesForecastCard
          data={safePayload as SalesForecastPayload}
          onHorizonChange={onHorizonChange}
          onRequestPurchase={onRequestPurchase}
        />
      );

    case 'bulk_price_preview':
      return (
        <BulkPricePreviewCard
          payload={safePayload as BulkPricePreviewPayload}
          onApprove={(actionId) => onApprove?.(actionId)}
          onCancel={(actionId) => onCancel?.(actionId)}
          isSubmitting={isSubmitting}
        />
      );

    case 'product_update_preview':
    case 'price_card':
      return (
        <ProductUpdatePreviewCard
          diff={safePayload as ProductUpdateDiff}
          onApprove={(actionId) => onApprove?.(actionId)}
          onCancel={(actionId) => onCancel?.(actionId)}
        />
      );

    case 'inventory_alerts':
    case 'inventory_card':
      return (
        <InventoryAlertsList
          alerts={(safePayload.alerts || safePayload) as InventoryAlertData[]}
          onReorderClick={onReorder}
        />
      );

    case 'store_creation_preview':
      return (
        <StoreCreationPreviewCard
          data={safePayload as StorePreviewData}
          onConfirm={() => onApprove?.('store_creation')}
          onCancel={() => onCancel?.('store_creation')}
          isLoading={isSubmitting}
        />
      );

    case 'customer_segments':
      return (
        <CustomerSegmentsCard
          data={safePayload as CustomerSegmentsPayload}
          onCreatePromo={onCreatePromo}
        />
      );

    case 'promotion_approval':
    case 'coupon_card':
      return (
        <PromotionApprovalCard
          data={safePayload as PromotionApprovalPayload}
          onConfirm={(actionId) => onApprove?.(actionId)}
          onCancel={(actionId) => onCancel?.(actionId)}
        />
      );

    default:
      return null;
  }
};

export const GEN_UI_COMPONENTS: Record<string, string> = {
  analytics_dashboard: 'AnalyticsDashboardCard',
  clarification: 'ClarificationCard',
  sales_forecast: 'SalesForecastCard',
  analytics_result: 'AnalyticsResultCard',
  bulk_price_preview: 'BulkPricePreviewCard',
  product_update_preview: 'ProductUpdatePreviewCard',
  inventory_alerts: 'InventoryAlertsList',
  store_creation_preview: 'StoreCreationPreviewCard',
  customer_segments: 'CustomerSegmentsCard',
  promotion_approval: 'PromotionApprovalCard',
};
