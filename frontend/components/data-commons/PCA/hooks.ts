import { useEffect, useState, useCallback, useMemo } from "react"
import Papa from "papaparse"
import type { PlotData } from "plotly.js"
import type { PCADataRow } from "./utils"
import {
  createGroupColorMapping,
  parseIdToGroupMapping,
  createPCATraces,
  getDefaultSampleColumn,
  getDefaultGroupColumn,
} from "./utils"

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
  pcaData?: string,
  sampleData?: string,
  sampleColumn?: string,
  groupColumn?: string,
  xAxisColumn?: string,
  yAxisColumn?: string
) {
  const [traces, setTraces] = useState<Partial<PlotData>[]>([])
  const [groupToColor, setGroupToColor] = useState<Record<string, string>>({})
  const [sampleDataExists, setSampleDataExists] = useState(false)
  const [loading, setLoading] = useState(false)

  const parsedPCAData = useMemo((): { data: PCADataRow[], header: string[] } | null => {
    if (!pcaData) return null
    
    const isTabDelimited = pcaData.indexOf("\t") !== -1
    let result: { data: PCADataRow[], header: string[] } | null = null
    
    Papa.parse<PCADataRow>(pcaData, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      delimiter: isTabDelimited ? "\t" : undefined,
      complete: (parseResult) => {
        result = {
          data: parseResult.data as PCADataRow[],
          header: parseResult.meta.fields ?? []
        }
      },
    })
    
    return result
  }, [pcaData])

  const parsedSampleData = useMemo((): { data: PCADataRow[], header: string[] } | null => {
    if (!sampleData) return null
    
    const isTabDelimited = sampleData.indexOf("\t") !== -1
    let result: { data: PCADataRow[], header: string[] } | null = null
    
    Papa.parse<PCADataRow>(sampleData, {
      header: true,
      skipEmptyLines: true,
      delimiter: isTabDelimited ? "\t" : undefined,
      complete: (parseResult) => {
        result = {
          data: parseResult.data as PCADataRow[],
          header: parseResult.meta.fields ?? []
        }
      },
    })
    
    return result
  }, [sampleData])

  const sampleMapping = useMemo(() => {
    if (!parsedSampleData || parsedSampleData.header.length < 2) {
      return { 
        idToGroup: {} as Record<string, string>, 
        groupColor: {} as Record<string, string>, 
        hasSampleData: false 
      }
    }

    const actualSampleColumn = sampleColumn || getDefaultSampleColumn(parsedSampleData.header)
    const actualGroupColumn = groupColumn || getDefaultGroupColumn(parsedSampleData.header)

    const { idToGroup, groupSet } = parseIdToGroupMapping(
      parsedSampleData.data,
      actualSampleColumn,
      actualGroupColumn
    )

    const groupColor = createGroupColorMapping(groupSet)

    return { idToGroup, groupColor, hasSampleData: true }
  }, [parsedSampleData, sampleColumn, groupColumn])

  const memoizedTraces = useMemo(() => {
    if (!parsedPCAData || parsedPCAData.header.length < 3) {
      return []
    }

    return createPCATraces(
      parsedPCAData.data,
      parsedPCAData.header,
      xAxisColumn || parsedPCAData.header[1] || "1",
      yAxisColumn || parsedPCAData.header[2] || "2",
      sampleMapping.idToGroup,
      sampleMapping.groupColor,
      sampleMapping.hasSampleData
    )
  }, [parsedPCAData, xAxisColumn, yAxisColumn, sampleMapping])

  useEffect(() => {
    setLoading(true)
    setTraces(memoizedTraces)
    setGroupToColor(sampleMapping.groupColor)
    setSampleDataExists(sampleMapping.hasSampleData)
    setLoading(false)
  }, [memoizedTraces, sampleMapping])

  return {
    traces,
    groupToColor,
    sampleDataExists,
    loading,
  }
}