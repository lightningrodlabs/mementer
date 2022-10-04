use hdk::prelude::*;
use mementer_integrity::*;

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct CreateSegmentInput {
    pub todo: String,
}

#[hdk_extern]
pub fn create_segment(input: CreateSegmentInput) -> ExternResult<ActionHash> {

  let action_hash = create_entry(EntryTypes::Segment(Segment { todo: input.todo }))?;

  Ok(action_hash)
}
