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
import { CategoryCard, CategoryCardPayload } from '../gen-ui/CategoryCard';
import { ProductRecommendationCard, ProductRecommendationPayload } from '../gen-ui/ProductRecommendationCard';
import { OrderTrackingCard, OrderTrackingPayload } from '../gen-ui/OrderTrackingCard';
import { PolicyCard, PolicyCardPayload } from '../gen-ui/PolicyCard';
import { HumanHandoffCard, HumanHandoffPayload } from '../gen-ui/HumanHandoffCard';

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
  | 'category_card'
  | 'categories_list_card'
  | 'product_recommendation_card'
  | 'products_list'
  | 'products_list_card'
  | 'product_search'
  | 'order_tracking_card'
  | 'order_status_card'
  | 'order_status'
  | 'policy_card'
  | 'policy_info'
  | 'shipping_policy'
  | 'return_policy'
  | 'human_handoff_card'
  | 'support_escalation'
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

interface ErrorBoundaryProps {
  children: React.ReactNode;
  cardType: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class GenUiErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: any) {
    console.warn(`[GenUiRegistry] Card render failed for ${this.props.cardType}:`, error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-3 my-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2">
          <span>⚠️ تعذر تحميل بطاقة البيانات التفاعلية ({this.props.cardType}). تفاصيل الرد متاحة في الرسالة أعلاه.</span>
        </div>
      );
    }
    return this.props.children;
  }
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
  const safePayload = (payload?.payload || payload || {}) as any;

  const renderCard = () => {
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
      case 'inventory_alerts_list':
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

      case 'category_card':
      case 'categories_list_card':
        return (
          <CategoryCard
            payload={safePayload as CategoryCardPayload}
            onSendMessage={onSendMessage}
          />
        );

      case 'product_recommendation_card':
      case 'products_list':
      case 'products_list_card':
      case 'product_search':
        return <ProductRecommendationCard data={safePayload as ProductRecommendationPayload} />;

      case 'order_tracking_card':
      case 'order_status':
      case 'order_status_card':
        return <OrderTrackingCard data={safePayload as OrderTrackingPayload} />;

      case 'policy_card':
      case 'policy_info':
      case 'shipping_policy':
      case 'return_policy':
        return <PolicyCard data={safePayload as PolicyCardPayload} />;

      case 'human_handoff_card':
      case 'support_escalation':
        return <HumanHandoffCard data={safePayload as HumanHandoffPayload} />;

      default:
        return null;
    }
  };

  const card = renderCard();
  if (!card) return null;

  return (
    <GenUiErrorBoundary cardType={cardType}>
      {card}
    </GenUiErrorBoundary>
  );
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
  product_recommendation_card: 'ProductRecommendationCard',
  order_tracking_card: 'OrderTrackingCard',
  policy_card: 'PolicyCard',
  human_handoff_card: 'HumanHandoffCard',
};
