const YOOKASSA_TRANSACTION_STORAGE_KEY = "paper:yookassa:transaction";

type StoredYooKassaTransaction = {
	checkoutId: string;
	transactionId: string;
};

export function storeYooKassaTransaction(checkoutId: string, transactionId: string): void {
	if (typeof window === "undefined") {
		return;
	}

	sessionStorage.setItem(
		YOOKASSA_TRANSACTION_STORAGE_KEY,
		JSON.stringify({
			checkoutId,
			transactionId,
		}),
	);
}

export function getYooKassaTransactionId(checkoutId: string): string | null {
	if (typeof window === "undefined") {
		return null;
	}

	const raw = sessionStorage.getItem(YOOKASSA_TRANSACTION_STORAGE_KEY);

	if (!raw) {
		return null;
	}

	try {
		const parsed = JSON.parse(raw) as Partial<StoredYooKassaTransaction>;

		if (
			parsed.checkoutId !== checkoutId ||
			typeof parsed.transactionId !== "string" ||
			!parsed.transactionId
		) {
			return null;
		}

		return parsed.transactionId;
	} catch {
		return null;
	}
}

export function clearYooKassaTransaction(): void {
	if (typeof window === "undefined") {
		return;
	}

	sessionStorage.removeItem(YOOKASSA_TRANSACTION_STORAGE_KEY);
}
