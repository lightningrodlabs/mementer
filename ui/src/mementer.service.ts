import { AppAgentClient, AgentPubKeyB64, AppAgentCallZomeRequest, RoleName, encodeHashToBase64, EntryHash, AgentPubKey, EntryHashB64 } from '@holochain/client';
import {  BeadInput, CreateBeadOutput, CreateSegmentInput, Dictionary, Mementer, MementerSettings, MementerSignal, Segment} from './types';

export class MementerService {
  constructor(
    public client: AppAgentClient,
    protected roleName: RoleName,
    protected zomeName = 'mementer'
  ) {}

  get myAgentPubKeyB64() : AgentPubKeyB64 {
    return encodeHashToBase64(this.client.myPubKey);
  }

  async getMementers(): Promise<Array<Mementer>> {
    return this.callZome('get_mementers', null)
}

async getMementer(entryHash: EntryHashB64): Promise<Mementer> {
    return this.callZome('get_mementer', entryHash)
}

async createMementer(input: MementerSettings): Promise<EntryHashB64> {
    return this.callZome('create_mementer', input)
}

async updateMementer(input: Mementer): Promise<Mementer> {
    return this.callZome('update_mementer', input)
}

async createBead(input: BeadInput): Promise<CreateBeadOutput> {
    return this.callZome('create_bead', input)
}

async getBeads(entryHash: EntryHashB64): Promise<Array<BeadInput>> {
    return this.callZome('get_beads', entryHash)
}

  async createSegment(input: CreateSegmentInput): Promise<EntryHash> {
    return this.callZome('create_segment', input);
  }

  async getAllSegmts(): Promise<Dictionary<Segment>> {
    return this.callZome('get_all_segments', null);
  }

  async notify(signal: MementerSignal, folks: Array<AgentPubKey>): Promise<void> {
    return this.callZome('notify', {signal, folks});
  }

  private callZome(fnName: string, payload: any) {
    const req: AppAgentCallZomeRequest = {
      role_name: this.roleName,
      zome_name: this.zomeName,
      fn_name: fnName,
      payload
    }
    return this.client.callZome(req);
  }
}
