import React from 'react'
import { select, zoom, zoomIdentity, ZoomTransform } from 'd3'

interface ZoomControlsProps {
  svgRef: React.RefObject<SVGSVGElement>
  transform: ZoomTransform
  setTransform: (transform: ZoomTransform) => void
  dimensions: { width: number; height: number }
}

export const ZoomControls: React.FC<ZoomControlsProps> = ({
  svgRef,
  transform,
  setTransform,
  dimensions,
}) => {
  // Zoom in handler
  const handleZoomIn = () => {
    if (!svgRef.current) return
    const svg = select(svgRef.current)
    const d3zoom = zoom<SVGSVGElement, unknown>().on('zoom', (event) => {
      setTransform(event.transform)
    })

    svg
      .transition()
      .duration(750)
      .call(
        d3zoom.transform,
        zoomIdentity
          .scale(transform.k * 1.2)
          .translate(transform.x / 1.2, transform.y / 1.2)
      )
  }

  // Zoom out handler
  const handleZoomOut = () => {
    if (!svgRef.current) return
    const svg = select(svgRef.current)
    const d3zoom = zoom<SVGSVGElement, unknown>().on('zoom', (event) => {
      setTransform(event.transform)
    })

    svg
      .transition()
      .duration(750)
      .call(
        d3zoom.transform,
        zoomIdentity
          .scale(transform.k / 1.2)
          .translate(transform.x * 1.2, transform.y * 1.2)
      )
  }

  // Reset zoom handler
  const handleResetZoom = () => {
    if (!svgRef.current) return
    const svg = select(svgRef.current)
    const d3zoom = zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 3])
      .on('zoom', (event) => {
        setTransform(event.transform)
      })

    const initialTransform = zoomIdentity
      .translate(dimensions.width / 2, dimensions.height / 4)
      .scale(0.8)

    svg.transition().duration(750).call(d3zoom.transform, initialTransform)
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
