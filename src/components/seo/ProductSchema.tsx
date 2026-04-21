import type { ProductSchemaProps } from "@/types";

export const ProductSchema = ({
	name,
	description,
	image,
	sku,
	price,
	priceCurrency,
	url,
	availability,
}: ProductSchemaProps) => {
	const jsonLd = {
		"@context": "https://schema.org",
		"@type": "Product",
		name,
		description,
		image,
		sku,
		offers: {
			"@type": "Offer",
			url,
			priceCurrency,
			price,
			availability,
			valueAddedTaxIncluded: true,
		},
	};

	return (
		<script
			type="application/ld+json"
			dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
		/>
	);
};
