import { createReadStream, createWriteStream, existsSync } from "fs";
import { createInterface } from "readline";
import chalk from "chalk";
import inquirer from "inquirer";
import yargs from "yargs";

const defaultOutputFile = "output.csv";

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
	.option("precision", {
		alias: "p",
		description: "Specify the precision of calculated score",
		type: "number",
	})
	.help()
	.alias("help", "h")
	.version("1.0.0")
	.alias("version", "v")
	.usage(chalk.green("Usage: $0 -i <inputFile> -o <outputFile> -p <precision>"))
	.example(
		chalk.blue("node $0 -i protein.txt -o protein.normalized.csv -p 3"),
		chalk.cyan("Normalise protein scores to a precision of 3"),
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
				if (!input.endsWith(".txt") && !input.endsWith(".csv")) {
					return "Please enter a TXT or CSV file";
				}
				return true;
			},
		},
		!answer.outputFile && {
			type: "input",
			name: "outputFile",
			message: `Enter the output file name: (default: ${defaultOutputFile})`,
			default: defaultOutputFile,
		},
		!answer.precision && {
			type: "input",
			name: "precision",
			message: "Enter the precision of calculated score (default: 3):",
			default: 3,
			validate: (input) => {
				const valid = !isNaN(Number.parseFloat(input));
				return valid || "Please enter a valid number";
			},
			filter: Number,
		},
	].filter(Boolean);

	return inquirer.prompt(questions);
}

(async () => {
	let { inputFile, outputFile, precision } = argv;

	if (!inputFile || !outputFile || !precision) {
		try {
			const answers = await promptForDetails({
				inputFile,
				outputFile,
				precision,
			});
			inputFile = inputFile || answers.inputFile;
			outputFile = outputFile || answers.outputFile;
			precision = precision || answers.precision;
		} catch (error) {
			console.info(chalk.blue.bold("[INFO]"), chalk.cyan("Exiting..."));
			process.exit(0);
		}
	}

	if (!existsSync(inputFile)) {
		console.error(
			chalk.bold("[ERROR]"),
			`Filename not found in directory: ${inputFile}. \nExiting...`,
		);
		process.exit(1);
	}

	if (!inputFile.endsWith(".csv") || !inputFile.endsWith(".txt")) {
		console.error(
			chalk.bold("[ERROR]"),
			"Please enter a CSV or TXT file. Exiting...",
		);
		process.exit(1);
	}

	if (!outputFile.endsWith(".csv")) {
		outputFile += ".csv";
	}

	// Create a readable stream to read the input file line by line
	const fileStream = createReadStream(inputFile);
	const delimiter = inputFile.split(".").pop() === "csv" ? "," : " ";

	// Create a readline interface for reading file
	const rl = createInterface({
		input: fileStream,
		crlfDelay: Number.POSITIVE_INFINITY,
	});

	// Array to store protein data
	const proteinData = [];
	rl.on("line", (line) => {
		const [protein1, protein2, combinedScore] = line.trim().split(delimiter);
		const score = Number.parseInt(combinedScore);
		proteinData.push({ protein1, protein2, score }); // Store protein data
	});

	// When all lines have been processed, calculate new combined score
	rl.on("close", () => {
		console.log(chalk.green(chalk.bold("[LOG]"), "All lines have been read!"));
		const totalRecords = proteinData.length;
		console.log(
			chalk.green(chalk.bold("[LOG]"), `Total records: ${totalRecords}`),
		);

		// Max score calc (calculated)
		const maxScore = 999;
		const cumulativeCounts = Array.from({ length: maxScore + 1 }, () => 0);
		proteinData.forEach(({ score }) => cumulativeCounts[score]++);
		for (let i = 1; i < cumulativeCounts.length; i++) {
			cumulativeCounts[i] += cumulativeCounts[i - 1];
		}
		const newCombinedScores = proteinData.map(({ score }) =>
			(cumulativeCounts[score] / totalRecords).toFixed(precision),
		);

		console.log(
			chalk.green(
				chalk.bold("[LOG]"),
				"New combined scores have been calculated!",
			),
		);
		const outputStream = createWriteStream(outputFile);

		outputStream.write("protein1,protein2,combined_score,new_combined_score\n");

		// Write the protein data and new combined scores to the output CSV file
		for (let i = 0; i < proteinData.length; i++) {
			outputStream.write(
				`${proteinData[i].protein1},${proteinData[i].protein2},${proteinData[i].score},${newCombinedScores[i]}\n`,
			);
		}

		outputStream.end();
		console.log(
			chalk.green(
				chalk.bold("[LOG]"),
				`CSV file '${outputFile}' has been created successfully!`,
			),
		);
	});
})();
