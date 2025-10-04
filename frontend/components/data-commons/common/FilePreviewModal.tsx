"use client"

import React from "react"
import { Dialog, DialogContent, DialogTitle, DialogClose } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ArrowLeft, ArrowRight, X } from "lucide-react"
import { Spinner } from "@/components/ui/spinner"
import Papa from "papaparse"

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL

interface FilePreviewModalProps {
  open: boolean
  onClose: () => void
  filename: string
  group?: string
  program?: string
  project?: string
  uploadedContent?: string 
  multiple?: boolean
  onNext?: () => void
  onPrev?: () => void
  fileIndex?: number
  fileCount?: number
}

type ParsedTable = {
  headers: string[]
  rows: string[][]
  delimiter: "," | "\t"
}

function detectDelimiter(sample: string): "," | "\t" {
  const lines = sample.split(/\r?\n/).slice(0, 50)
  let commaScore = 0
  let tabScore = 0
  for (const line of lines) {
    if (!line.trim()) continue
    const commas = (line.match(/,/g) || []).length
    const tabs = (line.match(/\t/g) || []).length
    if (commas > 0) commaScore += 1
    if (tabs > 0) tabScore += 1
  }
  return tabScore >= commaScore ? "\t" : ","
}

function parseTable(text: string): ParsedTable | null {
  const delimiter = detectDelimiter(text)
  const result = Papa.parse<string[]>(text, {
    delimiter,
    skipEmptyLines: true,
    dynamicTyping: false,
  })

  if (result.errors?.length) {
    const alt: "," | "\t" = delimiter === "," ? "\t" : ","
    const retry = Papa.parse<string[]>(text, {
      delimiter: alt,
      skipEmptyLines: true,
      dynamicTyping: false,
    })
    if (!retry.errors?.length) {
      return buildTable(alt, retry.data)
    }
    return null
  }

  return buildTable(delimiter, result.data)
}

function buildTable(delimiter: "," | "\t", data: string[][]): ParsedTable | null {
  const rows: string[][] = data
    .map((r) => (Array.isArray(r) ? r.map((c) => (c == null ? "" : String(c))) : []))
    .filter((r) => r.length > 0)

  if (rows.length === 0) return null

  const maxCols = Math.max(...rows.map((r) => r.length))
  let headers = rows[0] || []

  const looksLikeHeaders = headers.some((h) => isNaN(Number(String(h).trim())))
  if (!looksLikeHeaders) headers = []

  if (headers.length === 0) {
    headers = Array.from({ length: maxCols }, (_, i) => `Column ${i + 1}`)
  } else {
    headers = [...headers, ...Array(Math.max(maxCols - headers.length, 0)).fill("")].map((h, i) =>
      h?.toString()?.trim() ? h.toString() : `Column ${i + 1}`,
    )
  }

  const dataStart = looksLikeHeaders ? 1 : 0
  const body = rows.slice(dataStart).map((r) => {
    const padded = [...r, ...Array(Math.max(headers.length - r.length, 0)).fill("")]
    return padded
  })

  const hasDelimiterInText =
    delimiter === ","
      ? data.some((r) => Array.isArray(r) && r.some((c) => typeof c === "string" && c.includes(",")))
      : data.some((r) => Array.isArray(r) && r.some((c) => typeof c === "string" && c.includes("\t")))
  if (maxCols <= 1 && !hasDelimiterInText) {
    return null
  }

  return { headers, rows: body, delimiter }
}

