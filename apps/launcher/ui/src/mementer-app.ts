import { LitElement, css, html } from 'lit';
import { property, state } from 'lit/decorators.js';
import { AdminWebsocket, AppWebsocket, InstalledCell } from '@holochain/client';
import { HolochainClient, CellClient } from '@holochain-open-dev/cell-client';
import { ScopedElementsMixin } from '@open-wc/scoped-elements';
import * as d3 from 'd3';

type sizes = 'default' | 'small' | 'medium' | 'large'
  
export class MementerApp extends ScopedElementsMixin(LitElement) {
    @state()
    _loading = true;
  
  
    async connectToHolochain() {
        const url = `ws://localhost:${process.env.HC_PORT}`;
        const adminWebsocket = await AdminWebsocket.connect(
          `ws://localhost:${process.env.ADMIN_PORT}`
        );   

    
        const appWebsocket = await AppWebsocket.connect(url);
        const client = new HolochainClient(appWebsocket);
    
        const appInfo = await appWebsocket.appInfo({
          installed_app_id: 'mementer',
        });
    
        const installedCells = appInfo.cell_data;
        const mementerCell = installedCells.find(
          c => c.role_id === 'mementer'
        ) as InstalledCell;
    
        const cellClient = new CellClient(client, mementerCell);

        this._loading = false;
    }

    async firstUpdated() {
        await this.connectToHolochain();
    }

    

    updated() {
      // build mementer
      const t = this
      const canvas = t.shadowRoot?.getElementById('canvas')
      const svg = d3.select(canvas!).append('svg').attr('width', 500).attr('height', 500)

      function onMouseDown(size: sizes) {
        const smallCircle = t.shadowRoot?.getElementById('small-circle')
        const mediumCircle = t.shadowRoot?.getElementById('medium-circle')
        const largeCircle = t.shadowRoot?.getElementById('large-circle')
        const sizeValues = {
          default: [50, 75, 100],
          small: [80, 90, 100],
          medium: [10, 90, 100],
          large: [10,20,100]
        }
        d3.select(smallCircle!).transition().duration(1000).attr('r', sizeValues[size][0])
        d3.select(mediumCircle!).transition().duration(1000).attr('r', sizeValues[size][1])
        d3.select(largeCircle!).transition().duration(1000).attr('r', sizeValues[size][2])
      }

      svg
          .append('rect')
          .attr('id', 'background')
          .attr('width', 500)
          .attr('height', 500)
          .attr('fill', 'white')
          .style('cursor', 'pointer')
          .on('mousedown', () => onMouseDown('default'))

      function createCircle(size: sizes, radius: number) {
        svg
          .append('circle')
          .attr('id', `${size}-circle`)
          .attr('r', radius)
          .attr('cx', 250)
          .attr('cy', 250)
          .attr('stroke', 'black')
          .attr('strokeWidth', 5)
          .attr('fill', 'white')
          .style('cursor', 'pointer')
          .on('mousedown', () => onMouseDown(size))
      }

      createCircle('large', 100)
      createCircle('medium', 75)
      createCircle('small', 50)
    }

    render() {
        if (this._loading)
          return html`<div
            class="row"
            style="flex: 1; height: 100%; align-items: center; justify-content: center;"
          >
           Loading...
          </div>`;
    
        return html`<div id='canvas' style="flex: 1; height: 100%; width: 100%; align-items: center; justify-content: center;"></div>`
    }

    static get scopedElements() {
        return {
        };
      }
    
}