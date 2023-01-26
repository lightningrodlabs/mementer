use hdi::prelude::*;

#[hdk_entry_helper]
#[serde(rename_all = "camelCase")]
#[derive(Clone)]
pub struct MementerEntry {
    pub id: ActionHash,
}

#[hdk_entry_helper]
#[serde(rename_all = "camelCase")]
#[derive(Clone)]
pub struct MementerSettings {
    pub title: String,
    pub start_date: String,
    pub end_date: String,
    pub large_slices: usize,
    pub medium_slices: usize,
    pub small_slices: usize,
}

#[hdk_entry_helper]
#[serde(rename_all = "camelCase")]
#[derive(Clone)]
pub struct Mementer {
    pub entry_hash: EntryHash,
    // pub creator: User,
    pub settings: MementerSettings,
}

#[hdk_entry_helper]
#[derive(Clone)]
#[serde(rename_all = "camelCase")]
pub struct Bead {
    pub text: String,
    pub time_stamp: String,
    pub created_at: String,
}

#[hdk_entry_defs]
#[unit_enum(UnitEntryTypes)]
pub enum EntryTypes {
    MementerEntry(MementerEntry),
    MementerSettings(MementerSettings),
    Bead(Bead)
}

#[hdk_link_types]
pub enum LinkTypes {
    MementerEntry,
    MementerSettings,
    Bead
}