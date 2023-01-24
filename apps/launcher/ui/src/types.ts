import { EntryHashB64, AgentPubKeyB64, ActionHashB64 } from '@holochain-open-dev/core-types'

export type MementerSettings = {
    title: String,
    startDate: String,
    endDate: String,
    largeSlices: Number,
    mediumSlices: Number,
    smallSlices: Number,
}

export type MementerOutput = {
    entryHash: EntryHashB64,
    settings: MementerSettings
}