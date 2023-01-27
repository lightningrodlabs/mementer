/* eslint-disable no-nested-ternary */
/* eslint-disable no-use-before-define */
import { html } from 'lit'
import { component, useEffect } from 'haunted'
import * as d3 from 'd3'
import 'lit-flatpickr'
import './settings-modal'
import './duration-bar'
import './nav-link'

type sizes = 'small' | 'medium' | 'large'

const svgSize = 200
const circleSize = 200
const sizesArray: sizes[] = ['large', 'medium', 'small']
const colors = {
  grey1: '#888',
  grey2: '#bbb',
  grey3: '#ccc',
  grey4: '#ddd',
  gold: '#f4c200',
  greyGold: '#e1d7b0'
}
const circleColors = {
    large: colors.grey2,
    medium: colors.grey3,
    small: colors.grey4
}
const focusStateScales = { large: 1, medium: 0.75, small: 0.5 }

function MementerPreview(props: { shadowRoot: any; slices: any }) {
    const { shadowRoot, slices } = props

    function findArc(size: sizes, start: number, end: number) {
      const totalSlices = slices[size]
      const outerRadius = focusStateScales[size] * circleSize / 2
      const slice = Math.PI * 2 / totalSlices
      return d3.arc().outerRadius(outerRadius).innerRadius(0).startAngle(start * slice).endAngle(end * slice)
    }
  
    function createSlices(size: sizes) {
      const group = d3.select(shadowRoot?.getElementById(`${size}-circle-group`)!)
      // remove old slices
      group.selectAll('path').remove()
      // create new slices
      const totalSlices = slices[size]
      for (let i = 0; i < totalSlices; i += 1) {
        const arc = findArc(size, i, i + 1)
        group
          .append('path')
          .attr('id', `${size}-arc-${i + 1}`)
          .classed('arc', true)
          .attr('d', <any>arc)
          .style('fill', circleColors[size])
          .style('stroke', 'black')
      }
    }
  
    function createCircle(svg: any, size: sizes) {
        // create circle group
        svg
          .append('g')
          .attr('id', `${size}-circle-group`)
          .attr('transform', `translate(${svgSize / 2}, ${svgSize / 2})`)
        // create slices
        createSlices(size)
    }

    // build mementer with new settings data
    useEffect(() => {
      if (slices) {
        // create svg and background
        const canvas = shadowRoot!.getElementById('canvas')
        d3.select(canvas).selectAll('svg').remove()
        const svg = d3.select(canvas).append('svg').attr('width', svgSize).attr('height', svgSize)
        svg
          .append('rect')
          .attr('id', 'background')
          .attr('width', svgSize)
          .attr('height', svgSize)
          .attr('fill', 'white')
        // create circle layers
        sizesArray.forEach((size: sizes) => createCircle(svg, size))
      }
    }, [slices])

    return html`
        <style>
          * {
            -webkit-box-sizing: border-box;
            -moz-box-sizing: border-box;
          }
          .canvas {
            width: 200px;
            height: 200px;
          }
        </style>
        <div id='canvas' class='canvas'></div>
    `
}

customElements.define('mementer-preview', component(MementerPreview as any));
