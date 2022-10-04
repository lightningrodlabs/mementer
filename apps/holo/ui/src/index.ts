import { WeApplet } from '@lightningrodlabs/we-applet';
import { CellClient, HolochainClient } from '@holochain-open-dev/cell-client';
import { AppWebsocket, DnaHash } from '@holochain/client';
import { html, render } from 'lit';

import { MementerApplet } from './mementer-applet';

const mementerGame: WeApplet = {
 async appletRenderers(appWs: AppWebsocket, adminWs, weServices, appletInfo) {
    const mementerCell = appletInfo[0].installedAppInfo.cell_data.find(
      c => c.role_id === 'mementer'
    )!;
    const mementerDnaHash = appletInfo[0].installedAppInfo.cell_data.find(c => c.role_id === 'mementer')
      ?.cell_id[0];

    return {
      full: (rootElement: HTMLElement, registry: CustomElementRegistry) => {
        registry.define('mementer-applet', MementerApplet);

        rootElement.innerHTML = `<mementer-applet
        id="applet"
      ></mementer-applet>`;

        const appletEl = rootElement.querySelector('#applet') as any;
      },
      blocks: [],
    };
  },
};

export default mementerGame;
