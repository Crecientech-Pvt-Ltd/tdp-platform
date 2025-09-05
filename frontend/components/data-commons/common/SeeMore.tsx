"use client"

import React from "react"
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Download, Eye } from "lucide-react"
import DownloadPopup, { type DownloadFile } from "./DownloadPopup"
import FilePreviewModal from "./FilePreviewModal"

type AxisConfig = {
  enabled?: boolean 
  options?: string[]
  axisColumns?: string[] 
  currentX?: string
  currentY?: string
  onAxisChange?: (xAxis: string, yAxis: string) => void
  onChange?: (xAxis: string, yAxis: string) => void
  xLabel?: string 
  yLabel?: string 
  title?: string
}

type SampleMappingConfig = {
  enabled?: boolean 
  availableColumns?: string[] 
  currentSampleColumn?: string
  currentGroupColumn?: string
  onColumnChange?: (sampleColumn: string, groupColumn: string) => void
  onChange?: (sampleColumn: string, groupColumn: string) => void
  title?: string
  sampleHelpText?: string 
  groupHelpText?: string 
}

type DownloadConfig = {
  files: DownloadFile[]
  metadata?: Record<string, unknown>
  zipName?: string 
  title?: string
  buttonLabel?: string 
}

interface SeeMoreProps {
  isOpen: boolean
  onClose: () => void

  axis?: AxisConfig
  mapping?: SampleMappingConfig
  sampleMapping?: SampleMappingConfig

  title?: string 

  download?: DownloadConfig
}

type DownloadMetadata = {
  group?: string
  program?: string
  project?: string
  [key: string]: unknown
}

