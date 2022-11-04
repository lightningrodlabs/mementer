/* eslint-disable func-names */
import { LitElement, css, html } from 'lit';
import { property, state } from 'lit/decorators.js';
import { AdminWebsocket, AppWebsocket, InstalledCell } from '@holochain/client';
import { HolochainClient, CellClient } from '@holochain-open-dev/cell-client';
import { ScopedElementsMixin } from '@open-wc/scoped-elements';
import * as d3 from 'd3';

type sizes = 'small' | 'medium' | 'large'
type focusStates = 'default' | 'small' | 'medium' | 'large'
  
export class MementerApp extends ScopedElementsMixin(LitElement) {
    @state()
    loading = true

    svgSize = 700

    circleSize = 500

    colors = {
      grey1: '#888',
      grey2: '#bbb',
      grey3: '#ccc',
      grey4: '#ddd',
      buttonBlue: '#ff8b8b',
      buttonRed: '#8bc8ff',
      blue: 'blue',
      green: 'green',
      red: 'red'
    }

    circleColors = {
      large: this.colors.grey2,
      medium: this.colors.grey3,
      small: this.colors.grey4
    }

    timerColors = {
      large: this.colors.blue,
      medium: this.colors.green,
      small: this.colors.red
    }

    totalDuration = 6000 // seconds

    numberOfSlices = { large: 24, medium: 12, small: 6 }

    circleDurations = {
      large: this.totalDuration,
      medium: this.totalDuration / this.numberOfSlices.large,
      small: this.totalDuration / this.numberOfSlices.large / this.numberOfSlices.medium
    }

    focusStateScales = {
      default: { large: 1, medium: 0.75, small: 0.5 },
      large: { large: 1, medium: 0.2, small: 0.1 },
      medium: { large: 1, medium: 0.9, small: 0.1 },
      small: { large: 1, medium: 0.9, small: 0.8 },
    }

    focusState: focusStates = 'default'

    timerActive: boolean = false

    selectedSlice: any = null

    sizesArray: sizes[] = ['large', 'medium', 'small']
  
    async connectToHolochain() {
        const url = `ws://localhost:${process.env.HC_PORT}`
        const adminWebsocket = await AdminWebsocket.connect(`ws://localhost:${process.env.ADMIN_PORT}`)
        const appWebsocket = await AppWebsocket.connect(url)
        const client = new HolochainClient(appWebsocket)
        const appInfo = await appWebsocket.appInfo({ installed_app_id: 'mementer' })
        const installedCells = appInfo.cell_data
        const mementerCell = installedCells.find(c => c.role_id === 'mementer') as InstalledCell
        const cellClient = new CellClient(client, mementerCell)
        this.loading = false
    }

    findArc(size: sizes, start: number, end: number) {
      const outerRadius = this.focusStateScales[this.focusState][size] * this.circleSize / 2
      const slice = Math.PI * 2 / this.numberOfSlices[size]
      return d3.arc().outerRadius(outerRadius).innerRadius(0).startAngle(start * slice).endAngle(end * slice)
    }

    createSlices(size: sizes) {
      const t = this
      const group = d3.select(t.shadowRoot?.getElementById(`${size}-circle-group`)!)
      // remove old slices
      group.selectAll('path').remove()
      // create new slices
      for (let i = 0; i < t.numberOfSlices[size]; i += 1) {
        const arc = t.findArc(size, i, i + 1)
        group
          .append('path')
          .attr('id', `${size}-arc-${i}`)
          .classed('arc', true)
          .attr('d', <any>arc)
          .style('fill', t.circleColors[size])
          .style('stroke', 'black')
          .on('mouseover', function (this: any) { d3.select(this).transition('fill').duration(300).style('fill', t.colors.grey1) })
          .on('mouseout', function (this: any) {
            const selected = t.selectedSlice && t.selectedSlice.size === size && t.selectedSlice.index === i
            if (!selected) d3.select(this).transition('fill').duration(300).style('fill', t.circleColors[size])
          })
          .on('mousedown', () => {
            const isCurrentSelection = t.selectedSlice && t.selectedSlice.size === size && t.selectedSlice.index === i
            const previousSelection = t.selectedSlice && t.shadowRoot?.getElementById(`${t.selectedSlice.size}-arc-${t.selectedSlice.index}`)
            if (!isCurrentSelection && previousSelection) d3.select(previousSelection).transition('fill').duration(300).style('fill', t.circleColors[t.selectedSlice.size as sizes])
            t.selectedSlice = { size, index: i }
          })
      }
    }

