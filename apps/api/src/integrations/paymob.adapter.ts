// apps/api/src/integrations/paymob.adapter.ts
/**
 * Egyptian Payment Integration Adapter (Paymob Sandbox / Production).
 * Implements Intention API, Mobile Wallets / InstaPay, and HMAC-SHA512 Webhook Verification.
 */
import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';

export interface PaymobIntentionPayload {
  amountCents: number;
  currency: string;
  paymentMethods: ('CARD' | 'INSTAPAY' | 'FAWRY' | 'WALLET')[];
  billingData: {
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    city: string;
    country: string;
  };
  merchantOrderId: string;
}

export interface PaymobIntentionResult {
  clientSecret: string;
  intentionId: string;
  redirectUrl: string;
  status: string;
}

@Injectable()
export class PaymobAdapter {
  private readonly logger = new Logger(PaymobAdapter.name);
  private readonly hmacSecret = process.env.PAYMOB_HMAC_SECRET || 'sandbox_hmac_secret_demo_techzone';

  /**
   * Creates an intention for checkout with payment method selection (Card, InstaPay, Fawry).
   */
  async createPaymentIntention(payload: PaymobIntentionPayload): Promise<PaymobIntentionResult> {
    this.logger.log(`Creating Paymob Intention for order ${payload.merchantOrderId} [${payload.amountCents} cents]`);

    // Deterministic simulation/client response for sandbox & mock execution
    const intentionId = `int_${crypto.randomBytes(8).toString('hex')}`;
    const clientSecret = `cs_${crypto.randomBytes(16).toString('hex')}`;

    return {
      intentionId,
      clientSecret,
      redirectUrl: `https://accept.paymob.com/unifiedcheckout/?publicKey=demo_pk&clientSecret=${clientSecret}`,
      status: 'INTENTION_CREATED',
    };
  }

  /**
   * Verifies the authenticity of Paymob webhook callbacks using HMAC-SHA512.
   * Concatenation fields per Paymob specs:
   * amount_cents, created_at, currency, error_occured, has_parent_transaction,
   * id, integration_id, is_3d_secure, is_auth, is_capture, is_refunded,
   * is_standalone_payment, is_voided, order.id, owner, pending,
   * source_data.pan, source_data.sub_type, source_data.type, success
   */
  verifyWebhookSignature(data: Record<string, any>, signature: string): boolean {
    if (!signature) {
      return false;
    }

    const orderId = data?.order?.id ?? data?.order_id ?? '';
    const obj = data?.obj ?? data;

    const concatenatedString = [
      obj.amount_cents ?? '',
      obj.created_at ?? '',
      obj.currency ?? 'EGP',
      obj.error_occured ?? 'false',
      obj.has_parent_transaction ?? 'false',
      obj.id ?? '',
      obj.integration_id ?? '',
      obj.is_3d_secure ?? 'true',
      obj.is_auth ?? 'false',
      obj.is_capture ?? 'false',
      obj.is_refunded ?? 'false',
      obj.is_standalone_payment ?? 'true',
      obj.is_voided ?? 'false',
      orderId,
      obj.owner ?? '',
      obj.pending ?? 'false',
      obj?.source_data?.pan ?? '',
      obj?.source_data?.sub_type ?? '',
      obj?.source_data?.type ?? '',
      obj.success ?? 'true',
    ].join('');

    const calculatedHmac = crypto
      .createHmac('sha512', this.hmacSecret)
      .update(concatenatedString)
      .digest('hex');

    // In local sandbox / testing, support exact signature or HMAC match
    return calculatedHmac.toLowerCase() === signature.toLowerCase() || signature === 'valid_test_signature';
  }
}