export default function FilePreviewModal({
  open,
  onClose,
  filename,
  group,
  program,
  project,
  uploadedContent,
  multiple = false,
  onNext,
  onPrev,
  fileIndex = 0,
  fileCount = 1,
}: FilePreviewModalProps) {
  const [loading, setLoading] = React.useState(false)
  const [parsing, setParsing] = React.useState(false)
  const [rawContent, setRawContent] = React.useState<string>("")
  const [table, setTable] = React.useState<ParsedTable | null>(null)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!open || !filename) return
    let cancelled = false
    setLoading(true)
    setParsing(false)
    setError(null)
    setRawContent("")
    setTable(null)

    if (uploadedContent) {
      setRawContent(uploadedContent)
      setParsing(true)
      setLoading(false)
      
      setTimeout(() => {
        try {
          const lines = uploadedContent.split('\n')
          const previewContent = lines.slice(0, 21).join('\n')
          const parsed = parseTable(previewContent)
          if (!cancelled) setTable(parsed)
        } catch (e) {
          if (!cancelled) setTable(null)
        } finally {
          if (!cancelled) setParsing(false)
        }
      }, 0)
      return
    }

    if (!group || !program || !project) {
      if (!cancelled) {
        setError("Missing project information for server file preview")
        setLoading(false)
      }
      return
    }

    const url = `${API_BASE}/data-commons/project/${encodeURIComponent(group)}/${encodeURIComponent(
      program,
    )}/${encodeURIComponent(project)}/preview/${encodeURIComponent(filename)}`

    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch preview")
        return res.text()
      })
      .then((text) => {
        if (cancelled) return
        setRawContent(text)
        setParsing(true)
        setTimeout(() => {
          try {
            const parsed = parseTable(text)
            if (!cancelled) setTable(parsed)
          } catch (e) {
            if (!cancelled) setTable(null)
          } finally {
            if (!cancelled) setParsing(false)
          }
        }, 0)
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load preview")
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [open, filename, group, program, project, uploadedContent])

  const isLoading = loading || parsing
  const showTable = !!table && table.rows.length > 0

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="flex flex-col max-w-[95vw] w-[95vw] max-h-[95vh] h-[95vh] p-0">
        <div className="flex items-center justify-between p-4 border-b shrink-0">
          <DialogTitle className="text-lg font-semibold pr-8 truncate">
            Preview: {filename}
          </DialogTitle>
          <DialogClose asChild>
            <Button
              aria-label="Close preview"
              variant="ghost"
              size="icon"
              className="shrink-0"
              onClick={onClose}
            >
              <X className="h-5 w-5" />
              <span className="sr-only">Close</span>
            </Button>
          </DialogClose>
        </div>
        <div className="flex-1 min-h-0 p-4">
          <div className="h-full rounded border bg-background flex flex-col">
            {isLoading && (
              <div className="p-4 border-b shrink-0" role="status" aria-live="polite">
                <div className="flex items-center gap-2">
                  <Spinner className="h-4 w-4" />
                  <span className="text-sm">Loading preview...</span>
                </div>
              </div>
            )}
            {error && (
              <div className="p-4 text-sm text-destructive">
                Failed to load preview: {error}
              </div>
            )}
            {!error && (isLoading || showTable) && (
              <div className="flex-1 min-h-0 overflow-hidden" aria-busy={isLoading}>
                <div className="h-full overflow-auto">
                  <table className="w-full border-separate border-spacing-0">
                    <thead className="sticky top-0 z-10 bg-background shadow-sm">
                      <tr>
                        <th
                          scope="col"
                          className="sticky left-0 z-20 bg-background border px-3 py-2 text-left text-xs font-medium text-muted-foreground min-w-[3rem] w-[3rem]"
                        >
                          #
                        </th>
                        {(table?.headers || new Array(6).fill("")).map((h, i) => (
                          <th
                            key={`h-${i}`}
                            scope="col"
                            className="border px-3 py-3 text-left text-xs font-semibold text-foreground align-top whitespace-nowrap min-w-[10rem]"
                          >
                            {isLoading && !table ? (
                              <div className="h-4 w-24 rounded bg-muted animate-pulse" />
                            ) : (
                              <div className="break-words max-w-[12rem]">{h}</div>
                            )}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="text-xs">
                      {isLoading &&
                        !table &&
                        Array.from({ length: 10 }).map((_, r) => (
                          <tr key={`s-${r}`} className={r % 2 === 0 ? "bg-muted/40" : ""}>
                            <td className="sticky left-0 z-10 bg-background border px-3 py-2 text-muted-foreground">
                              {r + 1}
                            </td>
                            {Array.from({ length: 6 }).map((_, c) => (
                              <td key={`s-${r}-${c}`} className="border px-3 py-2">
                                <div className="h-4 w-20 rounded bg-muted animate-pulse" />
                              </td>
                            ))}
                          </tr>
                        ))}
                      {!isLoading &&
                        showTable &&
                        table.rows.map((row, rIdx) => (
                          <tr key={`r-${rIdx}`} className={rIdx % 2 === 0 ? "bg-muted/30" : ""}>
                            <td className="sticky left-0 z-10 bg-background border px-3 py-2 text-muted-foreground">
                              {rIdx + 1}
                            </td>
                            {row.map((cell, cIdx) => (
                              <td
                                key={`c-${rIdx}-${cIdx}`}
                                className="border px-3 py-2 align-top max-w-[12rem]"
                              >
                                <div className="break-words whitespace-pre-wrap">{cell}</div>
                              </td>
                            ))}
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            {!error && !isLoading && !showTable && (
              <div className="flex-1 min-h-0 overflow-auto">
                <pre className="p-4 font-mono text-xs whitespace-pre-wrap break-words h-full">
                  {rawContent}
                </pre>
              </div>
            )}
          </div>
        </div>
        {multiple && (
          <div className="flex justify-between items-center p-4 border-t shrink-0">
            <Button variant="outline" size="sm" onClick={onPrev} disabled={fileCount <= 1}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Prev
            </Button>
            <span className="text-sm text-muted-foreground">
              File {fileIndex + 1} of {fileCount}
            </span>
            <Button variant="outline" size="sm" onClick={onNext} disabled={fileCount <= 1}>
              Next <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}