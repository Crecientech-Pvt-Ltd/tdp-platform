"use client"

import { useEffect, useState } from "react"
import Papa from "papaparse"
import Plot from "react-plotly.js"
import type { PlotData } from "plotly.js"
import { Spinner } from "@/components/ui/spinner"
import { Button } from "@/components/ui/button"
import { Info } from "lucide-react"
import { SeeMore } from "@/components/data-commons/common/SeeMore"
import type { DownloadFileSpec } from "@/components/data-commons/common/DownloadPopup"

type PCADataRow = {
  [key: string]: string | number | undefined
}

const COLORS = [
  "#1f77b4",
  "#ff7f0e",
  "#2ca02c",
  "#d62728",
  "#9467bd",
  "#8c564b",
  "#e377c2",
  "#7f7f7f",
  "#bcbd22",
  "#17becf",
]

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
  const [traces, setTraces] = useState<Partial<PlotData>[]>([])
  const [groupToColor, setGroupToColor] = useState<Record<string, string>>({})
  const [sampleDataExists, setSampleDataExists] = useState(false)
  const [loading, setLoading] = useState(false)
  const [viewportHeight, setViewportHeight] = useState(800)

  const [showSeeMore, setShowSeeMore] = useState(false)
  const [, setAvailableColumns] = useState<string[]>([])
  const [sampleColumn, setSampleColumn] = useState<string>("")
  const [groupColumn, setGroupColumn] = useState<string>("")
  const [pcaColumns, setPcaColumns] = useState<string[]>([])
  const [samplesheetColumns, setSamplesheetColumns] = useState<string[]>([])
  const [xAxisColumn, setXAxisColumn] = useState<string>("")
  const [yAxisColumn, setYAxisColumn] = useState<string>("")

  useEffect(() => {
    const updateHeight = () => setViewportHeight(window.innerHeight)
    updateHeight()
    window.addEventListener("resize", updateHeight)
    return () => window.removeEventListener("resize", updateHeight)
  }, [])

  useEffect(() => {
    const loadPCAData = (
      idToGroup: Record<string, string>,
      groupColor: Record<string, string>,
      hasSampleData: boolean,
    ) => {
      if (!pcaUrl) {
        setTraces([])
        setLoading(false)
        return
      }
      setLoading(true)
      fetch(pcaUrl)
        .then((res) => res.text())
        .then((pcaText) => {
          Papa.parse<PCADataRow>(pcaText, {
            header: true,
            dynamicTyping: true,
            skipEmptyLines: true,
            complete: (pcaResults) => {
              const pcaHeader = pcaResults.meta.fields ?? []
              setPcaColumns(pcaHeader)

              if (!xAxisColumn && pcaHeader.length > 1) {
                setXAxisColumn(pcaHeader[1])
              }
              if (!yAxisColumn && pcaHeader.length > 2) {
                setYAxisColumn(pcaHeader[2])
              }

              if (pcaHeader.length < 3) {
                setTraces([])
                setLoading(false)
                return
              }

              const idKey = pcaHeader[0] === "" || pcaHeader[0] === undefined ? "0" : pcaHeader[0]
              const xKey = xAxisColumn || pcaHeader[1] || "1"
              const yKey = yAxisColumn || pcaHeader[2] || "2"

              if (!hasSampleData) {
                const allData = {
                  x: [] as number[],
                  y: [] as number[],
                  text: [] as string[],
                }

                pcaResults.data.forEach((row) => {
                  const id = row[""] !== undefined ? row[""] : row[idKey] !== undefined ? row[idKey] : row["0"]
                  const xVal = row[xKey] as number
                  const yVal = row[yKey] as number

                  if (typeof xVal === "number" && typeof yVal === "number" && id !== undefined) {
                    allData.x.push(xVal)
                    allData.y.push(yVal)
                    allData.text.push(String(id))
                  }
                })

                const traces: Partial<PlotData>[] = [
                  {
                    x: allData.x,
                    y: allData.y,
                    text: allData.text.map((id) => `ID: ${id}`),
                    type: "scatter",
                    mode: "markers",
                    name: "Data Points",
                    marker: { color: "#6b7280", size: 14 },
                    hovertemplate: "%{text}<extra></extra>",
                  },
                ]
                setTraces(traces)
                setLoading(false)
              } else {
                const grouped: Record<string, { x: number[]; y: number[]; text: string[] }> = {}
                pcaResults.data.forEach((row) => {
                  const id = row[""] !== undefined ? row[""] : row[idKey] !== undefined ? row[idKey] : row["0"]
                  const xVal = row[xKey] as number
                  const yVal = row[yKey] as number

                  const group = id !== undefined && idToGroup[String(id)] ? idToGroup[String(id)] : "Unknown"
                  if (typeof xVal === "number" && typeof yVal === "number" && id !== undefined) {
                    if (!grouped[group]) grouped[group] = { x: [], y: [], text: [] }
                    grouped[group].x.push(xVal)
                    grouped[group].y.push(yVal)
                    grouped[group].text.push(String(id))
                  }
                })

                const traces: Partial<PlotData>[] = Object.entries(grouped).map(([group, data], idx) => ({
                  x: data.x,
                  y: data.y,
                  text: data.text.map((id) => `ID: ${id}<br>Group: ${group}`),
                  type: "scatter",
                  mode: "markers",
                  name: group,
                  marker: { color: groupColor[group] || COLORS[idx % COLORS.length], size: 9 },
                  hovertemplate: "%{text}<extra></extra>",
                }))
                setTraces(traces)
                setLoading(false)
              }
            },
            error: () => {
              setTraces([])
              setLoading(false)
            },
          })
        })
        .catch(() => {
          setTraces([])
          setLoading(false)
        })
    }

    if (!samplesheetUrl) {
      setSampleDataExists(false)
      setGroupToColor({})
      loadPCAData({}, {}, false)
      return
    }

    setLoading(true)

    fetch(samplesheetUrl)
      .then((res) => {
        if (!res.ok) {
          throw new Error("Sample file not found")
        }
        return res.text()
      })
      .then((sampleText) => {
        Papa.parse<PCADataRow>(sampleText, {
          header: true,
          skipEmptyLines: true,
          complete: (sampleResults) => {
            const sampleHeader = sampleResults.meta.fields ?? []
            setSamplesheetColumns(sampleHeader)
            setAvailableColumns(sampleHeader)

            if (sampleHeader.length < 2) {
              setSampleDataExists(false)
              setGroupToColor({})
              loadPCAData({}, {}, false)
              return
            }

            let actualSampleColumn = sampleColumn
            let actualGroupColumn = groupColumn

            if (!actualSampleColumn) {
              actualSampleColumn = sampleHeader[0] === "" || sampleHeader[0] === undefined ? "col_0" : sampleHeader[0]
              setSampleColumn(actualSampleColumn)
            }

            if (!actualGroupColumn) {
              const lastIndex = sampleHeader.length - 1
              actualGroupColumn =
                sampleHeader[lastIndex] === "" || sampleHeader[lastIndex] === undefined
                  ? `col_${lastIndex}`
                  : sampleHeader[lastIndex]
              setGroupColumn(actualGroupColumn)
            }

            const idToGroup: Record<string, string> = {}
            const groupSet = new Set<string>()

            sampleResults.data.forEach((row) => {
              let sampleId: string | number | undefined
              let groupValue: string | number | undefined

              if (actualSampleColumn.startsWith("col_")) {
                const index = Number.parseInt(actualSampleColumn.split("_")[1])
                const keys = Object.keys(row)
                sampleId = row[keys[index]]
              } else {
                sampleId = row[actualSampleColumn]
              }

              if (actualGroupColumn.startsWith("col_")) {
                const index = Number.parseInt(actualGroupColumn.split("_")[1])
                const keys = Object.keys(row)
                groupValue = row[keys[index]]
              } else {
                groupValue = row[actualGroupColumn]
              }

              if (sampleId !== undefined && groupValue !== undefined) {
                idToGroup[String(sampleId)] = String(groupValue)
                groupSet.add(String(groupValue))
              }
            })

            const groupArr = Array.from(groupSet).sort()
            const groupColor: Record<string, string> = {}
            groupArr.forEach((g, i) => {
              groupColor[g] = COLORS[i % COLORS.length]
            })
            setGroupToColor(groupColor)
            setSampleDataExists(true)
            loadPCAData(idToGroup, groupColor, true)
          },
          error: () => {
            setSampleDataExists(false)
            setGroupToColor({})
            loadPCAData({}, {}, false)
          },
        })
      })
      .catch(() => {
        setSampleDataExists(false)
        setGroupToColor({})
        loadPCAData({}, {}, false)
      })
  }, [samplesheetUrl, pcaUrl, sampleColumn, groupColumn, xAxisColumn, yAxisColumn])

  const handleColumnChange = (newSampleColumn: string, newGroupColumn: string) => {
    setSampleColumn(newSampleColumn)
    setGroupColumn(newGroupColumn)
  }

  const handleAxisChange = (newXAxis: string, newYAxis: string) => {
    setXAxisColumn(newXAxis)
    setYAxisColumn(newYAxis)
  }

  function renderGroupLegend() {
    if (!sampleDataExists) return null

    const groupNames = Object.keys(groupToColor).sort()
    if (groupNames.length === 0) return null

    return (
      <div className="flex gap-4 mb-6 flex-wrap justify-center">
        {groupNames.map((group) => (
          <div key={group} className="flex items-center gap-2">
            <span
              style={{
                display: "inline-block",
                width: 16,
                height: 16,
                background: groupToColor[group],
                borderRadius: 4,
                border: "1px solid #ccc",
              }}
            />
            <span className="text-sm font-medium">{group}</span>
          </div>
        ))}
      </div>
    )
  }

  const downloadFiles: DownloadFileSpec[] = [
    ...(pcaUrl && pcaFileName ? [{ name: pcaFileName, url: pcaUrl, description: "PCA results (coordinates)" }] : []),
    ...(samplesheetUrl && sampleFileName
      ? [{ name: sampleFileName, url: samplesheetUrl, description: "Sample metadata with group assignments" }]
      : []),
  ]

  const metadata = {
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
  }

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 max-w-[95vw] lg:max-w-[1400px] mx-auto">
      {!pcaUrl ? (
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center text-gray-500 text-lg font-medium">Kindly add PCA file to view the plot.</div>
        </div>
      ) : loading ? (
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center text-gray-500">
            <Spinner />
            <p className="mt-4">Loading data...</p>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl sm:text-2xl font-semibold text-center flex-1">
              PCA Plot ({xAxisColumn} vs {yAxisColumn})
            </h2>
            <div className="flex gap-2">
              <Button
                onClick={() => setShowSeeMore(true)}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Info className="h-4 w-4" />
                See More
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-center mb-6">{renderGroupLegend()}</div>
          <div className="relative w-full" style={{ height: `${viewportHeight * 0.8 - 64}px` }}>
            <Plot
              data={traces}
              layout={{
                title: { text: "PCA Plot", font: { size: 22 } },
                xaxis: {
                  title: { text: xAxisColumn, font: { size: 18 } },
                  automargin: true,
                  tickangle: 0,
                  tickfont: { size: 16 },
                },
                yaxis: {
                  title: { text: yAxisColumn, font: { size: 18 } },
                  tickfont: { size: 16 },
                },
                margin: { t: 60, l: 60, r: 40, b: 80 },
                autosize: true,
                showlegend: false,
              }}
              useResizeHandler
              style={{ width: "100%", height: "90%" }}
              config={{ responsive: true, displayModeBar: false }}
            />
          </div>
        </>
      )}

      <SeeMore
        isOpen={showSeeMore}
        onClose={() => setShowSeeMore(false)}
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
    </div>
  )
}
