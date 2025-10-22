import * as fs from 'fs/promises';

export const ALLOWED_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.pdf', '.ppt', '.pptx', '.doc', '.docx'];

export async function getDirectories(dirPath: string): Promise<string[]> {
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  return entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name);
}

export async function getFiles(dirPath: string): Promise<string[]> {
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  return entries.filter((entry) => entry.isFile()).map((entry) => entry.name);
}

export function findFirstFileWithExtension(files: string[], extensions: string[]): string | undefined {
  return files.find((f) => extensions.some((ext) => f.toLowerCase().endsWith(ext)));
}

export function findDifferentialExpressionFiles(files: string[]): string[] {
  return files.filter(
    (f) => f === 'DifferentialExpression.csv' || (f.startsWith('DifferentialExpression-') && f.endsWith('.csv')),
  );
}
