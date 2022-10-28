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

    numberOfSlices = { small: 10, medium: 20, large: 30 }

    focusStateRadiusSizes = {
      default: { small: 50, medium: 75, large: 100 },
      small: { small: 80, medium: 90, large: 100 },
      medium: { small: 10, medium: 90, large: 100 },
      large: { small: 10, medium: 20, large: 100 },
    }

    focusState: focusStates = 'default'
  
  
    async connectToHolochain() {
        const url = `ws://localhost:${process.env.HC_PORT}`
        const adminWebsocket = await AdminWebsocket.connect(
          `ws://localhost:${process.env.ADMIN_PORT}`
        );   

    
        const appWebsocket = await AppWebsocket.connect(url)
        const client = new HolochainClient(appWebsocket)
    
        const appInfo = await appWebsocket.appInfo({
          installed_app_id: 'mementer',
        })
    
        const installedCells = appInfo.cell_data;
        const mementerCell = installedCells.find(
          c => c.role_id === 'mementer'
        ) as InstalledCell
    
        const cellClient = new CellClient(client, mementerCell)

        this.loading = false
    }

    async firstUpdated() {
        await this.connectToHolochain();
    }

    findArc(size: sizes, focus: focusStates, start: number, end: number) {
      const outerRadius = this.focusStateRadiusSizes[focus][size]
      const slice = Math.PI * 2 / this.numberOfSlices[size]
      return d3.arc().outerRadius(outerRadius).innerRadius(0).startAngle(start * slice).endAngle(end * slice)
    }

    updated() {
      // build the mementer
      const t = this
      const canvas = t.shadowRoot?.getElementById('canvas')
      const svg = d3.select(canvas!).append('svg').attr('width', 500).attr('height', 500)

      function transitionArcs(size: sizes) {
        const group = t.shadowRoot?.getElementById(`${size}-circle-group`)
        d3.select(group!).selectAll('path').each(function (this: any, d, i: number) {
          d3.select(this).transition().duration(1000).attr('d', <any>t.findArc(size, t.focusState, i, i + 1))
        })
      }

      function updateFocusState(focus: focusStates) {
        t.focusState = focus
        transitionArcs('small')
        transitionArcs('medium')
        transitionArcs('large')
      }

      function createCircle(size: sizes) {
        const circleGroup = svg
          .append('g')
          .attr('id', `${size}-circle-group`)
          .attr('transform', 'translate(250,250)')
          .style('cursor', 'pointer')
          .on('mousedown', () => updateFocusState(size))

        for (let i = 0; i < t.numberOfSlices[size]; i += 1) {
          const arc = t.findArc(size, 'default', i, i + 1)
          circleGroup
            .append('path')
            .attr('id', `${size}-arc-${i}`)
            .attr('d', <any>arc)
            .style('fill', '#ddd')
            .style('stroke', 'black')
            .style('strokeWidth', 5)
        }
      }

      svg
          .append('rect')
          .attr('id', 'background')
          .attr('width', 500)
          .attr('height', 500)
          .attr('fill', 'white')
          .style('cursor', 'pointer')
          .on('mousedown', () => updateFocusState('default'))

      createCircle('large')
      createCircle('medium')
      createCircle('small')
    }

    updateSlices(size: sizes, slices: number) {
      this.numberOfSlices[size] = slices
      const group = d3.select(this.shadowRoot?.getElementById(`${size}-circle-group`)!)
      group.selectAll('path').remove()
      for (let i = 0; i < this.numberOfSlices[size]; i += 1) {
        const arc = this.findArc(size, this.focusState, i, i + 1)
        group
          .append('path')
          .attr('id', `${size}-arc-${i}`)
          .attr('d', <any>arc)
          .style('fill', '#ddd')
          .style('stroke', 'black')
          .style('strokeWidth', 5)
      }
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
            <div style="display: flex">
              <div style="display: flex; align-items: center; margin-right: 10px">
                <p style="margin: 0">Large circle slices</p>
                <input
                  type='number'
                  .value=${this.numberOfSlices.large}
                  @keyup=${(e: any) => this.updateSlices('large', e.target.value)}
                  @change=${(e: any) => this.updateSlices('large', e.target.value)}
                  style="width: 50px; height: 30px; margin-left: 10px"
                >
              </div>
              <div style="display: flex; align-items: center; margin-right: 10px">
                <p style="margin: 0">Medium circle slices</p>
                <input
                  type='number'
                  .value=${this.numberOfSlices.medium}
                  @keyup=${(e: any) => this.updateSlices('medium', e.target.value)}
                  @change=${(e: any) => this.updateSlices('medium', e.target.value)}
                  style="width: 50px; height: 30px; margin-left: 10px"
                >
              </div>
              <div style="display: flex; align-items: center">
                <p style="margin: 0">Small circle slices</p>
                <input
                  type='number'
                  .value=${this.numberOfSlices.small}
                  @keyup=${(e: any) => this.updateSlices('small', e.target.value)}
                  @change=${(e: any) => this.updateSlices('small', e.target.value)}
                  style="width: 50px; height: 30px; margin-left: 10px"
                >
              </div>
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