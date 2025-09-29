"use client"

import { useEffect, useMemo, useState } from "react"
import dynamic from "next/dynamic"
import Plot from "react-plotly.js"
import Papa from "papaparse"
import { VirtualizedCombobox } from "@/components/VirtualizedCombobox"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import { Button } from "@/components/ui/button"
import { Info } from "lucide-react"
import type { DownloadFileSpec } from "@/components/data-commons/common/DownloadPopup"

const SeeMore = dynamic(() => import("@/components/data-commons/common/SeeMore").then(mod => ({ default: mod.SeeMore })), {
  loading: () => <div className="flex items-center justify-center p-4"><Spinner /></div>,
})

type GeneRow = { [key: string]: string | number }
type SampleRow = { [key: string]: string }

type DataSource = "gene" | "transcript"

const GROUP_COLORS = ["#3182ce", "#e53e3e", "#38a169", "#d69e2e", "#805ad5", "#319795", "#dd6b20", "#718096"]

interface TranscriptExpressionProps {
  samplesheetUrl?: string
  geneCountsUrl?: string
  transcriptCountsUrl?: string
  geneFileName?: string
  transcriptFileName?: string
  sampleFileName?: string
  group?: string
  program?: string
  project?: string
}

export default function TranscriptExpression({
  samplesheetUrl,
  geneCountsUrl,
  transcriptCountsUrl,
  geneFileName = "gene-counts.csv",
  transcriptFileName = "transcript-counts.csv",
  sampleFileName = "sample-sheet.csv",
  group,
  program, 
  project,
}: TranscriptExpressionProps) {
  const [geneList, setGeneList] = useState<string[]>([])
  const [selectedGenes, setSelectedGenes] = useState<Set<string>>(new Set())
  const [geneData, setGeneData] = useState<GeneRow[]>([])
  const [transcriptData, setTranscriptData] = useState<GeneRow[]>([])
  const [geneDataMap, setGeneDataMap] = useState<Record<string, { x: string[]; y: number[] }>>({})
  const [sampleToGroup, setSampleToGroup] = useState<Record<string, string>>({})
  const [groupToColor, setGroupToColor] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [dataSource, setDataSource] = useState<DataSource>("gene")
  const [sampleDataExists, setSampleDataExists] = useState(false)
  const [viewportHeight, setViewportHeight] = useState(800)

  const [availableSampleColumns, setAvailableSampleColumns] = useState<string[]>([])
  const [sampleColumn, setSampleColumn] = useState<string>("")
  const [groupColumn, setGroupColumn] = useState<string>("")
  const [showSeeMore, setShowSeeMore] = useState(false)

  useEffect(() => {
    const updateHeight = () => setViewportHeight(window.innerHeight)
    updateHeight()
    window.addEventListener("resize", updateHeight)
    return () => window.removeEventListener("resize", updateHeight)
  }, [])

  function getIdColName(row: GeneRow): string {
    const keys = Object.keys(row)
    return keys.length > 0 ? keys[0] : "0"
  }

  function getSampleColNames(row: GeneRow): string[] {
    const keys = Object.keys(row).filter((k) => k !== "" && k !== "0" && k !== "undefined")
    return keys.length > 1 ? keys.slice(1) : []
  }

  function normalizeSampleName(sample: string): string {
    if (!sample) return ""
    return String(sample)
      .trim()
      .toLowerCase()
      .replace(/^sample[-_]?/i, "")
      .replace(/[^a-z0-9]/g, "")
  }

  function getSampleGroup(sample: string): string {
    let group = sampleToGroup[sample]

    if (!group) {
      const normalizedSample = normalizeSampleName(sample)
      group = sampleToGroup[normalizedSample]

      if (!group && sample.includes(".")) {
        const shortSample = sample.split(".").pop() || ""
        group = sampleToGroup[shortSample]
        if (!group) group = sampleToGroup[normalizeSampleName(shortSample)]
      }

      if (!group && normalizedSample) {
        const matchingKey = Object.keys(sampleToGroup).find((key) => normalizeSampleName(key) === normalizedSample)
        if (matchingKey) group = sampleToGroup[matchingKey]
      }

      if (!group && normalizedSample) {
        const partialMatchKey = Object.keys(sampleToGroup).find((key) => {
          const normKey = normalizeSampleName(key)
          return normKey.includes(normalizedSample) || normalizedSample.includes(normKey)
        })
        if (partialMatchKey) group = sampleToGroup[partialMatchKey]
      }
    }

    return group || "Unknown"
  }

  function groupAndSortSamples(samples: string[]): { samples: string[], groups: string[] } {
    if (!sampleDataExists) {
      return { samples, groups: samples.map(() => "Unknown") }
    }

    const sampleGroups = samples.map(sample => ({
      sample,
      group: getSampleGroup(sample)
    }))

    const groupOrder = Object.keys(groupToColor).sort()
    
    sampleGroups.sort((a, b) => {
      const groupIndexA = groupOrder.indexOf(a.group)
      const groupIndexB = groupOrder.indexOf(b.group)
      
      if (groupIndexA !== groupIndexB) {
        return (groupIndexA === -1 ? Infinity : groupIndexA) - (groupIndexB === -1 ? Infinity : groupIndexB)
      }
      
      return a.sample.localeCompare(b.sample)
    })

    return {
      samples: sampleGroups.map(sg => sg.sample),
      groups: sampleGroups.map(sg => sg.group)
    }
  }

  useEffect(() => {
    if (!samplesheetUrl) {
      setSampleDataExists(false)
      setSampleToGroup({})
      setGroupToColor({})
      setAvailableSampleColumns([])
      return
    }
    fetch(samplesheetUrl)
      .then((res) => {
        if (!res.ok) {
          throw new Error("Sample file not found")
        }
        return res.text()
      })
      .then((text) => {
        const isTabDelimited = text.indexOf("\t") !== -1

        Papa.parse<SampleRow>(text, {
          header: true,
          skipEmptyLines: true,
          delimiter: isTabDelimited ? "\t" : undefined,
          complete: (results) => {
            const rows = results.data as SampleRow[]
            if (!rows.length) {
              setSampleDataExists(false)
              setSampleToGroup({})
              setGroupToColor({})
              setAvailableSampleColumns(results.meta.fields ?? [])
              return
            }

            const sampleHeader = results.meta.fields ?? []
            setAvailableSampleColumns(sampleHeader)

            if (sampleHeader.length < 2) {
              setSampleDataExists(false)
              setSampleToGroup({})
              setGroupToColor({})
              return
            }

            let nameKey = sampleColumn
            let groupKey = groupColumn
            if (!nameKey) {
              nameKey = sampleHeader[0] === "" || sampleHeader[0] === undefined ? "0" : sampleHeader[0]
              setSampleColumn(sampleHeader[0] === "" || sampleHeader[0] === undefined ? "col_0" : sampleHeader[0])
            }
            if (!groupKey) {
              const last = sampleHeader.length - 1
              const gk = sampleHeader[last] || String(last)
              setGroupColumn(
                sampleHeader[last] === "" || sampleHeader[last] === undefined ? `col_${last}` : sampleHeader[last],
              )
              groupKey = gk
            }

            const sampleGroup: Record<string, string> = {}
            const groupSet = new Set<string>()

            rows.forEach((row) => {
              let sampleField = nameKey
              let groupField = groupKey
              if (sampleColumn.startsWith("col_")) {
                const idx = Number.parseInt(sampleColumn.split("_")[1])
                const keys = Object.keys(row)
                sampleField = keys[idx] ?? nameKey
              }
              if (groupColumn.startsWith("col_")) {
                const idx = Number.parseInt(groupColumn.split("_")[1])
                const keys = Object.keys(row)
                groupField = keys[idx] ?? groupKey
              }

              const sample =
                row[""] !== undefined ? row[""] : row[sampleField] !== undefined ? row[sampleField] : row["0"]
              const group = row[groupField] !== undefined ? row[groupField] : row[String(sampleHeader.length - 1)]

              if (sample && group) {
                const normalizedSample = normalizeSampleName(String(sample))
                sampleGroup[String(sample)] = String(group)
                if (normalizedSample) sampleGroup[normalizedSample] = String(group)
                groupSet.add(String(group))
              }
            })

            const groupArr = Array.from(groupSet).sort()
            const groupColor: Record<string, string> = {}
            groupArr.forEach((g, i) => {
              groupColor[g] = GROUP_COLORS[i % GROUP_COLORS.length]
            })
            setSampleToGroup(sampleGroup)
            setGroupToColor(groupColor)
            setSampleDataExists(true)
          },
        })
      })
      .catch(() => {
        setSampleDataExists(false)
        setSampleToGroup({})
        setGroupToColor({})
        setAvailableSampleColumns([])
      })
  }, [samplesheetUrl, sampleColumn, groupColumn])

  useEffect(() => {
    setLoading(true)
    if (!geneCountsUrl) {
      setGeneData([])
      setLoading(false)
      return
    }
    fetch(geneCountsUrl)
      .then((res) => res.text())
      .then((text) => {
        const isTabDelimited = text.indexOf("\t") !== -1
        Papa.parse<GeneRow>(text, {
          header: true,
          skipEmptyLines: true,
          delimiter: isTabDelimited ? "\t" : undefined,
          complete: (results) => {
            const data = results.data as GeneRow[]
            setGeneData(data)
            setLoading(false)
          },
        })
      })
      .catch(() => setLoading(false))
  }, [geneCountsUrl])

  useEffect(() => {
    setLoading(true)
    if (!transcriptCountsUrl) {
      setTranscriptData([])
      setLoading(false)
      return
    }

    fetch(transcriptCountsUrl)
      .then((res) => res.text())
      .then((text) => {
        const isTabDelimited = text.indexOf("\t") !== -1
        Papa.parse<GeneRow>(text, {
          header: true,
          skipEmptyLines: true,
          delimiter: isTabDelimited ? "\t" : undefined,
          complete: (results) => {
            const data = results.data as GeneRow[]
            setTranscriptData(data)
            setLoading(false)
          },
        })
      })
      .catch(() => {
        setTranscriptData([])
        setLoading(false)
      })
  }, [transcriptCountsUrl])

  useEffect(() => {
    const currentData = dataSource === "gene" ? geneData : transcriptData
    if (currentData.length > 0) {
      const idCol = getIdColName(currentData[0])
      const genes = currentData
        .map((row) => {
          const id = row[idCol] !== undefined ? row[idCol] : row["0"]
          return id as string
        })
        .filter(Boolean)
      genes.sort()
      setGeneList(genes)
      setSelectedGenes(new Set())
    }
  }, [dataSource, geneData, transcriptData])

  useEffect(() => {
    const currentData = dataSource === "gene" ? geneData : transcriptData

    if (!currentData.length || selectedGenes.size === 0) {
      setGeneDataMap({})
      return
    }

    const idCol = getIdColName(currentData[0])
    const sampleCols = getSampleColNames(currentData[0])
    const newGeneDataMap: Record<string, { x: string[]; y: number[] }> = {}

    selectedGenes.forEach((gene) => {
      const row = currentData.find((r) => {
        const rowId =
          r[idCol] !== undefined
            ? r[idCol]
            : r[""] !== undefined
              ? r[""]
              : r["0"] !== undefined
                ? r["0"]
                : (r as Record<string, unknown>)[0]
        return String(rowId).trim() === gene.trim()
      })

      if (row) {
        const originalX = sampleCols
        const originalY = originalX.map((k) => {
          const val =
            row[k] !== undefined
              ? row[k]
              : (row as Record<string, unknown>)[k?.toString?.() ?? ""] !== undefined
                ? (row as Record<string, unknown>)[k?.toString?.() ?? ""]
                : 0
          return Number(val)
        })

        const { samples: sortedSamples } = groupAndSortSamples(originalX)
        const sortedY = sortedSamples.map(sample => {
          const index = originalX.indexOf(sample)
          return index !== -1 ? originalY[index] : 0
        })

        newGeneDataMap[gene] = { x: sortedSamples, y: sortedY }
      } else {
        newGeneDataMap[gene] = { x: [], y: [] }
      }
    })

    setGeneDataMap(newGeneDataMap)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedGenes, geneData, transcriptData, dataSource, sampleToGroup, groupToColor, sampleDataExists])

  const selectedGenesArray = useMemo(() => Array.from(selectedGenes).sort(), [selectedGenes])

  function getBarColors(x: string[]) {
    if (!sampleDataExists) {
      return x.map(() => "#6b7280")
    }

    return x.map((sample) => {
      const group = getSampleGroup(sample)
      return groupToColor[group] || "#3182ce"
    })
  }

  function calculateBottomMargin(labels: string[]) {
    if (!labels || labels.length === 0) return 120
    const maxLabelLength = labels.reduce((max, l) => Math.max(max, String(l).length), 0)
    return Math.max(120, Math.min(80 + maxLabelLength * 6, 250))
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

  const handleGeneSelection = (value: string | Set<string>) => {
    if (value instanceof Set) {
      const limitedSet = new Set(Array.from(value).slice(0, 4))
      setSelectedGenes(limitedSet)
    }
  }

  const hasGene = !!geneCountsUrl
  const hasTranscript = !!transcriptCountsUrl

  useEffect(() => {
    if (hasGene && !hasTranscript) setDataSource("gene")
    else if (!hasGene && hasTranscript) setDataSource("transcript")
    else if (hasGene && hasTranscript && !["gene", "transcript"].includes(dataSource)) setDataSource("gene")
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasGene, hasTranscript])

  const isLoading = loading

  const downloadFiles: DownloadFileSpec[] = [
    ...(geneCountsUrl && geneFileName
      ? [{ name: geneFileName, url: geneCountsUrl, description: "Gene counts matrix" }]
      : []),
    ...(transcriptCountsUrl && transcriptFileName
      ? [{ name: transcriptFileName, url: transcriptCountsUrl, description: "Transcript counts matrix" }]
      : []),
    ...(samplesheetUrl && sampleFileName
      ? [{ name: sampleFileName, url: samplesheetUrl, description: "Sample sheet with group assignments" }]
      : []),
  ]

  const metadata = {
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

  const mappingChange = (newSampleCol: string, newGroupCol: string) => {
    setSampleColumn(newSampleCol)
    setGroupColumn(newGroupCol)
  }

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 max-w-[95vw] lg:max-w-[1500px] mx-auto">
      {!hasGene && !hasTranscript ? (
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center text-gray-500 text-lg font-medium">
            Kindly add CPM/TPM metric files to view plots.
          </div>
        </div>
      ) : isLoading ? (
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center text-gray-500">
            <Spinner />
            <p className="mt-4">Loading data...</p>
          </div>
        </div>
      ) : (
        <>
          <div className="mb-8 min-h-[120px]">
            <div className="max-w-4xl mx-auto mb-6">
              <div className="flex items-center gap-4 flex-nowrap w-full">
                {hasGene && hasTranscript && (
                  <div className="flex items-center gap-3 min-w-fit flex-shrink-0">
                    <Label htmlFor="data-source-toggle" className="text-sm font-medium whitespace-nowrap">
                      Gene Data
                    </Label>
                    <Switch
                      id="data-source-toggle"
                      checked={dataSource === "transcript"}
                      onCheckedChange={(checked) => setDataSource(checked ? "transcript" : "gene")}
                      disabled={isLoading}
                    />
                    <Label htmlFor="data-source-toggle" className="text-sm font-medium whitespace-nowrap">
                      Transcript Data
                    </Label>
                  </div>
                )}
                <div className="flex-1 min-w-0 flex items-center gap-3">
                  <label className="sr-only">Select {dataSource === "gene" ? "Genes" : "Transcripts"} (up to 4)</label>
                  <VirtualizedCombobox
                    data={geneList}
                    value={selectedGenes}
                    onChange={handleGeneSelection}
                    placeholder={`Search and select ${dataSource === "gene" ? "genes" : "transcripts"}...`}
                    loading={isLoading}
                    className="w-full"
                    multiselect={true}
                    showSelectedAsChip={true}
                    showClearAll={true}
                    showSelectAll={false}
                  />
                </div>
                <div className="min-w-fit flex-shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowSeeMore(true)}
                    className="flex items-center gap-2"
                  >
                    <Info className="h-4 w-4" />
                    See More
                  </Button>
                </div>
              </div>
            </div>

            <div className="min-h-[40px] flex items-center justify-center">{renderGroupLegend()}</div>
          </div>

          <div className="w-full overflow-x-hidden overflow-y-hidden h-[80%]">
            {selectedGenesArray.length > 0 && (
              <div className="w-full overflow-x-hidden overflow-y-hidden max-h-[90vh]">
                {selectedGenesArray.length === 1 ? (
                  <div className="w-full" style={{ height: `${viewportHeight * 0.8 - 64}px` }}>
                    <Plot
                      data={[
                        {
                          x: geneDataMap[selectedGenesArray[0]]?.x || [],
                          y: geneDataMap[selectedGenesArray[0]]?.y || [],
                          type: "bar",
                          marker: {
                            color: getBarColors(geneDataMap[selectedGenesArray[0]]?.x || []),
                          },
                        },
                      ]}
                      layout={{
                        title: {
                          text: `${dataSource === "gene" ? "Gene" : "Transcript"} Expression - ${selectedGenesArray[0]}`,
                          font: { size: 20 },
                        },
                        xaxis: {
                          tickangle: 45,
                          automargin: true,
                          tickfont: { size: 15 },
                        },
                        yaxis: {
                          title: { text: "Total read count(millions)", font: { size: 20 }, standoff: 10 },
                          tickfont: { size: 15 },
                        },
                        margin: {
                          t: 60,
                          l: 100,
                          r: 40,
                          b: calculateBottomMargin(geneDataMap[selectedGenesArray[0]]?.x || []) + 60,
                        },
                        autosize: true,
                        showlegend: false,
                      }}
                      useResizeHandler
                      style={{ width: "100%", height: "100%" }}
                      config={{ responsive: true, displayModeBar: false }}
                    />
                  </div>
                ) : selectedGenesArray.length >= 3 ? (
                  <div className="space-y-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {selectedGenesArray.map((gene) => {
                        const labels = geneDataMap[gene]?.x || []
                        const bottomMargin = calculateBottomMargin(labels)
                        return (
                          <div className="w-full" key={gene} style={{ height: `${viewportHeight * 0.44 - 80}px` }}>
                            <Plot
                              data={[
                                {
                                  x: geneDataMap[gene]?.x || [],
                                  y: geneDataMap[gene]?.y || [],
                                  type: "bar",
                                  marker: {
                                    color: getBarColors(geneDataMap[gene]?.x || []),
                                  },
                                },
                              ]}
                              layout={{
                                title: { text: gene, font: { size: 16 } },
                                xaxis: { tickangle: 45, automargin: true, tickfont: { size: 13 }, },
                                yaxis: {
                                  title: { text: "Total read count", font: { size: 13 }, standoff: 10 },
                                  tickfont: { size: 13 },
                                },
                                margin: { t: 30, l: 80, r: 20, b: bottomMargin + 20 },
                                autosize: true,
                                showlegend: false,
                              }}
                              useResizeHandler
                              style={{ width: "100%", height: "100%" }}
                              config={{ responsive: true, displayModeBar: false }}
                            />
                          </div>
                        )
                      })}
                      {selectedGenesArray.length % 2 !== 0 && <div className="invisible w-full"></div>}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="grid gap-3 grid-cols-1 md:grid-cols-2 xl:grid-cols-2">
                      {selectedGenesArray.slice(0, 4).map((gene) => {
                        const labels = geneDataMap[gene]?.x || []
                        const bottomMargin = calculateBottomMargin(labels)
                        return (
                          <div className="w-full" key={gene} style={{ height: `${viewportHeight * 0.75 - 120}px` }}>
                            <Plot
                              data={[
                                {
                                  x: geneDataMap[gene]?.x || [],
                                  y: geneDataMap[gene]?.y || [],
                                  type: "bar",
                                  marker: {
                                    color: getBarColors(geneDataMap[gene]?.x || []),
                                  },
                                },
                              ]}
                              layout={{
                                title: { text: gene, font: { size: 16 } },
                                xaxis: { tickangle: 45, automargin: true, tickfont: { size: 13 }, },
                                yaxis: {
                                  title: { text: "Total read count (millions)", font: { size: 14 }, standoff: 10 },
                                  tickfont: { size: 13 },
                                },
                                margin: { t: 30, l: 80, r: 20, b: bottomMargin + 20 },
                                autosize: true,
                                showlegend: false,
                              }}
                              useResizeHandler
                              style={{ width: "100%", height: "100%" }}
                              config={{ responsive: true, displayModeBar: false }}
                            />
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {selectedGenesArray.length === 0 && !isLoading && (
              <div className="text-center py-12 min-h-[60vh] flex items-center justify-center">
                <div>
                  <p className="text-gray-500 text-lg mb-4">
                    Select {dataSource === "gene" ? "genes" : "transcripts"} to view their expression data
                  </p>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      <SeeMore
        isOpen={showSeeMore}
        onClose={() => setShowSeeMore(false)}
        mapping={{
          availableColumns: availableSampleColumns,
          currentSampleColumn: sampleColumn,
          currentGroupColumn: groupColumn,
          onChange: mappingChange,
          title: "Sample to Group Mapping",
          sampleHelpText: "Column containing sample identifiers. Default: First column",
          groupHelpText: "Column containing group assignments. Default: Last column",
        }}
        download={{
          files: downloadFiles as DownloadFileSpec[],
          zipName: `TE-${project || "data"}.zip`,
          title: "Download Expression Data",
          buttonLabel: "Download Data",
          metadata,
        }}
        title="Transcript Expression – Configuration & Data"
      />
    </div>
  )
}
