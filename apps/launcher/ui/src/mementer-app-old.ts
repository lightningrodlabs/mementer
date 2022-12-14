/* eslint-disable func-names */
import { LitElement, css, html } from 'lit';
import { useState } from 'haunted';
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
      blue1: '#0068e8',
      blue2: '#4e92e6',
      blue3: '#84aee3',
      green1: '#a8ed64',
      green2: '#8cd446',
      buttonBlue: '#ff8b8b',
      buttonRed: '#8bc8ff'
    }

    circleColors = {
      large: this.colors.grey2,
      medium: this.colors.grey3,
      small: this.colors.grey4
    }

    timerColors = {
      large: this.colors.blue1,
      medium: this.colors.blue2,
      small: this.colors.blue3
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

    newSliceText: string = ''

    sliceData: any = {
      large: [],
      medium: [],
      small: [],
    }

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
          .on('mouseover', function (this: any) {
            const hasContent = t.sliceData[size][i].length
            if (!hasContent) d3.select(this).transition('fill').duration(300).style('fill', t.colors.grey1)
          })
          .on('mouseout', function (this: any) {
            const selected = t.selectedSlice && t.selectedSlice.size === size && t.selectedSlice.index === i
            const hasContent = t.sliceData[size][i].length
            if (!selected && !hasContent) d3.select(this).transition('fill').duration(300).style('fill', t.circleColors[size])
          })
          .on('mousedown', () => {
            // deselect previous selection
            const isCurrentSelection = t.selectedSlice && t.selectedSlice.size === size && t.selectedSlice.index === i
            const previousSelection = t.selectedSlice && t.shadowRoot?.getElementById(`${t.selectedSlice.size}-arc-${t.selectedSlice.index}`)
            const hasContent = t.selectedSlice && t.sliceData[t.selectedSlice.size][t.selectedSlice.index].length
            if (previousSelection && !isCurrentSelection && !hasContent) d3.select(previousSelection).transition('fill').duration(300).style('fill', t.circleColors[t.selectedSlice.size as sizes])
            // add new selection
            t.selectedSlice = { size, index: i }
            const sliceDetails = t.shadowRoot?.getElementById('selected-slice-details')
            const sliceInputWrapper = t.shadowRoot?.getElementById('selected-slice-input-wrapper')
            const sliceInput = t.shadowRoot?.getElementById('selected-slice-input') as HTMLInputElement
            sliceDetails!.textContent = `Selected slice: ${size} ${i + 1} / ${t.numberOfSlices[size]}`
            sliceInputWrapper!.style.display = 'flex'
            sliceInput!.value = t.sliceData[size][i]
          })
        // create slice data
        this.sliceData[size][i] = ''
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
      if (focus === 'default') {
        // deselect selected slice if present
        const currentSelection = this.selectedSlice && this.shadowRoot?.getElementById(`${this.selectedSlice.size}-arc-${this.selectedSlice.index}`)
        if (currentSelection) {
          const hasContent = this.sliceData[this.selectedSlice.size][this.selectedSlice.index].length
          if (!hasContent) d3.select(currentSelection).transition('fill').duration(300).style('fill', this.circleColors[this.selectedSlice.size as sizes])
          this.selectedSlice = null
          const sliceDetails = this.shadowRoot?.getElementById('selected-slice-details')
          const sliceInputWrapper = this.shadowRoot?.getElementById('selected-slice-input-wrapper')
          sliceDetails!.textContent = 'No slice selected'
          sliceInputWrapper!.style.display = 'none'
        }
      }
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
      // set up timers
      const totalDuration = this.circleDurations[size] * 1000
      const sliceDuration = totalDuration / this.numberOfSlices[size]
      const text = this.shadowRoot?.getElementById(`${size}-circle-slice-text`)
      let sliceIndex = 1
      text!.textContent = `${size} slice: ${sliceIndex}`
      const timer = setInterval(() => {
        sliceIndex += 1
        if (sliceIndex <= this.numberOfSlices[size]) {
          text!.textContent = `${size} slice: ${sliceIndex}`
        } else clearInterval(timer)
      }, sliceDuration)
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
          .style('opacity', 0.5)
          .style('fill', this.timerColors[size])
          .transition('time')
          .ease(d3.easeLinear)
          .duration(totalDuration)
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

    updateSliceText(text: string) {
      this.newSliceText = text
    }

    saveSliceText() {
      this.sliceData[this.selectedSlice.size][this.selectedSlice.index] = this.newSliceText
      const slice = this.shadowRoot?.getElementById(`${this.selectedSlice.size}-arc-${this.selectedSlice.index}`)
      d3.select(slice!).transition('fill').duration(300).style('fill', this.colors.green1)
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
        <div style="display: flex; flex-direction: column; height: 100%; width: 100%; align-items: center;">
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

          <div style="display: flex; margin-bottom: 20px">
            <p id='large-circle-slice-text' style="margin-right: 20px">large slice: 0</p>
            <p id='medium-circle-slice-text' style="margin-right: 20px">medium slice: 0</p>
            <p id='small-circle-slice-text'>small slice: 0</p>
          </div>
          
          <div style='display: flex; align-items: center'>
            <div style='margin-bottom: 20px' id='canvas'></div>

            <div style='width: 300px; height: 100%; display: flex; flex-direction: column; align-items: center; margin-left: 40px'>
              <p id='selected-slice-details' style='margin: 0 0 20px 0'>No slice selected</p>
              <div id='selected-slice-input-wrapper' style='display: none; flex-direction: column; align-items: center'>
                <textarea
                  id='selected-slice-input'
                  rows='14'
                  .value=${this.newSliceText}
                  @keyup=${(e: any) => this.updateSliceText(e.target.value)}
                  @change=${(e: any) => this.updateSliceText(e.target.value)}
                  style='all: unset; width: 280px; border: 2px solid ${this.colors.grey1}; border-radius: 20px; background-color: white; padding: 20px; white-space: pre-wrap'
                ></textarea>
                <button
                  @click=${() => this.saveSliceText()}
                  style="all: unset; background-color: #8bc8ff; padding: 10px; border-radius: 5px; cursor: pointer; margin-top: 20px; width: 80px"
                >
                  Save text
                </button>
              </div>
            </div>
          </div>
          
        </div>
      `
    }

    static get scopedElements() { return {} }
}