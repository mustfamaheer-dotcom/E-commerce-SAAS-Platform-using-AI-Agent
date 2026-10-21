// apps/web/src/components/chat/GenUiRegistry.tsx
import React from 'react';
import { AnalyticsResultCard, AnalyticsResultPayload } from '../gen-ui/AnalyticsResultCard';
import { BulkPricePreviewCard, BulkPricePreviewPayload } from '../gen-ui/BulkPricePreviewCard';
import { InventoryAlertsList, InventoryAlertData } from '../gen-ui/InventoryAlertsList';
import { ProductUpdatePreviewCard, ProductUpdateDiff } from '../gen-ui/ProductUpdatePreviewCard';
import { SalesForecastCard, SalesForecastPayload } from '../gen-ui/SalesForecastCard';
import { StoreCreationPreviewCard, StorePreviewData } from '../gen-ui/StoreCreationPreviewCard';

export type GenUiCardType =
  | 'analytics_result'
  | 'sales_forecast'
  | 'bulk_price_preview'
  | 'product_update_preview'
  | 'inventory_alerts'
  | 'store_creation_preview';

export interface GenUiRegistryProps {
  cardType: GenUiCardType | string;
  payload: Record<string, any>;
  onApprove?: (actionId: string) => void;
  onCancel?: (actionId: string) => void;
  onReorder?: (sku: string, quantity: number) => void;
  onHorizonChange?: (horizon: 7 | 14 | 30) => void;
  onRequestPurchase?: (quantity: number) => void;
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
  isSubmitting = false,
}) => {
  switch (cardType) {
    case 'sales_forecast':
      return (
        <SalesForecastCard
          data={payload as SalesForecastPayload}
          onHorizonChange={onHorizonChange}
          onRequestPurchase={onRequestPurchase}
        />
      );

    case 'analytics_result':
      return <AnalyticsResultCard data={payload as AnalyticsResultPayload} />;

    case 'bulk_price_preview': {
      const card = payload as BulkPricePreviewPayload;
      return (
        <BulkPricePreviewCard
          payload={card}
          onApprove={(actionId) => onApprove?.(actionId)}
          onCancel={(actionId) => onCancel?.(actionId)}
          isSubmitting={isSubmitting}
        />
      );
    }

    case 'product_update_preview': {
      const card = payload as ProductUpdateDiff;
      return (
        <ProductUpdatePreviewCard
          diff={card}
          onApprove={(actionId) => onApprove?.(actionId)}
          onCancel={(actionId) => onCancel?.(actionId)}
        />
      );
    }

    case 'inventory_alerts':
      return (
        <InventoryAlertsList
          alerts={(payload.alerts || payload) as InventoryAlertData[]}
          onReorderClick={onReorder}
        />
      );

    case 'store_creation_preview':
      return (
        <StoreCreationPreviewCard
          data={payload as StorePreviewData}
          onConfirm={() => onApprove?.('store_creation')}
          onCancel={() => onCancel?.('store_creation')}
          isLoading={isSubmitting}
        />
      );

    default:
      return null;
  }
};

export const GEN_UI_COMPONENTS: Record<string, string> = {
  sales_forecast: 'SalesForecastCard',
  analytics_result: 'AnalyticsResultCard',
  bulk_price_preview: 'BulkPricePreviewCard',
  product_update_preview: 'ProductUpdatePreviewCard',
  inventory_alerts: 'InventoryAlertsList',
  store_creation_preview: 'StoreCreationPreviewCard',
};
