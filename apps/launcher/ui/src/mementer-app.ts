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

    circleColors = { small: '#ddd', medium: '#ccc', large: '#bbb' }

    timerColors = { small: 'red', medium: 'green', large: 'blue' }

    totalDuration = 6000 // seconds

    numberOfSlices = { small: 6, medium: 12, large: 24 }

    circleDurations = {
      small: this.totalDuration / this.numberOfSlices.large / this.numberOfSlices.medium,
      medium: this.totalDuration / this.numberOfSlices.large,
      large: this.totalDuration
    }

    focusStateScales = {
      default: { small: 0.5, medium: 0.75, large: 1 },
      small: { small: 0.8, medium: 0.9, large: 1 },
      medium: { small: 0.1, medium: 0.9, large: 1 },
      large: { small: 0.1, medium: 0.2, large: 1 },
    }

    focusState: focusStates = 'default'

    timerActive: boolean = false
  
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
      const group = d3.select(this.shadowRoot?.getElementById(`${size}-circle-group`)!)
      group.selectAll('path').remove()
      for (let i = 0; i < this.numberOfSlices[size]; i += 1) {
        const arc = this.findArc(size, i, i + 1)
        group
          .append('path')
          .attr('id', `${size}-arc-${i}`)
          .classed('arc', true)
          .attr('d', <any>arc)
          .style('fill', this.circleColors[size])
          .style('stroke', 'black')
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
      this.transitionCircleSize('small')
      this.transitionCircleSize('medium')
      this.transitionCircleSize('large')
    }

    createCircle(svg: any, size: sizes) {
      svg
        .append('g')
        .attr('id', `${size}-circle-group`)
        .attr('transform', `translate(${this.svgSize / 2}, ${this.svgSize / 2})`)
        .style('cursor', 'pointer')
        .on('mousedown', () => this.updateFocusState(size))

      this.createSlices(size)
    }

    createTimer(size: sizes, circleGroup?: any) {
      const group = circleGroup || d3.select(this.shadowRoot?.getElementById(`${size}-circle-group`)!)
      const arc = d3.arc().outerRadius(this.circleSize).innerRadius(0)
      // remove old timer path
      group.select(`#${size}-timer`).remove()
      // create new timer path
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

    updateSlices(size: sizes, slices: number) {
      this.numberOfSlices[size] = +slices
      this.createSlices(size)
    }

    updateTotalDuration(seconds: number) {
      this.totalDuration = +seconds
    }

    toggleTimer() {
      const timerButton = this.shadowRoot?.getElementById('timer-button')
      if (this.timerActive) {
        // stop timer
        this.timerActive = false
        timerButton!.textContent = 'Start timer'
        d3.select(this.shadowRoot?.getElementById(`large-timer`)!).interrupt('time').remove()
        d3.select(this.shadowRoot?.getElementById(`medium-timer`)!).interrupt('time').remove()
        d3.select(this.shadowRoot?.getElementById(`small-timer`)!).interrupt('time').remove()
      } else {
        //start timer
        this.timerActive = true
        timerButton!.textContent = 'Stop timer'
        this.circleDurations = {
          small: this.totalDuration / this.numberOfSlices.large / this.numberOfSlices.medium,
          medium: this.totalDuration / this.numberOfSlices.large,
          large: this.totalDuration
        }
        this.createTimer('small')
        this.createTimer('medium')
        this.createTimer('large')
      }
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
      this.createCircle(svg, 'large')
      this.createCircle(svg, 'medium')
      this.createCircle(svg, 'small')
    }


    render() {
        if (this.loading)
          return html`<div
            class="row"
            style="flex: 1; height: 100%; align-items: center; justify-content: center;"
          >
           Loading...
          </div>`;
    
        return html`
          <div style="display: flex; flex-direction: 'column'; height: 100%; width: 100%; align-items: center;">
            <h1>The Mementer: The Chronogram of Life</h1>
            <div style="display: flex; margin-bottom: 20px">
            <div style="display: flex; align-items: center; margin-right: 20px">
                <p style="margin: 0">Total duration (seconds)</p>
                <input
                  type='number'
                  .value=${this.totalDuration}
                  @keyup=${(e: any) => this.updateTotalDuration(e.target.value)}
                  @change=${(e: any) => this.updateTotalDuration(e.target.value)}
                  style="width: 100px; height: 30px; margin-left: 10px"
                >
              </div>
              <div style="display: flex; align-items: center; margin-right: 20px">
                <p style="margin: 0">Large slices</p>
                <input
                  type='number'
                  .value=${this.numberOfSlices.large}
                  @keyup=${(e: any) => this.updateSlices('large', e.target.value)}
                  @change=${(e: any) => this.updateSlices('large', e.target.value)}
                  style="width: 50px; height: 30px; margin-left: 10px"
                >
              </div>
              <div style="display: flex; align-items: center; margin-right: 20px">
                <p style="margin: 0">Medium slices</p>
                <input
                  type='number'
                  .value=${this.numberOfSlices.medium}
                  @keyup=${(e: any) => this.updateSlices('medium', e.target.value)}
                  @change=${(e: any) => this.updateSlices('medium', e.target.value)}
                  style="width: 50px; height: 30px; margin-left: 10px"
                >
              </div>
              <div style="display: flex; align-items: center; margin-right: 20px">
                <p style="margin: 0">Small slices</p>
                <input
                  type='number'
                  .value=${this.numberOfSlices.small}
                  @keyup=${(e: any) => this.updateSlices('small', e.target.value)}
                  @change=${(e: any) => this.updateSlices('small', e.target.value)}
                  style="width: 50px; height: 30px; margin-left: 10px"
                >
              </div>
              <button
                id='timer-button'
                style="all: unset; background-color: #8bc8ff; padding: 0 10px; border-radius: 5px; cursor: pointer"
                @click=${() => this.toggleTimer()}
              >
                Start timer
              </button>
            </div>
            <div id='canvas'></div>
          </div>
        `
    }

    static get scopedElements() {
        return {
        };
      }
    
}