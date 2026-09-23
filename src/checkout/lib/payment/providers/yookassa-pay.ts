import { getCheckoutTransport } from "@/checkout/lib/checkout-transport";
import { getTransactionInitializeError, type CheckoutGatewayMessages } from "@/checkout/lib/payment-gateways";

import { type PaymentContext, type PaymentResult } from "../types";

function getRedirectUrl(data: unknown): string | null {
	if (!data || typeof data !== "object") {
		return null;
	}

	const payload = data as Record<string, unknown>;

	const candidate = payload.redirectUrl ?? payload.externalUrl ?? payload.confirmationUrl;

	if (typeof candidate !== "string" || !candidate.trim()) {
		return null;
	}

	try {
		const url = new URL(candidate);

		if (url.protocol !== "https:") {
			return null;
		}

		return url.toString();
	} catch {
		return null;
	}
}

/**
 * YooKassa is a redirect-based Saleor Transaction API gateway.
 *
 * Paper talks only to Saleor. Saleor calls the YooKassa App through
 * TRANSACTION_INITIALIZE_SESSION. The app creates the YooKassa payment
 * and returns the hosted confirmation URL in transactionInitialize.data.
 *
 * Checkout completion happens only after the customer returns and
 * Saleor confirms that the checkout is paid.
 */
export async function executeYooKassaPayment(
	context: PaymentContext,
	gatewayId: string,
	messages: CheckoutGatewayMessages,
): Promise<PaymentResult> {
	const initResult = await getCheckoutTransport().initializeTransaction({
		checkoutId: context.checkoutId,
		amount: context.amount,
		paymentGateway: {
			id: gatewayId,
		},
	});

	if (!initResult.ok) {
		console.error("YooKassa payment initialization error:", initResult.error);

		return {
			ok: false,
			error: initResult.error || messages.paymentTryAgain,
			errorKey: "payment",
		};
	}

	const transactionError = getTransactionInitializeError(initResult.data, messages);

	if (transactionError) {
		console.error("YooKassa transaction initialize failed:", initResult.data);

		return {
			ok: false,
			error: transactionError,
			errorKey: "payment",
		};
	}

	const redirectUrl = getRedirectUrl(initResult.data?.data);

	if (!redirectUrl) {
		console.error("YooKassa transaction did not return a redirect URL:", initResult.data);

		return {
			ok: false,
			error: messages.paymentInitFailed,
			errorKey: "payment",
		};
	}

	const transactionId = initResult.data?.transaction?.id;

	if (!transactionId) {
		return {
			ok: false,
			error: messages.paymentInitFailed,
			errorKey: "payment",
		};
	}

	return {
		ok: true,
		redirectUrl,
		transactionId,
	};
}
