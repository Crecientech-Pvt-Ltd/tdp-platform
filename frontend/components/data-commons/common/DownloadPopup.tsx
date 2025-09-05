"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Download, Loader2 } from "lucide-react"
import { Spinner } from "@/components/ui/spinner"
import JSZip from "jszip"

export type DownloadFile = {
  url?: string
  fileName?: string 
  name?: string 
  description?: string
}

export type DownloadFileSpec = DownloadFile

function getDisplayName(f: DownloadFile): string | undefined {
  return f.fileName ?? f.name
}

interface DownloadPopupProps {
  isOpen: boolean
  onClose: () => void
  files: DownloadFile[]
  metadata?: Record<string, unknown>
  zipName?: string
}

export default function DownloadPopup({
  isOpen,
  onClose,
  files,
  metadata,
  zipName = "data-download.zip",
}: DownloadPopupProps) {
  const [selectedFiles, setSelectedFiles] = useState<string[]>([])
  const [isDownloading, setIsDownloading] = useState(false)

  const selectableFiles = useMemo(() => {
    return files.filter((f) => !!getDisplayName(f))
  }, [files])

  useEffect(() => {
    if (isOpen) {
      setSelectedFiles(selectableFiles.filter((f) => !!f.url).map((f) => getDisplayName(f)!))
    } else {
      setSelectedFiles([])
      setIsDownloading(false)
    }
  }, [isOpen, selectableFiles])

  const handleFileChange = useCallback((fileName: string, checked: boolean) => {
    setSelectedFiles((prev) => (checked ? [...prev, fileName] : prev.filter((f) => f !== fileName)))
  }, [])

  const handleDownload = useCallback(async () => {
    if (selectedFiles.length === 0) {
      alert("Please select at least one file to download.")
      return
    }

    setIsDownloading(true)
    try {
      const zip = new JSZip()

      for (const f of files) {
        const displayName = getDisplayName(f)
        if (!displayName || !f.url) continue
        if (!selectedFiles.includes(displayName)) continue

        try {
          const res = await fetch(f.url)
          const text = await res.text()
          zip.file(displayName, text)
        } catch (err) {
          console.warn(`Failed to fetch ${displayName}:`, err)
        }
      }

      if (metadata) {
        zip.file("metadata.json", JSON.stringify(metadata, null, 2))
      }

      const blob = await zip.generateAsync({ type: "blob" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = zipName
      a.style.visibility = "hidden"
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      onClose()
    } catch (error) {
      console.error("Error creating download:", error)
      alert("Error creating download. Please try again.")
    } finally {
      setIsDownloading(false)
    }
  }, [files, selectedFiles, metadata, zipName, onClose])

  const handleClose = useCallback(() => onClose(), [onClose])

  return (
    <Dialog open={isOpen}>
      <DialogContent className="max-w-2xl w-[95vw] max-h-[90vh] flex flex-col">
        <DialogTitle className="text-xl font-semibold">Download Data</DialogTitle>

        <div className="flex-grow overflow-y-auto px-1 py-4">
          {isDownloading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center text-gray-500">
                <Spinner className="mx-auto mb-4" />
                Creating download package...
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-muted/30 rounded-lg p-6 border">
                <div className="space-y-4">
                  <Label className="text-base font-semibold">Available Files</Label>

                  {selectableFiles.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No files available for download.</p>
                  ) : (
                    <div className="space-y-3">
                      {selectableFiles.map((file) => {
                        const displayName = getDisplayName(file)!
                        const disabled = !file.url
                        const checked = selectedFiles.includes(displayName)

                        return (
                          <div
                            key={displayName}
                            className="flex items-center space-x-3 p-3 bg-background rounded-md border"
                          >
                            <Checkbox
                              id={displayName}
                              checked={checked}
                              onCheckedChange={(val) => handleFileChange(displayName, Boolean(val))}
                              disabled={disabled}
                            />
                            <div className="flex-1">
                              <Label htmlFor={displayName} className="text-sm font-medium cursor-pointer">
                                {displayName}
                              </Label>
                              {file.description && (
                                <p className="text-xs text-muted-foreground mt-1">{file.description}</p>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 flex-col sm:flex-row justify-end border-t pt-4">
          <DialogClose asChild>
            <Button onClick={handleClose} variant="secondary" disabled={isDownloading} className="w-full sm:w-auto">
              Cancel
            </Button>
          </DialogClose>
          <Button
            onClick={handleDownload}
            disabled={selectedFiles.length === 0 || isDownloading}
            className="w-full sm:w-auto flex items-center gap-2"
          >
            {isDownloading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating ZIP...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Download ({selectedFiles.length})
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
