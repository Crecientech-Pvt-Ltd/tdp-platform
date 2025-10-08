import { Injectable } from '@nestjs/common';
import * as fs from 'fs/promises';
import { existsSync, createReadStream } from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import {
  ALLOWED_EXTENSIONS,
  findDifferentialExpressionFiles,
  findFirstFileWithExtension,
  getDirectories,
  getFiles,
} from './dataCommons.utils';

const DATA_PATH = process.env.DATA_COMMONS_PATH || path.join(process.cwd(), 'src', 'data-commons', 'data');

@Injectable()
export class DataCommonsService {
  async getFullStructure() {
    const groups = await getDirectories(DATA_PATH);

    const structure = await Promise.all(
      groups.map(async (group) => {
        const groupPath = path.join(DATA_PATH, group);
        const programs = await getDirectories(groupPath);

        const programsData = await Promise.all(
          programs.map(async (program) => {
            const programPath = path.join(groupPath, program);
            const projects = await getDirectories(programPath);

            const projectsData = await Promise.all(
              projects.map(async (project) => {
                const projectPath = path.join(programPath, project);
                const files = await getFiles(projectPath);

                return {
                  name: project,
                  hasData: files.length > 0,
                  files,
                };
              }),
            );

            return {
              name: program,
              projects: projectsData,
            };
          }),
        );

        return {
          name: group,
          programs: programsData,
        };
      }),
    );

    return structure;
  }

  async getProjectFilesStatus(group: string, program: string, project: string) {
    const projectPath = path.join(DATA_PATH, group, program, project);
    const expectedFiles = [
      'samplesheet.valid.csv',
      'contrastsheet.valid.csv',
      'salmon.merged.gene_counts.tsv',
      'salmon.merged.transcript_counts.tsv',
      'PCA.csv',
    ];

    type FilesPresent = {
      [key: string]: boolean | string[] | string | false;
    };

    const filesPresent: FilesPresent = {};
    let filesInProject: string[] = [];
    try {
      filesInProject = await fs.readdir(projectPath);
    } catch {
      return { error: 'Project folder not found', filesPresent: {} };
    }

    for (const file of expectedFiles) {
      filesPresent[file] = filesInProject.includes(file);
    }

    const descriptionFile = findFirstFileWithExtension(filesInProject, ALLOWED_EXTENSIONS);
    filesPresent['project_description'] = descriptionFile || false;

    const deFiles = findDifferentialExpressionFiles(filesInProject);
    filesPresent['DifferentialExpression.csv'] = deFiles.length > 0 ? deFiles : false;

    return filesPresent;
  }

  async sendProjectDescription(group: string, program: string, project: string, res: any) {
    const projectPath = path.join(DATA_PATH, group, program, project);
    const allowedExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp'];
    if (!existsSync(projectPath)) {
      res.status(404).send('Project folder not found');
      return;
    }
    const files = await fs.readdir(projectPath);
    const descriptionFiles = files.filter((f) => allowedExtensions.some((ext) => f.toLowerCase().endsWith(ext)));
    if (descriptionFiles.length > 0) {
      const result: Record<string, string> = {};
      for (const file of descriptionFiles) {
        result[file] = file;
      }
      res.json(result);
    } else {
      res.status(404).send('No description file found');
    }
  }

  async sendProjectFile(group: string, program: string, project: string, filename: string, res: any) {
    const projectPath = path.join(DATA_PATH, group, program, project);
    const filePath = path.join(projectPath, filename);

    if (!existsSync(filePath)) {
      res.status(404).send(`${filename} not found`);
      return;
    }
    const lowerCaseFileName = filename.toLowerCase();
    if (lowerCaseFileName.includes('differentialexpression')) {
      try {
        const content = await fs.readFile(filePath, 'utf8');
        res.json({ [filename]: content });
      } catch {
        res.status(500).send('Error reading file');
      }
    } else {
      try {
        res.sendFile(filePath);
      } catch {
        res.status(500).send('Error sending file');
      }
    }
  }

  sendDeFile(group: string, program: string, project: string, filename: string, res: any) {
    const projectPath = path.join(DATA_PATH, group, program, project);
    const filePath = path.join(projectPath, filename);

    if (!existsSync(filePath)) {
      res.status(404).send(`${filename} not found`);
      return;
    }

    try {
      res.sendFile(filePath);
    } catch {
      res.status(500).send('Error sending file');
    }
  }

  async sendProjectFileByKey(group: string, program: string, project: string, fileKey: string, res: any) {
    const allowedKeys = ['samplesheet', 'gene', 'transcript', 'pca', 'differentialexpression'];

    const allowedKeysDetailed: Record<string, string[] | string> = {
      samplesheet: ['samplesheet', 'sample'],
      gene: ['gene'],
      transcript: ['transcript'],
      pca: ['pca'],
      differentialexpression: ['differentialexpression'],
    };

    const allowedExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp'];
    const lowerCaseFileKey = fileKey.toLowerCase();
    const projectPath = path.join(DATA_PATH, group, program, project);

    if (allowedExtensions.some((ext) => lowerCaseFileKey.endsWith(ext))) {
      const filePath = path.join(projectPath, fileKey);
      if (existsSync(filePath)) {
        res.sendFile(filePath);
      } else {
        res.status(404).send(`${fileKey} not found`);
      }
      return;
    }

    if (!allowedKeys.includes(lowerCaseFileKey)) {
      res.status(403).send({
        allowedKeys: allowedKeys,
        message: 'File key not allowed',
        fileKey: lowerCaseFileKey,
      });
      return;
    }

    let matchTerms = allowedKeysDetailed[lowerCaseFileKey];
    if (!matchTerms) {
      res.status(403).send('No match terms found for this key');
      return;
    }

    if (typeof matchTerms === 'string') {
      matchTerms = [matchTerms];
    }

    let filesInProject: string[] = [];
    try {
      filesInProject = await fs.readdir(projectPath);
    } catch {
      res.status(404).send('Project folder not found');
      return;
    }

    const matchingFiles = filesInProject.filter((f) => {
      const lowerF = f.toLowerCase();
      return matchTerms.some((term) => lowerF.includes(term.toLowerCase()));
    });

    const result = {
      label: fileKey,
      selectedFile: matchingFiles.length > 0 ? matchingFiles[0] : '',
      filesHavingSameKey: matchingFiles,
      allFiles: filesInProject,
    };

    res.json(result);
  }

  async previewProjectFile(group: string, program: string, project: string, filename: string, res: any) {
    const projectPath = path.join(DATA_PATH, group, program, project);
    const filePath = path.join(projectPath, filename);

    if (!existsSync(filePath)) {
      res.status(404).send(`${filename} not found`);
      return;
    }
    try {
      const stream = createReadStream(filePath, { encoding: 'utf8' });
      const rl = readline.createInterface({
        input: stream,
        crlfDelay: Infinity,
      });

      const lines: string[] = [];
      rl.on('line', (line: string) => {
        if (lines.length < 21) {
          lines.push(line);
        }
        if (lines.length === 21) {
          rl.close();
        }
      });

      rl.on('close', () => {
        res.type('text/plain').send(lines.join('\n'));
      });

      rl.on('error', () => {
        res.status(500).send('Error reading file');
      });
    } catch {
      res.status(500).send('Error reading file');
    }
  }
}