export default function SeeMore({
  isOpen,
  onClose,
  axis,
  mapping: mappingProp,
  sampleMapping: sampleMappingProp,
  title = "Configuration & Data Information",
  download,
}: SeeMoreProps) {
  const mapping = mappingProp ?? sampleMappingProp

  const axisOptions = axis?.options ?? axis?.axisColumns ?? []
  const axisEnabled = !!axis?.enabled && axisOptions.length > 0

  const mappingAvailableCols = mapping?.availableColumns ?? []
  const mappingEnabled = !!mapping?.enabled || mappingAvailableCols.length > 0

  const canDownload = !!download && !!download.files?.length

  const [selectedXAxis, setSelectedXAxis] = React.useState(axis?.currentX ?? "")
  const [selectedYAxis, setSelectedYAxis] = React.useState(axis?.currentY ?? "")
  const [selectedSampleColumn, setSelectedSampleColumn] = React.useState(mapping?.currentSampleColumn ?? "")
  const [selectedGroupColumn, setSelectedGroupColumn] = React.useState(mapping?.currentGroupColumn ?? "")
  const [showDownloadPopup, setShowDownloadPopup] = React.useState(false)

  const [previewOpen, setPreviewOpen] = React.useState(false)
  const [previewFileIndex, setPreviewFileIndex] = React.useState(0)

  const previewableFiles = (download?.files ?? []).filter(
    (f: DownloadFile) =>
      typeof f.name === "string" &&
      typeof f.url === "string" &&
      (f.name.toLowerCase().endsWith(".csv") ||
        f.name.toLowerCase().endsWith(".tsv") ||
        f.name.toLowerCase().endsWith(".txt"))
  )
  const metadata = (download?.metadata ?? {}) as DownloadMetadata
  const group = typeof metadata.group === "string" ? metadata.group : ""
  const program = typeof metadata.program === "string" ? metadata.program : ""
  const project = typeof metadata.project === "string" ? metadata.project : ""

  const handlePreviewFiles = () => {
    if (previewableFiles.length > 0) {
      setPreviewFileIndex(0)
      setPreviewOpen(true)
    }
  }

  const handleNextPreview = () => {
    setPreviewFileIndex((prev) => (prev + 1) % previewableFiles.length)
  }

  const handlePrevPreview = () => {
    setPreviewFileIndex((prev) => (prev - 1 + previewableFiles.length) % previewableFiles.length)
  }

  React.useEffect(() => {
    if (isOpen) {
      setSelectedXAxis(axis?.currentX ?? "")
      setSelectedYAxis(axis?.currentY ?? "")
      setSelectedSampleColumn(mapping?.currentSampleColumn ?? "")
      setSelectedGroupColumn(mapping?.currentGroupColumn ?? "")
    }
  }, [isOpen, axis?.currentX, axis?.currentY, mapping?.currentSampleColumn, mapping?.currentGroupColumn])

  const handleApply = () => {
    if (mapping?.onChange || mapping?.onColumnChange) {
      ;(mapping.onChange ?? mapping.onColumnChange)?.(selectedSampleColumn, selectedGroupColumn)
    }
    if (axis?.onChange || axis?.onAxisChange) {
      ;(axis.onChange ?? axis.onAxisChange)?.(selectedXAxis, selectedYAxis)
    }
    onClose()
  }

  const handleCancel = () => {
    setSelectedXAxis(axis?.currentX ?? "")
    setSelectedYAxis(axis?.currentY ?? "")
    setSelectedSampleColumn(mapping?.currentSampleColumn ?? "")
    setSelectedGroupColumn(mapping?.currentGroupColumn ?? "")
    onClose()
  }

  const getColumnDisplayName = (column: string, index: number) => {
    if (!column || column.trim() === "") {
      return index === 0 ? "First Column" : `Column ${index + 1}`
    }
    return column
  }

  const getColumnValue = (column: string, index: number) => {
    if (!column || column.trim() === "") {
      return `col_${index}`
    }
    return column
  }

  return (
    <>
      <Dialog open={isOpen}>
        <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] flex flex-col">
          <DialogTitle className="text-xl font-semibold">{title}</DialogTitle>

          <div className="flex-grow overflow-y-auto px-1 py-4">
            <div className="space-y-8">
              {axisEnabled && (
                <div className="bg-muted/30 rounded-lg p-6 border">
                  <h3 className="text-lg font-semibold mb-4 text-primary">{axis?.title ?? "Axis Configuration"}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <Label className="text-base font-medium">{axis?.xLabel ?? "X-Axis Column"}</Label>
                      <Select value={selectedXAxis} onValueChange={setSelectedXAxis}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select X-axis column" />
                        </SelectTrigger>
                        <SelectContent>
                          {axisOptions.map((col, idx) => (
                            <SelectItem key={idx} value={col}>
                              <span className="font-medium">{col}</span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {selectedXAxis && (
                        <p className="text-sm text-muted-foreground">Currently mapping to: {selectedXAxis}</p>
                      )}
                    </div>

                    <div className="space-y-3">
                      <Label className="text-base font-medium">{axis?.yLabel ?? "Y-Axis Column"}</Label>
                      <Select value={selectedYAxis} onValueChange={setSelectedYAxis}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select Y-axis column" />
                        </SelectTrigger>
                        <SelectContent>
                          {axisOptions.map((col, idx) => (
                            <SelectItem key={idx} value={col}>
                              <span className="font-medium">{col}</span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {selectedYAxis && (
                        <p className="text-sm text-muted-foreground">Currently mapping to: {selectedYAxis}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {mappingEnabled && (
                <div className="bg-muted/30 rounded-lg p-6 border">
                  <h3 className="text-lg font-semibold mb-4 text-primary">
                    {mapping?.title ?? "Sample to Group Mapping"}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <Label className="text-base font-medium">Sample Column</Label>
                      <Select value={selectedSampleColumn} onValueChange={setSelectedSampleColumn}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select sample column" />
                        </SelectTrigger>
                        <SelectContent>
                          {mappingAvailableCols.map((column, index) => (
                            <SelectItem key={index} value={getColumnValue(column, index)}>
                              <span className="font-medium">{getColumnDisplayName(column, index)}</span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-sm text-muted-foreground">
                        {mapping?.sampleHelpText ?? "Column containing sample identifiers. Default: First column"}
                      </p>
                    </div>

                    <div className="space-y-3">
                      <Label className="text-base font-medium">Group Column</Label>
                      <Select value={selectedGroupColumn} onValueChange={setSelectedGroupColumn}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select group column" />
                        </SelectTrigger>
                        <SelectContent>
                          {mappingAvailableCols.map((column, index) => (
                            <SelectItem key={index} value={getColumnValue(column, index)}>
                              <span className="font-medium">{getColumnDisplayName(column, index)}</span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-sm text-muted-foreground">
                        {mapping?.groupHelpText ?? "Column containing group assignments. Default: Last column"}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="gap-2 flex-col sm:flex-row justify-between border-t pt-4">
            <div className="flex gap-2 order-1 w-full sm:w-auto">
              {canDownload && (
                <>
                  <Button
                    onClick={() => setShowDownloadPopup(true)}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    {download?.buttonLabel ?? "Download Data"}
                  </Button>
                  <Button
                    onClick={handlePreviewFiles}
                    variant="outline"
                    className="flex items-center gap-2"
                    disabled={previewableFiles.length === 0 || !group || !program || !project}
                  >
                    <Eye className="h-4 w-4" />
                    Preview Files
                  </Button>
                </>
              )}
            </div>

            <div className="flex gap-2 order-2 w-full sm:w-auto">
              <DialogClose asChild>
                <Button type="button" variant="secondary" onClick={handleCancel} className="w-full sm:w-auto">
                  Cancel
                </Button>
              </DialogClose>
              <Button onClick={handleApply} className="bg-primary text-white hover:bg-primary/90 w-full sm:w-auto">
                Apply Changes
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {download && (
        <DownloadPopup
          isOpen={showDownloadPopup}
          onClose={() => setShowDownloadPopup(false)}
          files={download.files}
          metadata={download.metadata}
          zipName={download.zipName}
        />
      )}

      <FilePreviewModal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        filename={typeof previewableFiles[previewFileIndex]?.name === "string" ? previewableFiles[previewFileIndex]?.name : ""}
        group={group}
        program={program}
        project={project}
        multiple={previewableFiles.length > 1}
        onNext={handleNextPreview}
        onPrev={handlePrevPreview}
        fileIndex={previewFileIndex}
        fileCount={previewableFiles.length}
      />
    </>
  )
}

export { SeeMore }
