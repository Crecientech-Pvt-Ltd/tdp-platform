import { Image, ImageZoom } from "nextra/components";

export default {
	components: {
		img: ({ alt, ...props }) => (
			<>
				<ImageZoom
					alt={alt}
					style={{ borderRadius: "0.5rem", margin: "0 auto" }}
					{...props}
				/>
				<i style={{ textAlign: "center", display: "block" }}>{alt}</i>
			</>
		),
	},
	head: (
		<>
			<meta charSet="UTF-8" />
			<meta name="viewport" content="width=device-width, initial-scale=1.0" />
			<title>Documentation | Target Discovery Platform</title>
			<meta
				name="description"
				content="Help Manual for Drug Target Discovery Platform for Homosapiens"
			/>
		</>
	),
	logo: (
		<>
			<Image src="/image/logo.png" alt="TDP Logo" width={150} height={150} />
			<span className="ml-2 font-bold">TDP Help Manual</span>
		</>
	),
	logoLink: "/",
	darkMode: true,
	nextThemes: {
		defaultTheme: "light",
	},
	editLink: {
		component: null,
	},
	feedback: {
		content: null,
	},
	color: {
		hue: 180,
		saturation: 50,
		lightness: {
			dark: 60,
			light: 35,
		},
	},
};
