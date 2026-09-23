"use client";

import { useSearchParams } from "next/navigation";

import { useCheckoutSession } from "@/checkout/providers/checkout-session";

import { YooKassaCheckoutReturnHandler } from "./yookassa-checkout-return-handler";

export function YooKassaCheckoutCompletionHost() {
	const { checkoutId } = useCheckoutSession();
	const searchParams = useSearchParams();

	if (!checkoutId) {
		return null;
	}

	if (searchParams.get("paymentReturn") !== "yookassa") {
		return null;
	}

	return <YooKassaCheckoutReturnHandler checkoutId={checkoutId} />;
}