    transitionCircleSize(size: sizes) {
      const t = this
      // transition circle slices
      const group = t.shadowRoot?.getElementById(`${size}-circle-group`)
      d3.select(group!).selectAll('.arc').each(function (this: any, d, i: number) {
        d3.select(this).transition().duration(1000).attr('d', <any>t.findArc(size, i, i + 1))
      })
      // transition timer
      const timer = t.shadowRoot?.getElementById(`${size}-timer`)
      d3.select(timer!).transition('size').duration(1000).attr('transform', `scale(${this.focusStateScales[this.focusState][size] / 2})`)
    }

    updateFocusState(focus: focusStates) {
      this.focusState = focus
      this.sizesArray.forEach((size: sizes) => this.transitionCircleSize(size))
    }

    createCircle(svg: any, size: sizes) {
      // create circle group
      svg
        .append('g')
        .attr('id', `${size}-circle-group`)
        .attr('transform', `translate(${this.svgSize / 2}, ${this.svgSize / 2})`)
        .style('cursor', 'pointer')
        .on('mousedown', () => this.updateFocusState(size))
      // create slices
      this.createSlices(size)
    }

    createTimer(size: sizes, circleGroup?: any) {
      const group = circleGroup || d3.select(this.shadowRoot?.getElementById(`${size}-circle-group`)!)
      const arc = d3.arc().outerRadius(this.circleSize).innerRadius(0)
      // remove old path
      group.select(`#${size}-timer`).remove()
      // create new path
      group
          .append('path')
          .attr('id', `${size}-timer`)
          .datum({ startAngle: 0, endAngle: Math.PI * 2 })
          .attr('d', <any>arc)
          .attr('pointer-events', 'none')
          .attr('transform', `scale(${this.focusStateScales[this.focusState][size] / 2})`)
          .style('opacity', 0.3)
          .style('fill', this.timerColors[size])
          .style('stroke', 'black')
          .transition('time')
          .ease(d3.easeLinear)
          .duration(this.circleDurations[size] * 1000)
          .attrTween('d', (d: any) => {
            const interpolate = d3.interpolate(0, d.endAngle)
            return (t: number) => {
              d.endAngle = interpolate(t)
              return <any>arc(d)
            }
          })
          .on('end', () => this.createTimer(size, group))
    }

    startTimer() {
      const timerButton = this.shadowRoot?.getElementById('timer-button')
      this.timerActive = true
      timerButton!.textContent = 'Stop timer'
      timerButton!.style.backgroundColor = this.colors.buttonBlue
      this.sizesArray.forEach((size: sizes) => this.createTimer(size))
    }

    stopTimer() {
      const timerButton = this.shadowRoot?.getElementById('timer-button')
      this.timerActive = false
      timerButton!.textContent = 'Start timer'
      timerButton!.style.backgroundColor = this.colors.buttonRed
      this.sizesArray.forEach((size: sizes) => d3.select(this.shadowRoot?.getElementById(`${size}-timer`)!).interrupt('time').remove())
    }

    toggleTimer() {
      if (this.timerActive) this.stopTimer()
      else this.startTimer()
    }

    findCircleDurationText(size: sizes) {
      return `(${+this.circleDurations[size].toFixed(2)}s / ${+(this.circleDurations[size] / this.numberOfSlices[size]).toFixed(2)}s)`
    }

    updateCircleDurations() {
      // update durations
      this.circleDurations = {
        small: this.totalDuration / this.numberOfSlices.large / this.numberOfSlices.medium,
        medium: this.totalDuration / this.numberOfSlices.large,
        large: this.totalDuration
      }
      // update duration text
      this.sizesArray.forEach((size: sizes) => {
        const textElement = this.shadowRoot?.getElementById(`${size}-circle-durations`)
        textElement!.textContent = this.findCircleDurationText(size)
      })
    }

