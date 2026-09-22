import type { CheckoutLineInput } from "@/gql/graphql";
import type { Product } from "@/ui/components/pdp/gallery-utils";

const FISCAL_TYPE_ATTRIBUTE_SLUG = "fiscal-type";
const FISCAL_TYPE_METADATA_KEY = "fiscal_type";

export function buildGolfArenaCheckoutLine(product: Product, variantId: string): CheckoutLineInput {
	const fiscalTypeAttribute = product.assignedAttributes?.find(
		(assigned) => assigned.attribute.slug === FISCAL_TYPE_ATTRIBUTE_SLUG && "choice" in assigned,
	);

	const fiscalType =
		fiscalTypeAttribute && "choice" in fiscalTypeAttribute ? fiscalTypeAttribute.choice?.slug : undefined;

	return {
		quantity: 1,
		variantId,
		...(fiscalType
			? {
					metadata: [
						{
							key: FISCAL_TYPE_METADATA_KEY,
							value: fiscalType,
						},
					],
				}
			: {}),
	};
}
