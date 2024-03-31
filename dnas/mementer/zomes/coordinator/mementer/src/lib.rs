use std::collections::BTreeMap;

use hdk::prelude::hash_type::Wasm;
pub use hdk::prelude::*;
pub use hdi::prelude::Path;
pub use error::{MementerError, MementerResult};

pub mod error;
pub mod signals;
pub mod utils;

use mementer_integrity::*;

#[hdk_extern]
fn init(_: ()) -> ExternResult<InitCallbackResult> {
    // grant unrestricted access to accept_cap_claim so other agents can send us claims
    let mut fns = BTreeSet::new();
    fns.insert((zome_info()?.name, "recv_remote_signal".into()));
    create_cap_grant(CapGrantEntry {
        tag: "".into(),
        // empty access converts to unrestricted
        access: ().into(),
        functions: GrantedFunctions::Listed(fns),
    })?;
    Ok(InitCallbackResult::Pass)
}


#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct CreateMementerOutput {
  pub action_hash: ActionHash,
  pub settings_action_hash: ActionHash,
  pub entry_hash: EntryHash
}

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct CreateOutput {
    pub action_hash: ActionHash,
    pub entry_hash: EntryHash
}

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct CreateBeadInput {
    pub entry_hash: EntryHash,
    pub bead: Bead,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct CreateBeadOutput {
    pub action_hash: ActionHash,
    pub entry_hash: EntryHash,
    pub agent_key: AgentPubKey,
    pub bead: Bead,
    pub timestamp: Timestamp,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct BeadOutput {
  pub entry_hash: EntryHash,
  pub bead: Bead,
}

fn get_mementer_path(_mementer: &MementerEntry) -> ExternResult<Path> {
  let path = Path::from("mementers".to_string());
  let typed_path = path.clone().into_typed(ScopedLinkType::try_from(LinkTypes::MementerEntry)?);
  typed_path.ensure()?;
  
  Ok(path)
}

// todo: include 'creator: User'
fn mementer_from_details(details: Details, mementer_entry_hash: EntryHash) -> ExternResult<Option<Mementer>> {
  match details {
    Details::Record(RecordDetails { record, .. }) => {
      let settings: MementerSettings = record.try_into()?;
      Ok(Some(Mementer {
        entry_hash: mementer_entry_hash.into(),
        // creator,
        settings,
      }))
    }
    _ => Ok(None),
  }
}

fn get_latest_mementer_settings(inputs: Vec<GetLinksInput>) -> ExternResult<Vec<Mementer>> {
  let all_settings = HDK.with(|hdk| hdk.borrow().get_link_details(inputs))?;
  let mut mementers: Vec<Mementer> = vec![];

  for link_details in all_settings {
    // find the most recent linked settings
    let mut latest_action: Option<Action> = None;
    for (action,..) in link_details.into_inner() {
      match latest_action {
        Some(ref a) => if a.timestamp() < action.action().timestamp() { latest_action = Some(action.action().clone()) }
        None => latest_action = Some(action.action().clone())
      }
    }
    // get the settings data
    if let Some(action) = latest_action {
      match action {
        Action::CreateLink(create_link )=> {
          let settings_action_hash: ActionHash = ActionHash::try_from(create_link.target_address.clone()).map_err(|e| wasm_error!(e))?;
          let mementer_entry_hash: EntryHash = EntryHash::try_from(create_link.base_address.clone()).map_err(|e| wasm_error!(e))?;
          if let Some(details) = get_details(settings_action_hash.clone(), GetOptions::default())? {
            if let Some(mementer) = mementer_from_details(details, mementer_entry_hash.into())? {
              mementers.push(mementer);
            }
          }
        }
        _ => ()
      }
    }
  }

  // todo: include creator

  // let creator = get_creator_details(first_action.action().author().clone())?;
  // if let Some(creator) = creator {
  //     // find the most recent linked settings
  //     let mut latest_action: Option<Action> = None;
  //     for (action,..) in link_details.into_inner() {
  //         match latest_action {
  //             Some(ref a) => if a.timestamp() < action.action().timestamp() { latest_action = Some(action.action().clone()) }
  //             None => latest_action = Some(action.action().clone())
  //         }
  //     }
  //     // get the settings data
  //     if let Some(action) = latest_action {
  //         match action {
  //             Action::CreateLink(create_link )=> {
  //                 let settings_action_hash: ActionHash = create_link.target_address.clone().into();
  //                 let mementer_entry_hash: EntryHash = create_link.base_address.clone().into();
  //                 if let Some(details) = get_details(settings_action_hash.clone(), GetOptions::default())? {
  //                     if let Some(mementer) = mementer_from_details(creator, details, mementer_entry_hash.into())? {
  //                       mementers.push(mementer);
  //                     }
  //                 }
  //             }
  //             _ => ()
  //         }
  //     }
  // }
  // }

  Ok(mementers)
}

#[hdk_extern]
pub fn create_mementer(input: MementerSettings) -> ExternResult<CreateMementerOutput> {
  let settings_action_hash = create_entry(EntryTypes::MementerSettings(input.clone()))?;
  let mementer = MementerEntry { id: settings_action_hash.clone() };
  let action_hash = create_entry(EntryTypes::MementerEntry(mementer.clone()))?;
  let hash: EntryHash = hash_entry(&mementer)?;
  let path = get_mementer_path(&mementer)?;
  // link mementers path to new mementer
  create_link(path.path_entry_hash()?, hash.clone(), LinkTypes::MementerEntry, ())?;
  // link mementer to settings
  create_link(hash.clone(), settings_action_hash.clone(), LinkTypes::MementerSettings, ())?;

  Ok(CreateMementerOutput{
    action_hash: action_hash.into(),
    settings_action_hash: settings_action_hash.into(),
    entry_hash: hash.into()
  })
}

#[hdk_extern]
pub fn get_mementers(_: ()) -> ExternResult<Vec<Mementer>> {
    let path = Path::from("mementers".to_string());
    // get links to mementers
    let get_links_input = GetLinksInputBuilder::try_new(path.path_entry_hash()?, LinkTypes::MementerEntry)?.build();
    let mementer_links = get_links(get_links_input)?;
    // gather settings inputs for each mementer
    let mut inputs = vec![];
    for link in mementer_links {
        let get_links_input = GetLinksInputBuilder::try_new(link.target, LinkTypes::MementerSettings)?.build();
        inputs.push(get_links_input)
    }

    get_latest_mementer_settings(inputs)
}

#[hdk_extern]
fn get_mementer(mementer_entry_hash: EntryHash) -> ExternResult<Mementer> {
    let get_links_input = GetLinksInputBuilder::try_new(mementer_entry_hash, LinkTypes::MementerSettings)?.build();

    let mementers = get_latest_mementer_settings(vec![get_links_input]).unwrap();
    let mementer: Option<Mementer> = Some(mementers[0].clone());

    Ok(mementer.ok_or(wasm_error!(WasmErrorInner::Guest("Mementer not found".into())))?)
}

#[hdk_extern]
pub fn update_mementer(input: Mementer) -> ExternResult<ActionHash> {
    let settings_action_hash = create_entry(EntryTypes::MementerSettings(input.settings.clone()))?;
    create_link(input.entry_hash, settings_action_hash.clone(), LinkTypes::MementerSettings, ())?;

    Ok(settings_action_hash.into())
}

#[hdk_extern]
pub fn create_bead(input: CreateBeadInput) -> ExternResult<CreateOutput> {
  let action_hash = create_entry(EntryTypes::Bead(input.bead.clone()))?;
  let hash: EntryHash = hash_entry(&input.bead)?;
  let entry_hash: EntryHash = input.entry_hash.into();
  create_link(AnyLinkableHash::from(entry_hash), AnyLinkableHash::from(hash.clone()), LinkTypes::Bead, ())?;

  Ok(CreateOutput{
    action_hash: action_hash.into(),
    entry_hash: hash.into()
  })
}

fn bead_from_details(details: Details) -> ExternResult<Option<CreateBeadOutput>> {
    match details {
        Details::Entry(EntryDetails { entry, actions, .. }) => {
            let bead: Bead = entry.try_into()?;
            let hash = hash_entry(&bead)?;
            let action = actions[0].clone();
            Ok(Some(CreateBeadOutput {
                entry_hash: hash.into(),
                action_hash: action.as_hash().clone().into(),
                bead, 
                agent_key: action.action().author().clone().into(),
                timestamp: action.action().timestamp(),
            }))
        }
        _ => Ok(None),
    }
}

fn get_beads_inner(base: EntryHash) -> ExternResult<Vec<BeadOutput>> {
    let get_links_input = GetLinksInputBuilder::try_new(base, LinkTypes::Bead)?.build();
    let links = get_links(get_links_input)?;

    let mut get_input = vec![];
    for link in links {
        get_input.push(GetInput::new(AnyDhtHash::try_from(link.target).map_err(|e|wasm_error!(e))?, GetOptions::default()));
    }

    let bead_elements = HDK.with(|hdk| hdk.borrow().get_details(get_input))?;

    let beads_with_details: Vec<CreateBeadOutput> = bead_elements
        .into_iter()
        .filter_map(|me| me)
        .filter_map(|details| bead_from_details(details).ok()?)
        .collect();

    let mut beads: Vec<BeadOutput> = vec![];
    for bead in beads_with_details.clone() {
        // if let Some(player) = get_player_details(bead.clone().agent_key.into())? {
        //     let bead_with_player = BeadWithPlayer { player, bead: bead.bead, timestamp: bead.timestamp };
        let bead_output = BeadOutput { entry_hash: bead.entry_hash, bead: bead.bead };
        beads.push(bead_output);
        // }
    }
    
    Ok(beads)
}

#[hdk_extern]
pub fn get_beads(entry_hash: EntryHash) -> ExternResult<Vec<BeadOutput>> {
    get_beads_inner(entry_hash.into())
}