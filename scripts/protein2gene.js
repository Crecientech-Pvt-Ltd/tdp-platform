import { createReadStream, createWriteStream, existsSync } from "fs";
import chalk from "chalk";
import csv from "csv-parser";
import inquirer from "inquirer";
import yargs from "yargs";

const defaultOutputFilename = "output.csv";
const defaultErrorFilename = "error.csv";

// Command-line argument parsing with yargs
const argv = yargs(process.argv.slice(2))
	.option("inputFile", {
		alias: "i",
		description: "Specify the input file name",
		type: "string",
	})
	.option("outputFile", {
		alias: "o",
		description: "Specify the output file name",
		type: "string",
	})
	.option("geneFile", {
		alias: "g",
		description: "Specify the reference genome file name",
		type: "string",
	})
	.option("errorFile", {
		alias: "e",
		description: "Specify the error file name",
		type: "string",
	})
	.help()
	.alias("help", "h")
	.version("1.0.0")
	.alias("version", "v")
	.usage(
		chalk.green(
			"Usage: $0 [-i | --inputFile] <inputFile> [-o | --outputFile] <outputFile> [-g | --geneFile] <geneFile> [-e | --errorFile] <errorFile>",
		),
	)
	.example(
		chalk.blue(
			"node $0 -i input.csv -o output.csv -g reference.csv -e error.csv",
		),
		chalk.cyan("Convert protein IDs to gene IDs using universal.csv"),
	).argv;

async function promptForDetails(answer) {
	const questions = [
		!answer.inputFile && {
			type: "input",
			name: "inputFile",
			message: `Enter the input file name:`,
			validate: (input) => {
				input = input?.trim();
				if (!existsSync(input)) {
					return "Please enter file path that exists";
				}
				if (!input.endsWith(".csv")) {
					return "Please enter a CSV file";
				}
				return true;
			},
		},
		!answer.outputFile && {
			type: "input",
			name: "outputFile",
			message: `Enter the output file name (default: ${defaultOutputFilename}):`,
			default: defaultOutputFilename,
		},
		!answer.geneFile && {
			type: "input",
			name: "geneFile",
			message: `Enter the reference geneome file name:`,
			validate: (input) => {
				input = input?.trim();
				if (!existsSync(input)) {
					return "Please enter file path that exists";
				}
				if (!input.endsWith(".csv")) {
					return "Please enter a CSV file";
				}
				return true;
			},
		},
		!answer.errorFile && {
			type: "input",
			name: "errorFile",
			message: `Enter the error file name (default: ${defaultErrorFilename}):`,
			default: defaultErrorFilename,
		},
	].filter(Boolean);

	return inquirer.prompt(questions);
}

(async () => {
	try {
		let { inputFile, outputFile, geneFile, errorFile } = argv;

		if (!inputFile || !outputFile || !geneFile || !errorFile) {
			try {
				const answers = await promptForDetails({
					inputFile,
					outputFile,
					geneFile,
					errorFile,
				});
				inputFile = inputFile || answers.inputFile;
				outputFile = outputFile || answers.outputFile;
				geneFile = geneFile || answers.geneFile;
				errorFile = errorFile || answers.errorFile;
			} catch (error) {
				console.info(chalk.blue.bold("[INFO]"), chalk.cyan("Exiting..."));
				process.exit(0);
			}
		}

		// Check if input file exists
		if (!existsSync(inputFile)) {
			console.error(
				chalk.bold("[ERROR]"),
				`Filename not found in directory: ${inputFile}. \nExiting...`,
			);
			process.exit(1);
		}

		if (!inputFile.endsWith(".csv")) {
			console.error(
				chalk.bold("[ERROR]"),
				"Please enter a CSV file. Exiting...",
			);
			process.exit(1);
		}

		// Check if universal file exists
		if (!existsSync(geneFile)) {
			console.warn(
				chalk.bold("[WARN]"),
				`Filename not found in directory: ${geneFile}. \nExiting...`,
			);
			process.exit(1);
		}

		if (!geneFile.endsWith(".csv")) {
			console.error(
				chalk.bold("[ERROR]"),
				"Please enter a CSV file. Exiting...",
			);
			process.exit(1);
		}

		if (!outputFile.endsWith(".csv")) {
			outputFile += ".csv";
		}

		if (!errorFile.endsWith(".csv")) {
			errorFile += ".csv";
		}

		const proteinToGeneMap = new Map();

		createReadStream(geneFile)
			.pipe(csv())
			.on("data", (data) => {
				proteinToGeneMap.set(data["Protein.stable.ID"], data["Gene.stable.ID"]);
			})
			.on("end", () => {
				console.log(
					chalk.green(chalk.bold("[LOG]"), "Map created successfully."),
				);
				console.log(
					chalk.green(
						chalk.bold("[LOG]"),
						`Map size: ${proteinToGeneMap.size}`,
					),
				);

				const writer = createWriteStream(outputFile);
				const errWriter = createWriteStream(errorFile);

				errWriter.write("protein1,gene1,protein2,gene2\n");

				console.log(chalk.green(chalk.bold("[LOG]"), "Updating CSV..."));

				let errCount = 0;

				createReadStream(inputFile)
					.pipe(csv())
					.on("data", (data) => {
						const protein1 = data["protein1"].split(".").pop();
						const protein2 = data["protein2"].split(".").pop();
						const weight = data["new_combined_score"];
						const gene1 = proteinToGeneMap.get(protein1);
						const gene2 = proteinToGeneMap.get(protein2);
						if (gene1 && gene2) {
							writer.write(`${gene1},${gene2},${weight}\n`);
						} else {
							errCount++;
							errWriter.write(`${protein1},${gene1},${protein2},${gene2}\n`);
						}
					})
					.on("end", () => {
						console.log(
							chalk.green(chalk.bold("[LOG]"), "CSV updated successfully."),
						);
						console.log(
							chalk.green(chalk.bold("[LOG]"), "Output file: " + outputFile),
						);
						console.log(
							chalk.green(chalk.bold("[LOG]"), "Error file: " + errorFile),
						);
						console.log(
							chalk.green(chalk.bold("[LOG]"), "Error count: " + errCount),
						);
					});
			});
	} catch (error) {
		console.error(chalk.bold("[ERROR]"), "An error occurred:", error);
		process.exit(1);
	}
})();
