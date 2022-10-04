use hdi::prelude::*;

#[hdk_entry_defs]
#[unit_enum(UnitEntryTypes)]
pub enum EntryTypes {
	Segment(Segment),
}

#[hdk_link_types]
pub enum LinkTypes {
    Segments,
}

#[hdk_entry_helper]
#[serde(rename_all = "camelCase")]
#[derive(Clone)]
pub struct Segment {
    pub todo: String,
}
