import { EntryHashB64, AgentPubKeyB64, AppAgentClient, RoleName, encodeHashToBase64, decodeHashFromBase64, AgentPubKey, DnaHash, EntryHash } from '@holochain/client';
import { AgentPubKeyMap, EntryRecord, LazyHoloHashMap } from '@holochain-open-dev/utils';
import { writable, Writable, derived, Readable, get } from 'svelte/store';
import cloneDeep from 'lodash/cloneDeep';
import { MementerService } from './mementer.service';
import {
  Dictionary,
  MementerSignal,
  Segment,
} from './types';
import { Action, ActionHash } from '@holochain/client';
import { WAL, WeClient, weaveUrlFromWal, weaveUrlToWAL } from '@lightningrodlabs/we-applet';
import { WALUrl, getMyDna } from './util';
import { AsyncReadable, manualReloadStore } from '@holochain-open-dev/stores';
import { lazyLoad } from '@holochain-open-dev/stores';

const areEqual = (first: Uint8Array, second: Uint8Array) =>
      first.length === second.length && first.every((value, index) => value === second[index]);

export class MementerStore {
  public service : MementerService
  
  /** Private */
  private segmentsStore: Writable<Dictionary<Segment>> = writable({});   // maps unit hash to unit
  private segmentsActionStore: Writable<Dictionary<Action>> = writable({});   // maps unit hash to unit
  
  /** Static info */
  myAgentPubKey: AgentPubKeyB64;

  /** Readable stores */
  public segments: Readable<Dictionary<Segment>> = derived(this.segmentsStore, i => i)
  public segmentsAction: Readable<Dictionary<Action>> = derived(this.segmentsActionStore, i => i)
  // public unitAttachments: LazyHoloHashMap<EntryHash,AsyncReadable<Array<WAL>>& { reload: () => Promise<void> }> = new LazyHoloHashMap(
  //   unitHash => manualReloadStore(async () => this.getAttachments(encodeHashToBase64(unitHash)))    
  // )
  public dnaHash: DnaHash|undefined

  constructor(
    public weClient: WeClient|undefined,
    protected client: AppAgentClient,
    roleName: RoleName,
    zomeName = 'mementer',

  ) {
    this.myAgentPubKey = encodeHashToBase64(client.myPubKey);
    this.service = new MementerService(client, roleName, zomeName);
    
    getMyDna(roleName, client).then(res=>{
      this.dnaHash = res
    })
    client.on( 'signal', signal => {
      console.log("SIGNAL",signal.payload)
      const payload  = signal.payload as MementerSignal
      switch(payload.message.type) {
      case "NewSegment":
        if (!get(this.segments)[encodeHashToBase64(payload.unitHash)]) {
        //  this.updateUnitFromEntry(new EntryRecord<Unit>(payload.message.content))
        }
        break;
      }
    })
  }

  // async addAttachment(unitHash: EntryHashB64, attachment: WAL) : Promise<undefined> {
  //   const unit = this.unit(unitHash)
  //   if (unit) {
  
  //       await this.service.addAttachment({
  //           unitHash: decodeHashFromBase64(unitHash),
  //           attachment: weaveUrlFromWal(attachment)
  //           }
  //         );
  //       return undefined
  //   }
  //   return undefined
  // }

  // async removeAttachment(unitHash: EntryHashB64, attachment: WAL) : Promise<undefined> {
  //   const unit = this.unit(unitHash)
  //   if (unit) {
  
  //       await this.service.removeAttachment({
  //           unitHash: decodeHashFromBase64(unitHash),
  //           attachment: weaveUrlFromWal(attachment)
  //           }
  //         );
  //       return undefined
  //   }
  //   return undefined
  // }

  // async getAttachments(unitHash: EntryHashB64) : Promise<Array<WAL>> {
  //   const WALUrls = await this.service.getAttachments(decodeHashFromBase64(unitHash))
  //   const wals = WALUrls.map(h=>weaveUrlToWAL(h))
  //   return wals
  // }


}
