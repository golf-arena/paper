"use client";

import { type FC } from "react";

import { useCheckoutPaymentReturnError } from "@/checkout/providers/checkout-payment-return-error";

import { useYooKassaReturnCompletion } from "./use-yookassa-return-completion";

type Props = {
	checkoutId: string;
};

export const YooKassaCheckoutReturnHandler: FC<Props> = ({ checkoutId }) => {
	const { setError } = useCheckoutPaymentReturnError();

	useYooKassaReturnCompletion({
		checkoutId,
		onError: setError,
	});

	return null;
};
