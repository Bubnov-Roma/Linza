export interface ProductSchemaProps {
	name: string;
	description: string;
	image: string;
	sku: string;
	price: number;
	priceCurrency: string;
	url: string;
	availability: "https://schema.org/InStock" | "https://schema.org/OutOfStock";
}
