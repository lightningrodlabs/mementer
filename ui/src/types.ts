// TODO: add globally available interfaces for your elements

import { createContext } from "@lit/context";
import { MementerStore } from "./mementer.store";
import { ActionHash, ActionHashB64, EntryHashB64 } from "@holochain/client";

export const mementerContext = createContext<MementerStore>('mementer/service');

export type Dictionary<T> = { [key: string]: T };

export interface CreateSegmentInput {
  todo: string;
}

export interface Segment {
  todo: string;
}

export type MementerSignal =
  | {
    unitHash: ActionHash, message: {type: "NewSegment", content:  Segment}
  }

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