import { platform } from "node:os";
import Path from "node:path";
import chalk from "chalk";
import inquirer from "inquirer";
import neo4j from "neo4j-driver";
import yargs from "yargs";

const defaultUsername = "neo4j";
const defaultDatabase = "pdnet";
const defaultDbUrl = "bolt://localhost:7687";

const argv = yargs(process.argv.slice(2))
	.option("file", {
		alias: "f",
		description: "Specify the CSV file path",
		type: "string",
	})
	.option("dbUrl", {
		alias: "U",
		description: "Specify the database URL",
		type: "string",
	})
	.option("username", {
		alias: "u",
		description: "Specify the database username",
		type: "string",
	})
	.option("password", {
		alias: "p",
		description: "Specify the database password",
		type: "string",
	})
	.option("database", {
		alias: "d",
		description: "Specify the database name",
		type: "string",
	})
	.option("interactionType", {
		alias: "i",
		description: "Specify the interaction type",
		type: "string",
	})
	.help()
	.alias("help", "h")
	.version("1.0.0")
	.alias("version", "v")
	.usage(
		chalk.green(
			"Usage: $0 [-f | --file] <filename> [-U | --dbUrl] <url> [-u | --username] <username> [-p | --password] <password> [-d | --database] <database> [-i | --interactionType] <interactionType>",
		),
	)
	.example(
		chalk.blue(
			"node $0 -f data.csv -U bolt://localhost:7687 -u neo4j -p password -d pdnet -i PPI",
		),
	)
	.example(chalk.cyan("Load data in Neo4j")).argv;

async function promptForDetails(answer) {
	const questions = [
		!answer.file && {
			type: "input",
			name: "file",
			message: "Enter the file path:",
			validate: (input) => {
				input = input?.trim();
				if (Path.extname(input) !== ".csv") {
					return "Please enter a CSV file";
				}
				return true;
			},
		},
		!answer.dbUrl && {
			type: "input",
			name: "dbUrl",
			message: "Enter the database URL:",
			default: defaultDbUrl,
		},
		!answer.username && {
			type: "input",
			name: "username",
			message: "Enter the username: (default: neo4j)",
			default: defaultUsername,
		},
		!answer.password && {
			type: "password",
			name: "password",
			message: "Enter the password:",
			mask: "*",
			required: true,
		},
		!answer.database && {
			type: "input",
			name: "database",
			message: "Enter the database name: (default: pdnet)",
			default: defaultDatabase,
			required: true,
		},
		!answer.interactionType && {
			type: "input",
			name: "interactionType",
			message: "Enter the interaction type [Make sure it's just one word]:",
			required: true,
		},
	].filter(Boolean);

	return inquirer.prompt(questions);
}

(async () => {
	let { file, dbUrl, username, password, database, interactionType } = argv;
	console.warn(
		chalk.bold("[WARN]"),
		"Make sure to not enter header names in CSV file",
	);
	console.info(
		chalk.blue.bold("[INFO]"),
		chalk.cyan(
			"'1st ENSG Gene ID,2nd ENSG Gene ID,Score' should be the format of CSV file",
		),
	);
	if (
		!file ||
		!dbUrl ||
		!username ||
		!password ||
		!database ||
		!interactionType
	) {
		try {
			const answers = await promptForDetails({
				file,
				dbUrl,
				username,
				password,
				database,
				interactionType,
			});
			file ||= answers.file;
			dbUrl ||= answers.dbUrl;
			username ||= answers.username;
			password ||= answers.password;
			database ||= answers.database;
			interactionType ||= answers.interactionType;
		} catch (error) {
			console.info(chalk.blue.bold("[INFO]"), chalk.cyan("Exiting..."));
			process.exit(0);
		}
	}

	if (Path.extname(file) !== ".csv") {
		console.error(chalk.bold("[ERROR]"), "Please enter a CSV file. Exiting...");
		process.exit(1);
	}

	const driver = neo4j.driver(dbUrl, neo4j.auth.basic(username, password));
	const session = driver.session({
		database: database,
	});

	try {
		await session.run(
			"CREATE CONSTRAINT IF NOT EXISTS FOR (g:Gene) REQUIRE g.ID IS UNIQUE",
		);

		console.log(
			chalk.green(
				chalk.bold("[LOG]"),
				"Created uniqueness constraint on Gene nodes",
			),
		);
		console.log(
			chalk.green(
				chalk.bold("[LOG]"),
				"This process will take some time. Please wait...",
			),
		);

		const query = `
    LOAD CSV FROM 'file:///${file}' AS line
    CALL {
      WITH line
      MERGE (g1:Gene {ID: line[0]})
      MERGE (g2:Gene {ID: line[1]})
      MERGE (g1)-[r:${interactionType}]->(g2)
      ON CREATE SET r.score = toFloat(line[2])
    } IN TRANSACTIONS;
  `;

		const start = new Date().getTime();
		const result = await session.run(query);
		const end = new Date().getTime();

		console.log(chalk.green(chalk.bold("[LOG]"), "Data loaded using LOAD CSV"));
		console.log(
			chalk.green(
				chalk.bold("[LOG]"),
				`Nodes Created: ${result.summary.counters.updates().nodesCreated}`,
			),
		);
		console.log(
			chalk.green(
				chalk.bold("[LOG]"),
				`Relationship Created: ${result.summary.counters.updates().relationshipsCreated}`,
			),
		);
		console.log(
			chalk.green(
				chalk.bold("[LOG]"),
				`Time taken: ${(end - start) / 1000} seconds`,
			),
		);
	} catch (error) {
		console.error(
			chalk.bold("[ERROR]"),
			"Error connecting to database. \nMake sure database is active and database URL/credentials are valid",
		);
		console.debug(chalk.bold("[DEBUG]"), error);
	} finally {
		await session.close();
		await driver.close();
	}
})();
