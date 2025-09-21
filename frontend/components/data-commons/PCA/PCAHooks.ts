import { useEffect, useState, useCallback } from "react"
import Papa from "papaparse"
import type { PlotData } from "plotly.js"
import type { PCADataRow } from "./PCAUtils"
import {
  createGroupColorMapping,
  parseIdToGroupMapping,
  createPCATraces,
  getDefaultSampleColumn,
  getDefaultGroupColumn,
} from "./PCAUtils"

export function useViewportHeight() {
  const [viewportHeight, setViewportHeight] = useState(800)

  useEffect(() => {
    const updateHeight = () => setViewportHeight(window.innerHeight)
    updateHeight()
    window.addEventListener("resize", updateHeight)
    return () => window.removeEventListener("resize", updateHeight)
  }, [])

  return viewportHeight
}

export function usePCAColumns() {
  const [pcaColumns, setPcaColumns] = useState<string[]>([])
  const [xAxisColumn, setXAxisColumn] = useState<string>("")
  const [yAxisColumn, setYAxisColumn] = useState<string>("")

  const handleAxisChange = useCallback((newXAxis: string, newYAxis: string) => {
    setXAxisColumn(newXAxis)
    setYAxisColumn(newYAxis)
  }, [])

  return {
    pcaColumns,
    setPcaColumns,
    xAxisColumn,
    setXAxisColumn,
    yAxisColumn,
    setYAxisColumn,
    handleAxisChange,
  }
}

export function useSampleColumns() {
  const [samplesheetColumns, setSamplesheetColumns] = useState<string[]>([])
  const [sampleColumn, setSampleColumn] = useState<string>("")
  const [groupColumn, setGroupColumn] = useState<string>("")

  const handleColumnChange = useCallback((newSampleColumn: string, newGroupColumn: string) => {
    setSampleColumn(newSampleColumn)
    setGroupColumn(newGroupColumn)
  }, [])

  return {
    samplesheetColumns,
    setSamplesheetColumns,
    sampleColumn,
    setSampleColumn,
    groupColumn,
    setGroupColumn,
    handleColumnChange,
  }
}

export function usePCAData(
  pcaUrl?: string,
  samplesheetUrl?: string,
  sampleColumn?: string,
  groupColumn?: string,
  xAxisColumn?: string,
  yAxisColumn?: string
) {
  const [traces, setTraces] = useState<Partial<PlotData>[]>([])
  const [groupToColor, setGroupToColor] = useState<Record<string, string>>({})
  const [sampleDataExists, setSampleDataExists] = useState(false)
  const [loading, setLoading] = useState(false)

  const resetState = useCallback(() => {
    setTraces([])
    setLoading(false)
  }, [])

  const loadPCAData = useCallback(
    async (
      idToGroup: Record<string, string>,
      groupColor: Record<string, string>,
      hasSampleData: boolean
    ) => {
      if (!pcaUrl) {
        resetState()
        return
      }

      setLoading(true)
      try {
        const response = await fetch(pcaUrl)
        const pcaText = await response.text()

        Papa.parse<PCADataRow>(pcaText, {
          header: true,
          dynamicTyping: true,
          skipEmptyLines: true,
          complete: (pcaResults) => {
            const pcaHeader = pcaResults.meta.fields ?? []
            
            if (pcaHeader.length < 3) {
              resetState()
              return
            }

            const traces = createPCATraces(
              pcaResults.data,
              pcaHeader,
              xAxisColumn || pcaHeader[1] || "1",
              yAxisColumn || pcaHeader[2] || "2",
              idToGroup,
              groupColor,
              hasSampleData
            )

            setTraces(traces)
            setLoading(false)
          },
          error: resetState,
        })
      } catch {
        resetState()
      }
    },
    [pcaUrl, xAxisColumn, yAxisColumn, resetState]
  )

  const loadSampleData = useCallback(async () => {
    const defaultResult = { 
      idToGroup: {} as Record<string, string>, 
      groupColor: {} as Record<string, string>, 
      hasSampleData: false, 
      sampleHeader: [] as string[] 
    }
    
    if (!samplesheetUrl) {
      setSampleDataExists(false)
      setGroupToColor({})
      return defaultResult
    }

    try {
      const response = await fetch(samplesheetUrl)
      if (!response.ok) throw new Error("Sample file not found")
      
      const sampleText = await response.text()

      return new Promise<typeof defaultResult>((resolve) => {
        Papa.parse<PCADataRow>(sampleText, {
          header: true,
          skipEmptyLines: true,
          complete: (sampleResults) => {
            const sampleHeader = sampleResults.meta.fields ?? []

            if (sampleHeader.length < 2) {
              setSampleDataExists(false)
              setGroupToColor({})
              resolve({ ...defaultResult, sampleHeader })
              return
            }

            const actualSampleColumn = sampleColumn || getDefaultSampleColumn(sampleHeader)
            const actualGroupColumn = groupColumn || getDefaultGroupColumn(sampleHeader)

            const { idToGroup, groupSet } = parseIdToGroupMapping(
              sampleResults.data,
              actualSampleColumn,
              actualGroupColumn
            )

            const groupColor = createGroupColorMapping(groupSet)
            setGroupToColor(groupColor)
            setSampleDataExists(true)

            resolve({ idToGroup, groupColor, hasSampleData: true, sampleHeader })
          },
          error: () => {
            setSampleDataExists(false)
            setGroupToColor({})
            resolve(defaultResult)
          },
        })
      })
    } catch {
      setSampleDataExists(false)
      setGroupToColor({})
      return defaultResult
    }
  }, [samplesheetUrl, sampleColumn, groupColumn])

  useEffect(() => {
    let isCancelled = false

    const loadData = async () => {
      setLoading(true)
      
      const sampleResult = await loadSampleData()
      if (isCancelled) return

      await loadPCAData(
        sampleResult.idToGroup,
        sampleResult.groupColor,
        sampleResult.hasSampleData
      )
    }

    loadData()

    return () => {
      isCancelled = true
    }
  }, [loadSampleData, loadPCAData])

  return {
    traces,
    groupToColor,
    sampleDataExists,
    loading,
  }
}