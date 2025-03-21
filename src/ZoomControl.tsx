import { select, zoom, zoomIdentity } from 'd3'

export const ZoomControls = ({ svgRef }: { svgRef: any }) => {
  const margin = { top: 50, right: 120, bottom: 50, left: 120 }
  const width = 1600 - margin.left - margin.right
  const height = 1000 - margin.top - margin.bottom
  const handleZoomIn = () => {
    if (svgRef.current) {
      const svg = select(svgRef.current)
      const zoomBehavior = zoom().on('zoom', (event) => {
        svg.select('g').attr('transform', event.transform)
      })

      svg.transition().duration(750).call(zoomBehavior.scaleBy, 1.2)
    }
  }

  const handleZoomOut = () => {
    if (svgRef.current) {
      const svg = select(svgRef.current)
      const zoomBehavior = zoom().on('zoom', (event) => {
        svg.select('g').attr('transform', event.transform)
      })

      svg.transition().duration(750).call(zoomBehavior.scaleBy, 0.8)
    }
  }

  const handleReset = () => {
    if (svgRef.current) {
      const svg = select(svgRef.current)
      const zoomBehavior = zoom().on('zoom', (event) => {
        svg.select('g').attr('transform', event.transform)
      })

      svg
        .transition()
        .duration(750)
        .call(
          zoomBehavior.transform,
          zoomIdentity.translate(width / 2 + 100, height / 2 - 250)
        )
    }
  }

  return (
    <div className="flex items-center space-x-2">
      <button
        className="w-8 h-8 flex items-center justify-center rounded bg-gray-200 hover:bg-gray-300"
        onClick={handleZoomIn}
        title="Zoom in"
      >
        +
      </button>
      <button
        className="w-8 h-8 flex items-center justify-center rounded bg-gray-200 hover:bg-gray-300"
        onClick={handleZoomOut}
        title="Zoom out"
      >
        -
      </button>
      <button
        className="px-2 h-8 flex items-center justify-center rounded bg-gray-200 hover:bg-gray-300"
        onClick={handleReset}
        title="Reset view"
      >
        Reset
      </button>
    </div>
  )
}
