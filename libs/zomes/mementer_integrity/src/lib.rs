use hdi::prelude::*;

#[hdk_entry_defs]
#[unit_enum(UnitEntryTypes)]
pub enum EntryTypes {
    Mementer(Mementer),
    MementerSettings(MementerSettings)
}

#[hdk_link_types]
pub enum LinkTypes {
    Mementer,
    MementerSettings,
}

#[hdk_entry_helper]
#[serde(rename_all = "camelCase")]
#[derive(Clone)]
pub struct Mementer {
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
