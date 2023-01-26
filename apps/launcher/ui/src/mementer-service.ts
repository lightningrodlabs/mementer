import { CellClient } from '@holochain-open-dev/cell-client'
import { EntryHashB64, AgentPubKeyB64, ActionHashB64 } from '@holochain-open-dev/core-types'
import { serializeHash } from '@holochain-open-dev/utils'
import { Mementer, MementerSettings } from './types'

export default class MementerService {
    constructor(public cellClient: CellClient, protected zomeName = 'mementer') {}

    get myAgentPubKey(): any {
        return serializeHash(this.cellClient.cell.cell_id[1])
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

    private callZome(fn_name: string, payload: any) {
        return this.cellClient.callZome(this.zomeName, fn_name, payload)
    }
}
