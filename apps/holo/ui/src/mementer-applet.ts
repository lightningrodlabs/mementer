import { LitElement, css, html } from 'lit';
import { property, state } from 'lit/decorators.js';
import { AdminWebsocket, AppWebsocket, InstalledCell } from '@holochain/client';
import { HolochainClient, CellClient } from '@holochain-open-dev/cell-client';
import { ScopedElementsMixin } from '@open-wc/scoped-elements';
  
export class MementerApplet extends ScopedElementsMixin(LitElement) {
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
    }
    async firstUpdated() {
        await this.connectToHolochain();
    }
    render() {
        if (this._loading)
          return html`<div
            class="row"
            style="flex: 1; height: 100%; align-items: center; justify-content: center;"
          >
           Loading...
          </div>`;
    
        return html`LOADED!`
    }
    static get scopedElements() {
        return {
        };
      }
    
}