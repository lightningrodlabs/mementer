import { type AppAgentClient, type RoleName, type ZomeName, decodeHashFromBase64, encodeHashToBase64 } from '@holochain/client';
import type { AppletHash, AppletServices, AssetInfo, WAL, WeServices } from '@lightningrodlabs/we-applet';
import { MementerStore } from './mementer.store';
import { getMyDna } from './util';

const ROLE_NAME = "mementer"
const ZOME_NAME = "mementer"

export const appletServices: AppletServices = {
    // Types of attachment that this Applet offers for other Applets to attach
    creatables: {

    },
    bindAsset: async (appletClient: AppAgentClient,
      srcWal: WAL, dstWal: WAL): Promise<void> => {
      console.log("Bind requested.  Src:", srcWal, "  Dst:", dstWal)
    },
  // Types of UI widgets/blocks that this Applet supports
    blockTypes: {
    },
    getAssetInfo: async (
      appletClient: AppAgentClient,
      roleName: RoleName,
      integrityZomeName: ZomeName,
      entryType: string,
      wal: WAL
    ): Promise<AssetInfo | undefined> => {

        const store = new MementerStore(undefined, appletClient, "mementer")
        switch (entryType) {
            case "unitx":
                // const units = await store.pullUnits()
                const unitHash = encodeHashToBase64(wal.hrl[1])
        
                return {
                    icon_src: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" height="16" width="16" viewBox="0 0 512 512"><!--!Font Awesome Free 6.5.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc.--><path d="M464 256A208 208 0 1 0 48 256a208 208 0 1 0 416 0zM0 256a256 256 0 1 1 512 0A256 256 0 1 1 0 256z"/></svg>`,
                    name: "FIXME"//units[unitHash].name,
                };
        }
    },
    search: async (
      appletClient: AppAgentClient,
      appletHash: AppletHash,
      weServices: WeServices,
      searchFilter: string
    ): Promise<Array<WAL>> => {
        const store = new MementerStore(undefined, appletClient, "mementer")
        const dnaHash = await getMyDna(ROLE_NAME, appletClient)
        if (!dnaHash) return []
        //const units = await store.pullUnits()
        const units = {"":{name:"fixme"}} 
        const lower = searchFilter.toLowerCase()
        return Object.entries(units)
            .filter(([_h,unit]) => unit.name.toLowerCase().includes(lower))
            .map(([entryHashB4,unit]) =>{
            return { hrl: [dnaHash, decodeHashFromBase64(entryHashB4)], context: {} }
        })  
            
    },
};
  