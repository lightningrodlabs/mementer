import type { WeApplet } from '@lightningrodlabs/we-applet';
import { Controller } from '@lightningrodlabs/mementer';
import { CellClient, HolochainClient } from '@holochain-open-dev/cell-client';
import type { AppWebsocket, InstalledCell } from '@holochain/client';

const talkingStickies: WeApplet = {
 async appletRenderers(appWebsocket: AppWebsocket, adminWs, weServices, appletInfo) {

  const talkingStickiesCell: InstalledCell = appletInfo[0].installedAppInfo.cell_data.find(
    c => c.role_id === 'mementer'
  )!;

    const holochainClient = new HolochainClient(appWebsocket);
    const cellClient = new CellClient(holochainClient, talkingStickiesCell)

    let controller : Controller

    return {
      full: (rootElement: HTMLElement, registry: CustomElementRegistry) => {
        const target = rootElement.attachShadow({ mode: 'open' });
        console.log("ROOT ELEM",target)

        controller = new Controller({
          target,
          props: {
            cellClient,
          }
        });
      },
      blocks: [],
    };
  },
};

export default talkingStickies;
