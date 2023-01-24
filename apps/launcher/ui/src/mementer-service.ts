import { CellClient } from '@holochain-open-dev/cell-client'
import { EntryHashB64, AgentPubKeyB64, ActionHashB64 } from '@holochain-open-dev/core-types'
import { serializeHash } from '@holochain-open-dev/utils'
import { MementerSettings, MementerOutput } from './types'

export default class MementerService {
    constructor(public cellClient: CellClient, protected zomeName = 'mementer') {}

    get myAgentPubKey(): any {
        return serializeHash(this.cellClient.cell.cell_id[1])
    }

    async createMementer(input: MementerSettings): Promise<any> {
        return this.callZome('create_mementer', input)
    }

    async getMementers(): Promise<Array<MementerOutput>> {
        return this.callZome('get_mementers', null)
    }

    private callZome(fn_name: string, payload: any) {
        return this.cellClient.callZome(this.zomeName, fn_name, payload)
    }
}
