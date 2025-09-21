"use client"

import { useEffect, useState, useMemo, useCallback } from "react"
import dynamic from "next/dynamic"
import Papa from "papaparse"
import { Spinner } from "@/components/ui/spinner"
import type { DownloadFileSpec } from "@/components/data-commons/common/DownloadPopup"
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

const SeeMore = dynamic(() => import("@/components/data-commons/common/SeeMore").then(mod => ({ default: mod.SeeMore })), {
  loading: () => <div className="flex items-center justify-center p-4"><Spinner /></div>,
})

interface PCAProps {
  samplesheetUrl?: string
  pcaUrl?: string
  group?: string
  program?: string
  project?: string
  pcaFileName?: string
  sampleFileName?: string
}

export default function PCA({
  samplesheetUrl,
  pcaUrl,
  group = "default",
  program = "PCA",
  project = "analysis",
  pcaFileName = "PCA.csv",
  sampleFileName = "sample-sheet.csv",
}: PCAProps) {
  const [showSeeMore, setShowSeeMore] = useState(false)
  
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

  useEffect(() => {
    const initializeColumns = async () => {
      if (pcaUrl && pcaColumns.length === 0) {
        const response = await fetch(pcaUrl)
        const pcaText = await response.text()
        
        Papa.parse(pcaText, {
          header: true,
          preview: 1,
          complete: (results) => {
            const header = results.meta.fields ?? []
            setPcaColumns(header)
            
            if (!xAxisColumn && header.length > 1) {
              setXAxisColumn(header[1])
            }
            if (!yAxisColumn && header.length > 2) {
              setYAxisColumn(header[2])
            }
          },
        })
      }

      if (samplesheetUrl && samplesheetColumns.length === 0) {
        const response = await fetch(samplesheetUrl)
        if (response.ok) {
          const sampleText = await response.text()
          
          Papa.parse(sampleText, {
            header: true,
            preview: 1,
            complete: (results) => {
              const header = results.meta.fields ?? []
              setSamplesheetColumns(header)
              
              if (!sampleColumn && header.length > 0) {
                setSampleColumn(getDefaultSampleColumn(header))
              }
              if (!groupColumn && header.length > 1) {
                setGroupColumn(getDefaultGroupColumn(header))
              }
            },
          })
        }
      }
    }

    initializeColumns().catch(() => {})
  }, [pcaUrl, samplesheetUrl, pcaColumns.length, samplesheetColumns.length, xAxisColumn, yAxisColumn, sampleColumn, groupColumn, setPcaColumns, setXAxisColumn, setYAxisColumn, setSamplesheetColumns, setSampleColumn, setGroupColumn])

  const { traces, groupToColor, sampleDataExists, loading } = usePCAData(
    pcaUrl,
    samplesheetUrl,
    sampleColumn,
    groupColumn,
    xAxisColumn,
    yAxisColumn
  )

  const downloadFiles: DownloadFileSpec[] = useMemo(() => [
    ...(pcaUrl && pcaFileName ? [{ name: pcaFileName, url: pcaUrl, description: "PCA results (coordinates)" }] : []),
    ...(samplesheetUrl && sampleFileName
      ? [{ name: sampleFileName, url: samplesheetUrl, description: "Sample metadata with group assignments" }]
      : []),
  ], [pcaUrl, pcaFileName, samplesheetUrl, sampleFileName])

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
      {!pcaUrl ? (
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
