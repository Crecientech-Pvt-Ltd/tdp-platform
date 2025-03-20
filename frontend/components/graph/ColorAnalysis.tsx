"use client";

import { DEFAULT_EDGE_COLOR } from "@/lib/data";
import { useStore } from "@/lib/hooks";
import type {
	EdgeAttributes,
	NodeAttributes,
	OtherSection,
} from "@/lib/interface";
import { useSigma } from "@react-sigma/core";
import { scaleLinear } from "d3-scale";
import { useEffect, useState } from "react";

export function ColorAnalysis() {
	const selectedRadioNodeColor = useStore(
		(state) => state.selectedRadioNodeColor,
	);
	const selectedNodeColorProperty = useStore(
		(state) => state.selectedNodeColorProperty,
	);
	const graph = useSigma<NodeAttributes, EdgeAttributes>().getGraph();
	const universalData = useStore((state) => state.universalData);
	const defaultNodeColor = useStore((state) => state.defaultNodeColor);
	const diseaseName = useStore((state) => state.diseaseName);
	const showEdgeColor = useStore((state) => state.showEdgeColor);
	const radioOptions = useStore((state) => state.radioOptions);
	const [minScore, setMinScore] = useState(0);
	const edgeOpacity = useStore((state) => state.edgeOpacity);

	useEffect(() => {
		setMinScore(
			Number(
				JSON.parse(localStorage.getItem("graphConfig") ?? "{}").minScore,
			) ?? 0,
		);
	}, []);

	// biome-ignore lint/correctness/useExhaustiveDependencies: not required
	useEffect(() => {
		if (!graph) return;
		if (showEdgeColor) {
			const colorScale = scaleLinear<string>([minScore, 1], ["yellow", "red"]);
			graph.updateEachEdgeAttributes((_edge, attr) => {
				if (attr.score)
					attr.color = colorScale(attr.score)
						.replace(/^rgb/, "rgba")
						.replace(/\)/, `, ${edgeOpacity})`);
				return attr;
			});
		} else {
			const opacityChangedColor = DEFAULT_EDGE_COLOR.replace(
				/[\d.]+\)$/,
				`${edgeOpacity})`,
			);
			graph.updateEachEdgeAttributes((_edge, attr) => {
				attr.color = opacityChangedColor;
				return attr;
			});
		}
	}, [showEdgeColor, edgeOpacity]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: not required
	useEffect(() => {
		if (!selectedRadioNodeColor && graph) {
			useStore.setState({ selectedNodeColorProperty: "" });
			graph.updateEachNodeAttributes((_node, attr) => {
				attr.color = undefined;
				return attr;
			});
		}
	}, [selectedRadioNodeColor]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: not required
	useEffect(() => {
		if (!selectedNodeColorProperty || !graph || !selectedRadioNodeColor) return;
		const isUserProperty =
			typeof selectedNodeColorProperty === "string" &&
			radioOptions.user[selectedRadioNodeColor].includes(
				selectedNodeColorProperty,
			);
		const userOrDiseaseIdentifier = isUserProperty ? "user" : diseaseName;
		const userOrCommonIdentifier = isUserProperty ? "user" : "common";
		if (
			selectedRadioNodeColor === "GDA" &&
			typeof selectedNodeColorProperty === "string"
		) {
			const minMax = Object.values(universalData).reduce(
				(acc, cur) => {
					const valString = (cur[userOrDiseaseIdentifier] as OtherSection)
						.GDA?.[selectedNodeColorProperty];
					if (!valString) return acc;
					const value = +valString;
					return [Math.min(acc[0], value), Math.max(acc[1], value)];
				},
				[1, 0],
			);
			const colorScale = scaleLinear<string>(minMax, [defaultNodeColor, "red"]);
			graph.updateEachNodeAttributes((node, attr) => {
				const val = +(
					universalData[node]?.[userOrDiseaseIdentifier] as OtherSection
				)?.[selectedRadioNodeColor][selectedNodeColorProperty];
				if (!Number.isNaN(val)) attr.color = colorScale(val);
				else attr.color = undefined;
				return attr;
			});
		} else if (
			selectedRadioNodeColor === "LogFC" &&
			typeof selectedNodeColorProperty === "string"
		) {
			const [min, max] = Object.values(universalData).reduce(
				(acc, cur) => {
					const valString = (cur[userOrDiseaseIdentifier] as OtherSection)
						.LogFC?.[selectedNodeColorProperty];
					if (!valString) return acc;
					const value = +valString;
					return [Math.min(acc[0], value), Math.max(acc[1], value)];
				},
				[Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY],
			);

			const colorScale = scaleLinear<string>(
				[min, 0, max],
				["green", "#E2E2E2", "red"],
			);
			graph.updateEachNodeAttributes((node, attr) => {
				const val = +(
					universalData[node]?.[userOrDiseaseIdentifier] as OtherSection
				)?.[selectedRadioNodeColor][selectedNodeColorProperty];
				if (!Number.isNaN(val)) attr.color = colorScale(val);
				else attr.color = undefined;
				return attr;
			});
		} else if (
			selectedRadioNodeColor === "GWAS" &&
			typeof selectedNodeColorProperty === "string"
		) {
			const [min, max] = Object.values(universalData).reduce(
				(acc, cur) => {
					const valString = (cur[userOrDiseaseIdentifier] as OtherSection)
						.GWAS?.[selectedNodeColorProperty];
					if (!valString) return acc;
					const value = +valString;
					return [Math.min(acc[0], value), Math.max(acc[1], value)];
				},
				[1, -1],
			);
			const colorScale = scaleLinear<string>(
				[min, 0, max],
				["green", defaultNodeColor, "red"],
			);
			graph.updateEachNodeAttributes((node, attr) => {
				const val = +(
					universalData[node]?.[userOrDiseaseIdentifier] as OtherSection
				)?.[selectedRadioNodeColor][selectedNodeColorProperty];
				if (!Number.isNaN(val)) attr.color = colorScale(val);
				else attr.color = undefined;
				return attr;
			});
		} else if (
			selectedRadioNodeColor === "Pathway" &&
			typeof selectedNodeColorProperty === "string"
		) {
			// ***************** Multiselect code *********
			// const propertyArray = Array.from(selectedNodeColorProperty);
			// const userPathwayArray = radioOptions.user.Pathway;
			// graph.updateEachNodeAttributes((node, attr) => {
			//   attr.color = propertyArray.some(
			//     property => +universalData[node]?.[userPathwayArray.includes(property) ? 'user' : 'common'].Pathway[property],
			//   )
			//     ? 'red'
			//     : defaultNodeColor;
			//   return attr;
			// });
			// ******************************************

			graph.updateEachNodeAttributes((node, attr) => {
				attr.color =
					Number.parseInt(
						universalData[node]?.[userOrCommonIdentifier].Pathway[
							selectedNodeColorProperty
						] ?? 0,
					) === 1
						? "red"
						: defaultNodeColor;
				return attr;
			});
		} else if (
			selectedRadioNodeColor === "Druggability" &&
			typeof selectedNodeColorProperty === "string"
		) {
			const minMax = Object.values(universalData).reduce(
				(acc, cur) => {
					const valString =
						cur[userOrCommonIdentifier].Druggability[selectedNodeColorProperty];
					if (!valString) return acc;
					const value = +valString;
					return [Math.min(acc[0], value), Math.max(acc[1], value)];
				},
				[1, 0],
			);
			const colorScale = scaleLinear<string>(minMax, [defaultNodeColor, "red"]);
			graph.updateEachNodeAttributes((node, attr) => {
				const val =
					+universalData[node]?.[userOrCommonIdentifier].Druggability[
						selectedNodeColorProperty
					];
				if (!Number.isNaN(val)) attr.color = colorScale(val);
				else attr.color = undefined;
				return attr;
			});
		} else if (
			selectedRadioNodeColor === "TE" &&
			typeof selectedNodeColorProperty === "string"
		) {
			// ***************** Multiselect code *********
			// const propertyArray = Array.from(selectedNodeColorProperty);
			// const userTEArray = radioOptions.user.TE;
			// const minMax = Object.values(universalData).reduce(
			//   (acc, cur) => {
			//     const value = propertyArray.reduce((acc2, property) => {
			//       const val = +cur[userTEArray.includes(property) ? 'user' : 'common'].TE[property];
			//       if (Number.isNaN(val)) return acc2;
			//       return Math.max(acc2, val);
			//     }, Number.NEGATIVE_INFINITY);
			//     return [Math.min(acc[0], value), Math.max(acc[1], value)];
			//   },
			//   [Number.POSITIVE_INFINITY, 0],
			// );
			// const colorScale = scaleLinear<string>(minMax, [defaultNodeColor, 'red']);
			// graph.updateEachNodeAttributes((node, attr) => {
			//   const val = propertyArray.reduce((acc, property) => {
			//     const value = +universalData[node]?.[userTEArray.includes(property) ? 'user' : 'common'].TE[property];
			//     if (Number.isNaN(value)) return acc;
			//     return Math.max(acc, value);
			//   }, Number.NEGATIVE_INFINITY);
			//   if (Number.isFinite(val)) attr.color = colorScale(val);
			//   else attr.color = undefined;
			//   return attr;
			// });
			// ****************************************

			const minMax = Object.values(universalData).reduce(
				(acc, cur) => {
					const valString =
						cur?.[userOrCommonIdentifier].TE[selectedNodeColorProperty];
					if (!valString) return acc;
					const value = Number.parseFloat(valString);
					return [Math.min(acc[0], value), Math.max(acc[1], value)];
				},
				[Number.POSITIVE_INFINITY, 0],
			);
			const colorScale = scaleLinear<string>(minMax, [defaultNodeColor, "red"]);
			graph.updateEachNodeAttributes((node, attr) => {
				const val = Number.parseFloat(
					universalData[node]?.[userOrCommonIdentifier].TE[
						selectedNodeColorProperty
					] ?? Number.NaN,
				);
				if (!Number.isNaN(val)) attr.color = colorScale(val);
				else attr.color = undefined;
				return attr;
			});
		} else if (
			selectedRadioNodeColor === "Custom_Color" &&
			typeof selectedNodeColorProperty === "string"
		) {
			graph.updateEachNodeAttributes((node, attr) => {
				attr.color =
					universalData[node]?.[userOrCommonIdentifier].Custom_Color[
						selectedNodeColorProperty
					] || defaultNodeColor;
				return attr;
			});
		} else if (
			selectedRadioNodeColor === "Database" &&
			typeof selectedNodeColorProperty === "string"
		) {
			graph.updateEachNodeAttributes((node, attr) => {
				const val =
					+universalData[node]?.[userOrCommonIdentifier].Database[
						selectedNodeColorProperty
					];
				attr.color = val ? "red" : defaultNodeColor;
				return attr;
			});
		}
	}, [selectedNodeColorProperty, graph, universalData]);

	return null;
}
