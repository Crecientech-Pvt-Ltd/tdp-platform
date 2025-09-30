"use client"

import { useEffect, useState, useMemo, useCallback } from "react"
import Papa from "papaparse"
import type { DownloadFileSpec } from "@/components/data-commons/common/DownloadPopup"
import { SeeMore } from "@/components/data-commons/common/SeeMore"
import { useFileData } from "@/components/data-commons/upload/hooks/useFileData"
import type { FileSource } from "@/components/data-commons/upload/hooks/useDataFiles"
import {
  useViewportHeight,
  usePCAColumns,
  useSampleColumns,
  usePCAData,
} from "./hooks"
import { getDefaultSampleColumn, getDefaultGroupColumn } from "./utils"
import {
  GroupLegend,
  LoadingState,
  EmptyState,
  PCAHeader,
  PCAPlot,
  PCALayout,
} from "./PCAComponents"

interface PCAProps {
  sampleFile: FileSource | null
  pcaFile: FileSource | null
  group?: string
  program?: string
  project?: string
}

export default function PCA({
  sampleFile,
  pcaFile,
  group = "default",
  program = "PCA",
  project = "analysis",
}: PCAProps) {
  const [showSeeMore, setShowSeeMore] = useState(false)
  
  const { data: sampleData, loading: sampleLoading } = useFileData(sampleFile);
  const { data: pcaData, loading: pcaLoading } = useFileData(pcaFile);
  
  const viewportHeight = useViewportHeight()
  
  const {
    pcaColumns,
    setPcaColumns,
    xAxisColumn,
    setXAxisColumn,
    yAxisColumn,
    setYAxisColumn,
    handleAxisChange,
  } = usePCAColumns()
  
  const {
    samplesheetColumns,
    setSamplesheetColumns,
    sampleColumn,
    setSampleColumn,
    groupColumn,
    setGroupColumn,
    handleColumnChange,
  } = useSampleColumns()

  const {
    traces,
    groupToColor,
    sampleDataExists,
    loading: pcaDataLoading,
  } = usePCAData(pcaData, sampleData, sampleColumn, groupColumn, xAxisColumn, yAxisColumn)
  
  const loading = sampleLoading || pcaLoading || pcaDataLoading
  const hasPCAFile = !!(pcaFile && (pcaFile.url || pcaFile.content))

  const pcaHeaders = useMemo(() => {
    if (!pcaData) return []
    
    const isTabDelimited = pcaData.indexOf("\t") !== -1
    let headers: string[] = []
    
    Papa.parse(pcaData, {
      header: true,
      preview: 1,
      delimiter: isTabDelimited ? "\t" : undefined,
      complete: (results) => {
        const header = results.meta.fields ?? []
        headers = header.map((col, idx) => {
          if (!col || col.trim() === "") {
            return idx === 0 ? "Sample_ID" : `Column_${idx}`
          }
          return col
        })
      },
    })
    
    return headers
  }, [pcaData])

  const sampleHeaders = useMemo(() => {
    if (!sampleData) return []
    
    const isTabDelimited = sampleData.indexOf("\t") !== -1
    let headers: string[] = []
    
    Papa.parse(sampleData, {
      header: true,
      preview: 1,
      delimiter: isTabDelimited ? "\t" : undefined,
      complete: (results) => {
        headers = results.meta.fields ?? []
      },
    })
    
    return headers
  }, [sampleData])

  useEffect(() => {
    if (pcaHeaders.length > 0) {
      setPcaColumns(pcaHeaders)
      
      if (!xAxisColumn && pcaHeaders.length > 1) {
        setXAxisColumn(pcaHeaders[1])
      }
      if (!yAxisColumn && pcaHeaders.length > 2) {
        setYAxisColumn(pcaHeaders[2])
      }
    }
  }, [pcaHeaders, xAxisColumn, yAxisColumn, setPcaColumns, setXAxisColumn, setYAxisColumn])

  useEffect(() => {
    if (sampleHeaders.length > 0) {
      setSamplesheetColumns(sampleHeaders)
      
      if (!sampleColumn && sampleHeaders.length > 0) {
        setSampleColumn(getDefaultSampleColumn(sampleHeaders))
      }
      if (!groupColumn && sampleHeaders.length > 1) {
        setGroupColumn(getDefaultGroupColumn(sampleHeaders))
      }
    }
  }, [sampleHeaders, sampleColumn, groupColumn, setSamplesheetColumns, setSampleColumn, setGroupColumn])

  const downloadFiles: DownloadFileSpec[] = useMemo(() => [
    ...(pcaFile?.filename 
      ? [{ 
          name: pcaFile.filename, 
          url: pcaFile.url || '', 
          description: "PCA results (coordinates)",
          ...(pcaFile.content && { content: pcaFile.content })
        }] 
      : []),
    ...(sampleFile?.filename
      ? [{ 
          name: sampleFile.filename, 
          url: sampleFile.url || '', 
          description: "Sample metadata with group assignments",
          ...(sampleFile.content && { content: sampleFile.content })
        }]
      : []),
  ], [pcaFile, sampleFile])

  const metadata = useMemo(() => ({
    selectedFiles: downloadFiles.map(f => f.name),
    settings: {
      pca: {
        xAxisColumn,
        yAxisColumn,
      },
      mapping: {
        sampleColumn,
        groupColumn,
      },
    },
    group,
    program,
    project,
  }), [downloadFiles, xAxisColumn, yAxisColumn, sampleColumn, groupColumn, group, program, project])

  const handleSeeMoreClick = useCallback(() => {
    setShowSeeMore(true)
  }, [])

  const handleSeeMoreClose = useCallback(() => {
    setShowSeeMore(false)
  }, [])

  return (
    <PCALayout>
      {!hasPCAFile ? (
        <EmptyState>
          Kindly add PCA file to view the plot.
        </EmptyState>
      ) : loading ? (
        <LoadingState>
          Loading data...
        </LoadingState>
      ) : (
        <>
          <PCAHeader
            xAxisColumn={xAxisColumn}
            yAxisColumn={yAxisColumn}
            onSeeMoreClick={handleSeeMoreClick}
          />

          <div className="flex items-center justify-center mb-6">
            <GroupLegend 
              groupToColor={groupToColor} 
              sampleDataExists={sampleDataExists} 
            />
          </div>
          
          <PCAPlot
            traces={traces}
            xAxisColumn={xAxisColumn}
            yAxisColumn={yAxisColumn}
            viewportHeight={viewportHeight}
          />
        </>
      )}

      <SeeMore
        isOpen={showSeeMore}
        onClose={handleSeeMoreClose}
        axis={{
          enabled: true,
          axisColumns: pcaColumns,
          currentX: xAxisColumn,
          currentY: yAxisColumn,
          onChange: handleAxisChange,
          title: "Axis Configuration",
        }}
        mapping={{
          availableColumns: samplesheetColumns,
          currentSampleColumn: sampleColumn,
          currentGroupColumn: groupColumn,
          onChange: handleColumnChange,
          title: "Sample to Group Mapping",
        }}
        download={{
          files: downloadFiles,
          zipName: `PCA-${project}.zip`,
          title: "Download PCA Data",
          buttonLabel: "Download Data",
          metadata, 
        }}
        title="PCA Configuration & Data Information"
      />
    </PCALayout>
  )
}
