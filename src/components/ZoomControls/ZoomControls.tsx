import React from 'react'
import * as d3 from 'd3'

interface ZoomControlsProps {
  svgRef: React.RefObject<SVGSVGElement>
  transform: d3.ZoomTransform
  setTransform: (transform: d3.ZoomTransform) => void
  resetZoomFunc: () => void
}

export const ZoomControls: React.FC<ZoomControlsProps> = ({
  svgRef,
  resetZoomFunc,
  transform,
  setTransform,
}) => {
  // Zoom in handler
  const handleZoomIn = () => {
    if (!svgRef.current) return
    const svg = d3.select(svgRef.current)
    const d3zoom = d3.zoom<SVGSVGElement, unknown>().on('zoom', (event) => {
      setTransform(event.transform)
    })

    svg
      // .transition()
      // .duration(750)
      .call(
        d3zoom.transform,
        d3.zoomIdentity
          .scale(transform.k * 1.2)
          .translate(transform.x / 1.2, transform.y / 1.2)
      )
  }

  // Zoom out handler
  const handleZoomOut = () => {
    if (!svgRef.current) return
    const svg = d3.select(svgRef.current)
    const d3zoom = d3.zoom<SVGSVGElement, unknown>().on('zoom', (event) => {
      setTransform(event.transform)
    })

    svg
      // .transition()
      // .duration(750)
      .call(
        d3zoom.transform,
        d3.zoomIdentity
          .scale(transform.k / 1.2)
          .translate(transform.x * 1.2, transform.y * 1.2)
      )
  }

  // Reset zoom handler
  const handleResetZoom = () => {
    resetZoomFunc()
  }

  // Button style to avoid duplication
  const buttonStyle: React.CSSProperties = {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    border: 'none',
    backgroundColor: '#333',
    color: 'white',
    cursor: 'pointer',
  }

  return (
    <div
      style={{
        position: 'absolute',
        bottom: '20px',
        right: '20px',
        display: 'flex',
        gap: '10px',
      }}
    >
      <button
        onClick={handleZoomIn}
        style={{
          ...buttonStyle,
          fontSize: '20px',
        }}
      >
        +
      </button>
      <button
        onClick={handleZoomOut}
        style={{
          ...buttonStyle,
          fontSize: '20px',
        }}
      >
        -
      </button>
      <button
        onClick={handleResetZoom}
        style={{
          ...buttonStyle,
          fontSize: '14px',
        }}
      >
        R
      </button>
    </div>
  )
}
