import { beforeEach, describe, expect, it, vi } from "vitest";

import { setCheckoutTransport, type CheckoutTransport } from "@/checkout/lib/checkout-transport";
import { buildCheckoutGatewayMessages } from "@/checkout/lib/payment/gateway-messages";

import { executeYooKassaPayment } from "./yookassa-pay";
import { YOOKASSA_GATEWAY_ID } from "./yookassa";

const messages = buildCheckoutGatewayMessages((key) => key);

const initializeTransaction = vi.fn<CheckoutTransport["initializeTransaction"]>();

const completeCheckout = vi.fn<CheckoutTransport["completeCheckout"]>();

const fakeTransport: CheckoutTransport = {
	fetchCheckout: vi.fn(),
	updateBillingAddress: vi.fn(),
	attachCustomer: vi.fn(),
	initializePaymentGateways: vi.fn(),
	initializeTransaction,
	processTransaction: vi.fn(),
	completeCheckout,
};

describe("executeYooKassaPayment", () => {
	beforeEach(() => {
		initializeTransaction.mockReset();
		completeCheckout.mockReset();
		setCheckoutTransport(fakeTransport);
	});

	it("returns the YooKassa redirect URL without completing checkout", async () => {
		const redirectUrl = "https://yoomoney.ru/checkout/payments/v2/contract/example";

		initializeTransaction.mockResolvedValue({
			ok: true,
			data: {
				transactionEvent: {
					type: "CHARGE_ACTION_REQUIRED",
					message: "Redirect required",
				},
				transaction: {
					id: "tx-yookassa-1",
				},
				data: {
					redirectUrl,
				},
				errors: [],
			},
		});

		const result = await executeYooKassaPayment(
			{
				checkoutId: "checkout-1",
				amount: 1500,
			},
			YOOKASSA_GATEWAY_ID,
			messages,
		);

		expect(result).toEqual({
			ok: true,
			redirectUrl,
			transactionId: "tx-yookassa-1",
		});

		expect(initializeTransaction).toHaveBeenCalledWith({
			checkoutId: "checkout-1",
			amount: 1500,
			paymentGateway: {
				id: YOOKASSA_GATEWAY_ID,
			},
		});

		expect(completeCheckout).not.toHaveBeenCalled();
	});

	it("accepts externalUrl returned by the gateway", async () => {
		const redirectUrl = "https://yoomoney.ru/checkout/payments/v2/contract/example-two";

		initializeTransaction.mockResolvedValue({
			ok: true,
			data: {
				transactionEvent: {
					type: "CHARGE_ACTION_REQUIRED",
					message: "Redirect required",
				},
				transaction: {
					id: "tx-yookassa-2",
				},
				data: {
					externalUrl: redirectUrl,
				},
				errors: [],
			},
		});

		const result = await executeYooKassaPayment(
			{
				checkoutId: "checkout-2",
				amount: 500,
			},
			YOOKASSA_GATEWAY_ID,
			messages,
		);

		expect(result).toEqual({
			ok: true,
			redirectUrl,
			transactionId: "tx-yookassa-2",
		});
	});

	it("fails safely when Saleor returns no redirect URL", async () => {
		initializeTransaction.mockResolvedValue({
			ok: true,
			data: {
				transactionEvent: {
					type: "CHARGE_ACTION_REQUIRED",
					message: "Redirect required",
				},
				transaction: {
					id: "tx-yookassa-3",
				},
				data: {},
				errors: [],
			},
		});

		const result = await executeYooKassaPayment(
			{
				checkoutId: "checkout-3",
				amount: 250,
			},
			YOOKASSA_GATEWAY_ID,
			messages,
		);

		expect(result).toEqual({
			ok: false,
			error: "paymentInitFailed",
			errorKey: "payment",
		});

		expect(completeCheckout).not.toHaveBeenCalled();
	});
});
