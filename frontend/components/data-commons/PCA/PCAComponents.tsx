import React, { memo } from "react"
import { Spinner } from "@/components/ui/spinner"
import { Button } from "@/components/ui/button"
import { Info } from "lucide-react"
import Plot from "react-plotly.js"
import type { PlotData } from "plotly.js"

interface GroupLegendProps {
  groupToColor: Record<string, string>
  sampleDataExists: boolean
}

export const GroupLegend = memo(function GroupLegend({ groupToColor, sampleDataExists }: GroupLegendProps) {
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
})

interface LoadingStateProps {
  children: React.ReactNode
}

export function LoadingState({ children }: LoadingStateProps) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center text-gray-500">
        <Spinner />
        <p className="mt-4">{children}</p>
      </div>
    </div>
  )
}

interface EmptyStateProps {
  children: React.ReactNode
}

export function EmptyState({ children }: EmptyStateProps) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center text-gray-500 text-lg font-medium">{children}</div>
    </div>
  )
}

interface PCAHeaderProps {
  xAxisColumn: string
  yAxisColumn: string
  onSeeMoreClick: () => void
}

export const PCAHeader = memo(function PCAHeader({ xAxisColumn, yAxisColumn, onSeeMoreClick }: PCAHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-6">
      <h2 className="text-xl sm:text-2xl font-semibold text-center flex-1">
        PCA Plot ({xAxisColumn} vs {yAxisColumn})
      </h2>
      <div className="flex gap-2">
        <Button
          onClick={onSeeMoreClick}
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
        >
          <Info className="h-4 w-4" />
          See More
        </Button>
      </div>
    </div>
  )
})

interface PCAPlotProps {
  traces: Partial<PlotData>[]
  xAxisColumn: string
  yAxisColumn: string
  viewportHeight: number
}

export const PCAPlot = memo(function PCAPlot({ traces, xAxisColumn, yAxisColumn, viewportHeight }: PCAPlotProps) {
  return (
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
        config={{ 
          responsive: true, 
          displayModeBar: true,
          modeBarButtonsToRemove: ['pan2d', 'select2d', 'lasso2d', 'resetScale2d', 'zoomIn2d', 'zoomOut2d', 'autoScale2d', 'zoom2d'],
          displaylogo: false,
          toImageButtonOptions: {
            format: 'png',
            filename: `PCA_plot_${xAxisColumn}_vs_${yAxisColumn}`,
            height: 800,
            width: 1200,
            scale: 1
          }
        }}
      />
    </div>
  )
})

interface PCALayoutProps {
  children: React.ReactNode
}

export function PCALayout({ children }: PCALayoutProps) {
  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 max-w-[95vw] lg:max-w-[1400px] mx-auto">
      {children}
    </div>
  )
}