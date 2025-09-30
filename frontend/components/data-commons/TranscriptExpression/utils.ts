import type { FileSource } from "@/components/data-commons/upload/hooks/useDataFiles"
import type { DownloadFileSpec } from "@/components/data-commons/common/DownloadPopup"

//used for fuzzy matching between gene file and samplesheet
export function normalizeSampleName(sample: string): string {
  if (!sample) return ""
  return String(sample)
    .trim()
    .toLowerCase()
    .replace(/^sample[-_]?/i, "")
    .replace(/[^a-z0-9]/g, "")
}

export function calculateBottomMargin(labels: string[]): number {
  if (!labels || labels.length === 0) return 120
  const maxLabelLength = labels.reduce((max, l) => Math.max(max, String(l).length), 0)
  return Math.max(120, Math.min(80 + maxLabelLength * 6, 250))
}

export function createDownloadFiles(
  geneFile: FileSource | null,
  transcriptFile: FileSource | null,
  sampleFile: FileSource | null
): DownloadFileSpec[] {
  const files: DownloadFileSpec[] = []
  
  if (geneFile?.filename) {
    files.push({
      name: geneFile.filename,
      url: geneFile.url || '',
      description: "Gene counts matrix",
      ...(geneFile.content && { content: geneFile.content })
    })
  }
  
  if (transcriptFile?.filename) {
    files.push({
      name: transcriptFile.filename,
      url: transcriptFile.url || '',
      description: "Transcript counts matrix",
      ...(transcriptFile.content && { content: transcriptFile.content })
    })
  }
  
  if (sampleFile?.filename) {
    files.push({
      name: sampleFile.filename,
      url: sampleFile.url || '',
      description: "Sample sheet with group assignments",
      ...(sampleFile.content && { content: sampleFile.content })
    })
  }
  
  return files
}

export function createMetadata(
  downloadFiles: DownloadFileSpec[],
  sampleColumn: string,
  groupColumn: string,
  group?: string,
  program?: string,
  project?: string
) {
  return {
    selectedFiles: downloadFiles.map(f => f.name),
    settings: {
      mapping: {
        sampleColumn,
        groupColumn,
      },
    },
    group,
    program,
    project,
    kind: "TranscriptExpression",
  }
}