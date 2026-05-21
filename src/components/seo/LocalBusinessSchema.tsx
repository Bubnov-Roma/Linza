export const LocalBusinessSchema = () => {
	const jsonLd = {
		"@context": "https://schema.org",
		"@type": "LocalBusiness",
		name: "Linza",
		image: "https://linzarental.ru/og-image.png",
		"@id": "https://linzarental.ru/#localbusiness",
		url: "https://linzarental.ru",
		telephone: "+79277752852",
		priceRange: "$$",
		address: {
			"@type": "PostalAddress",
			streetAddress: "ул. Чапаевская 203A",
			addressLocality: "Самара",
			postalCode: "443010",
			addressCountry: "RU",
		},
		geo: {
			"@type": "GeoCoordinates",
			latitude: 53.199654,
			longitude: 50.103535,
		},
		openingHoursSpecification: {
			"@type": "OpeningHoursSpecification",
			dayOfWeek: [
				"Monday",
				"Tuesday",
				"Wednesday",
				"Thursday",
				"Friday",
				"Saturday",
				"Sunday",
			],
			opens: "10:00",
			closes: "20:00",
		},
	};

	return (
		<script
			type="application/ld+json"
			dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
		/>
	);
};
