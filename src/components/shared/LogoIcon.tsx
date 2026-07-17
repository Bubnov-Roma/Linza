import style from "@/styles/components/logo.module.css";

export const LogoIcon = () => {
	return (
		<div className={`${style["animated-logo-container"]} h-6 w-6`}>
			<svg
				width="145"
				height="200"
				viewBox="0 0 145 200"
				xmlns="http://www.w3.org/2000/svg"
			>
				<defs>
					<linearGradient id="rainbow-flow" x1="0%" y1="0%" x2="200%" y2="0%">
						<stop offset="0%" stop-color="#ff0000"></stop>
						<stop offset="14.2%" stop-color="#ff7f00"></stop>
						<stop offset="28.4%" stop-color="#ffff00"></stop>
						<stop offset="42.6%" stop-color="#00ff00"></stop>
						<stop offset="56.8%" stop-color="#0000ff"></stop>
						<stop offset="71%" stop-color="#4b0082"></stop>
						<stop offset="85.2%" stop-color="#8b00ff"></stop>
						<stop offset="100%" stop-color="#ff0000"></stop>
					</linearGradient>
				</defs>

				<g fill-rule="evenodd">
					<path
						className={`${style["logo-part"]} ${style["fade-in-1"]}`}
						fill="url(#rainbow-flow)"
						d="M26.9,0 C26.9,0 -3.7,43.3 0.3,103.3 C3.3,148.8 26.9,191.4 26.9,191.4 L0.3,103.3 L26.9,0 Z"
					/>

					<path
						className={`${style["logo-part"]} ${style["fade-in-2"]}`}
						fill="url(#rainbow-flow)"
						d="M75.8,0 C75.8,0 48.1,37.4 50.3,100 C52.1,151.6 75.8,191.4 75.8,191.4 L50.3,100 L75.8,0 Z"
					/>

					<path
						className={`${style["logo-part"]} ${style["fade-in-3"]}`}
						fill="url(#rainbow-flow)"
						d="M144.8,100 C144.8,155.2 120.8,200 91.2,200 L118.6,100 L91.2,0 C120.8,0 144.8,44.8 144.8,100 Z"
					/>
				</g>
			</svg>
		</div>
	);
};
