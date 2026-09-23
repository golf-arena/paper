import { type PaymentGatewayLike } from "../types";

export const YOOKASSA_GATEWAY_ID = "saleor.io.yookassa-gateway";

export function isYooKassaGateway(gateway: PaymentGatewayLike): boolean {
	return gateway.id === YOOKASSA_GATEWAY_ID;
}

export function findYooKassaGateway(
	gateways: ReadonlyArray<PaymentGatewayLike> | null | undefined,
): PaymentGatewayLike | undefined {
	return gateways?.find(isYooKassaGateway);
}