    updateSlices(size: sizes, slices: number) {
      this.stopTimer()
      this.numberOfSlices[size] = +slices < 1 ? 1 : +slices
      this.updateCircleDurations()
      this.createSlices(size)
    }

    updateTotalDuration(seconds: number) {
      this.stopTimer()
      this.totalDuration = +seconds < 1 ? 1 : +seconds
      this.updateCircleDurations()
    }

    async firstUpdated() { await this.connectToHolochain() }

    updated() {
      // create svg
      const canvas = this.shadowRoot?.getElementById('canvas')
      const svg = d3.select(canvas!).append('svg').attr('width', this.svgSize).attr('height', this.svgSize)
      // create background
      svg
          .append('rect')
          .attr('id', 'background')
          .attr('width', this.svgSize)
          .attr('height', this.svgSize)
          .attr('fill', 'white')
          .style('cursor', 'pointer')
          .on('mousedown', () => this.updateFocusState('default'))
      // create circle layers
      this.sizesArray.forEach((size: sizes) => this.createCircle(svg, size))
    }

    render() {
      if (this.loading) return html`
        <div
          class="row"
          style="flex: 1; height: 100%; align-items: center; justify-content: center;"
        >
          Loading...
        </div>
      `
      return html`
        <div style="display: flex; flex-direction: 'column'; height: 100%; width: 100%; align-items: center;">
          <h1>The Mementer: The Chronogram of Life</h1>

          <div style="display: flex; align-items: center; margin-bottom: 20px">
            <p style="margin: 0">Total duration (seconds)</p>
            <input
              type='number'
              min='1'
              .value=${this.totalDuration}
              @keyup=${(e: any) => this.updateTotalDuration(e.target.value)}
              @change=${(e: any) => this.updateTotalDuration(e.target.value)}
              style="width: 100px; height: 30px; margin-left: 10px"
            >
          </div>

          <div style="display: flex; margin-bottom: 20px; width: 1200px;">
            <div style="display: flex; align-items: center; width: 400px">
              <p style="margin: 0 10px 0 0">Large slices</p>
              <input
                type='number'
                min='1'
                .value=${this.numberOfSlices.large}
                @keyup=${(e: any) => this.updateSlices('large', e.target.value)}
                @change=${(e: any) => this.updateSlices('large', e.target.value)}
                style="width: 50px; height: 30px; margin-right: 10px"
              >
              <p id='large-circle-durations' style="margin: 0">
                ${this.findCircleDurationText('large')}
              </p>
            </div>
            <div style="display: flex; align-items: center; width: 400px">
              <p style="margin: 0 10px 0 0">Medium slices</p>
              <input
                type='number'
                min='1'
                .value=${this.numberOfSlices.medium}
                @keyup=${(e: any) => this.updateSlices('medium', e.target.value)}
                @change=${(e: any) => this.updateSlices('medium', e.target.value)}
                style="width: 50px; height: 30px; margin-right: 10px"
              >
              <p id='medium-circle-durations' style="margin: 0">
                ${this.findCircleDurationText('medium')}
              </p>
            </div>
            <div style="display: flex; align-items: center; width: 400px">
              <p style="margin: 0 10px 0 0">Small slices</p>
              <input
                type='number'
                min='1'
                .value=${this.numberOfSlices.small}
                @keyup=${(e: any) => this.updateSlices('small', e.target.value)}
                @change=${(e: any) => this.updateSlices('small', e.target.value)}
                style="width: 50px; height: 30px; margin-right: 10px"
              >
              <p id='small-circle-durations' style="margin: 0">
                ${this.findCircleDurationText('small')}
              </p>
            </div>
          </div>

          <button
            id='timer-button'
            style="all: unset; background-color: #8bc8ff; padding: 10px; border-radius: 5px; cursor: pointer; margin-bottom: 20px"
            @click=${() => this.toggleTimer()}
          >
            Start timer
          </button>
          
          <div id='canvas'></div>
        </div>
      `
    }

    static get scopedElements() { return {} }
}