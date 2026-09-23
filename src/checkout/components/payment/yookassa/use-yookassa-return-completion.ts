"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";

import { getCheckoutTransport } from "@/checkout/lib/checkout-transport";
import {
	clearPaymentCompleting,
	markPaymentCompleting,
	stashPaymentCompletionError,
} from "@/checkout/lib/payment/checkout-payment-completion";
import { isCheckoutReadyToComplete } from "@/checkout/lib/payment/checkout-payment-status";
import { finalizeCheckoutOrder } from "@/checkout/lib/payment/finalize-checkout-order";
import {
	clearYooKassaTransaction,
	getYooKassaTransactionId,
} from "@/checkout/lib/payment/yookassa-transaction-storage";
import { updateCheckoutQuery } from "@/checkout/lib/checkout-search-params";
import { rethrowNextInternalError } from "@/checkout/lib/rethrow-next-internal-error";
import { useCheckoutPaymentMessages } from "@/checkout/hooks/use-checkout-payment-messages";

type Params = {
	checkoutId: string;
	onError: (message: string) => void;
};

const POLL_ATTEMPTS = 12;
const POLL_DELAY_MS = 1000;

function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

export function useYooKassaReturnCompletion({ checkoutId, onError }: Params) {
	const searchParams = useSearchParams();
	const paymentMessages = useCheckoutPaymentMessages();

	const attemptedRef = useRef(false);
	const processingRef = useRef(false);

	useEffect(() => {
		if (searchParams.get("paymentReturn") !== "yookassa") {
			return;
		}

		if (attemptedRef.current || processingRef.current) {
			return;
		}

		attemptedRef.current = true;
		processingRef.current = true;

		markPaymentCompleting(checkoutId);

		const finish = async () => {
			let keepProcessingLock = false;

			try {
				const transactionId = getYooKassaTransactionId(checkoutId);

				// Ask Saleor to reconcile the transaction with
				// the YooKassa App immediately. The provider
				// webhook remains the asynchronous fallback.
				if (transactionId) {
					try {
						await getCheckoutTransport().processTransaction({
							id: transactionId,
						});
					} catch (error) {
						rethrowNextInternalError(error);

						console.error("YooKassa transaction reconciliation failed:", error);
					}
				}

				for (let attempt = 0; attempt < POLL_ATTEMPTS; attempt += 1) {
					const syncResult = await getCheckoutTransport().fetchCheckout(checkoutId);

					if (syncResult.ok && syncResult.checkout && isCheckoutReadyToComplete(syncResult.checkout)) {
						clearYooKassaTransaction();

						updateCheckoutQuery({
							paymentReturn: null,
						});

						const completeResult = await finalizeCheckoutOrder(checkoutId, syncResult.checkout.channel.slug);

						if (!completeResult.ok) {
							stashPaymentCompletionError(completeResult.error);
							onError(completeResult.error);
							return;
						}

						keepProcessingLock = true;
						return;
					}

					if (attempt < POLL_ATTEMPTS - 1) {
						await sleep(POLL_DELAY_MS);
					}
				}

				stashPaymentCompletionError(paymentMessages.verificationUnavailable);

				onError(paymentMessages.verificationUnavailable);
			} catch (error) {
				rethrowNextInternalError(error);

				console.error("YooKassa return completion failed:", error);

				stashPaymentCompletionError(paymentMessages.verificationUnavailable);

				onError(paymentMessages.verificationUnavailable);
			} finally {
				if (!keepProcessingLock) {
					processingRef.current = false;
					clearPaymentCompleting();
				}
			}
		};

		void finish();
	}, [checkoutId, onError, paymentMessages, searchParams]);
}
