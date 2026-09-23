import { describe, expect, it } from "vitest";

import { resolvePaymentProvider } from "@/checkout/lib/payment/resolve-provider";

import { YOOKASSA_GATEWAY_ID, findYooKassaGateway, isYooKassaGateway } from "./yookassa";

describe("YooKassa payment provider", () => {
	it("recognizes the YooKassa gateway", () => {
		expect(
			isYooKassaGateway({
				id: YOOKASSA_GATEWAY_ID,
				name: "YooKassa Gateway",
			}),
		).toBe(true);

		expect(
			isYooKassaGateway({
				id: "mirumee.payments.dummy",
				name: "Dummy",
			}),
		).toBe(false);
	});

	it("finds YooKassa in available gateways", () => {
		const gateway = findYooKassaGateway([
			{
				id: "saleor.io.gift-card-payment-gateway",
				name: "Gift Card Payment Gateway",
			},
			{
				id: YOOKASSA_GATEWAY_ID,
				name: "YooKassa Gateway",
			},
		]);

		expect(gateway?.id).toBe(YOOKASSA_GATEWAY_ID);
	});

	it("resolves YooKassa as a server-submit provider", () => {
		const provider = resolvePaymentProvider([
			{
				id: "mirumee.payments.dummy",
				name: "Dummy",
			},
			{
				id: YOOKASSA_GATEWAY_ID,
				name: "YooKassa Gateway",
			},
			{
				id: "saleor.io.gift-card-payment-gateway",
				name: "Gift Card Payment Gateway",
			},
		]);

		expect(provider).toEqual({
			type: "yookassa",
			gateway: {
				id: YOOKASSA_GATEWAY_ID,
				name: "YooKassa Gateway",
			},
			submitMode: "server",
		});
	});
});
