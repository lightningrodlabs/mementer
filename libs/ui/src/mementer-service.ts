import { CellClient } from '@holochain-open-dev/cell-client';
import { Dictionary } from '@holochain-open-dev/core-types';
import { EntryHash } from '@holochain/client';
import { CreateSegmentInput, Segment } from './types';

export class MementerService {
  constructor(public cellClient: CellClient, public zomeName = 'notes') {}

  async createSegment(input: CreateSegmentInput): Promise<EntryHash> {
    return this.callZome('create_segment', input);
  }

  async getAllSegmts(): Promise<Dictionary<Segment>> {
    return this.callZome('get_all_segments', null);
  }

  private callZome(fnName: string, payload: any) {
    return this.cellClient.callZome(this.zomeName, fnName, payload);
  }
}
