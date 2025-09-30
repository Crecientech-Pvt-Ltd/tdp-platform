import React, { memo } from "react"
import { Spinner } from "@/components/ui/spinner"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Info } from "lucide-react"
import { VirtualizedCombobox } from "@/components/VirtualizedCombobox"

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
      <div className="text-center text-gray-500 text-lg font-medium">
        {children}
      </div>
    </div>
  )
}

interface GroupLegendProps {
  groupToColor: Record<string, string>
  sampleDataExists: boolean
}

export const GroupLegend = memo(function GroupLegend({ groupToColor, sampleDataExists }: GroupLegendProps) {
  if (!sampleDataExists) return null

  const groupNames = Object.keys(groupToColor).sort()
  if (groupNames.length === 0) return null

  return (
    <div className="flex gap-4 flex-wrap justify-center">
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

interface ControlsProps {
  hasGene: boolean
  hasTranscript: boolean
  dataSource: "gene" | "transcript"
  onDataSourceChange: (checked: boolean) => void
  geneList: string[]
  selectedGenes: Set<string>
  onGeneSelection: (value: string | Set<string>) => void
  onShowSeeMore: () => void
  isLoading: boolean
  groupToColor: Record<string, string>
  sampleDataExists: boolean
}

export function Controls({
  hasGene,
  hasTranscript,
  dataSource,
  onDataSourceChange,
  geneList,
  selectedGenes,
  onGeneSelection,
  onShowSeeMore,
  isLoading,
  groupToColor,
  sampleDataExists,
}: ControlsProps) {
  return (
    <div className=" min-h-[120px]">
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
                onCheckedChange={onDataSourceChange}
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
              onChange={onGeneSelection}
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
              onClick={onShowSeeMore}
              className="flex items-center gap-2"
            >
              <Info className="h-4 w-4" />
              See More
            </Button>
          </div>
        </div>
      </div>

      <div className="min-h-[40px] flex items-center justify-center">
        <GroupLegend 
          groupToColor={groupToColor} 
          sampleDataExists={sampleDataExists} 
        />
      </div>
    </div>
  )
}

interface NoSelectionStateProps {
  dataSource: "gene" | "transcript"
  isLoading: boolean
}

export function NoSelectionState({ dataSource, isLoading }: NoSelectionStateProps) {
  if (isLoading) return null
  
  return (
    <div className="text-center py-12 min-h-[60vh] flex items-center justify-center">
      <div>
        <p className="text-gray-500 text-lg mb-4">
          Select {dataSource === "gene" ? "genes" : "transcripts"} to view their expression data
        </p>
      </div>
    </div>
  )
}