import { EntryHashB64, AgentPubKeyB64, ActionHashB64 } from '@holochain-open-dev/core-types'

export type MementerSettings = {
    title: String,
    startDate: String,
    endDate: String,
    largeSlices: Number,
    mediumSlices: Number,
    smallSlices: Number,
}

export type Mementer = {
    entryHash: EntryHashB64,
    settings: MementerSettings
}

export type Bead = {
    text: String
    timeStamp: String
    createdAt: String
}

export type BeadInput = {
    entryHash: EntryHashB64,
    bead: Bead
}

export type CreateBeadOutput = {
    headerHash: ActionHashB64
    entryHash: EntryHashB64
}