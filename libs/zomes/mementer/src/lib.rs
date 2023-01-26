use hdk::prelude::*;
use hdk::prelude::{holo_hash::{EntryHash, ActionHash}};
use mementer_integrity::*;

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct CreateMementerOutput {
  pub action_hash: ActionHash,
  pub settings_action_hash: ActionHash,
  pub entry_hash: EntryHash
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
          let settings_action_hash: ActionHash = create_link.target_address.clone().into();
          let mementer_entry_hash: EntryHash = create_link.base_address.clone().into();
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
    let mementer_links = get_links(path.path_entry_hash()?, LinkTypes::MementerEntry, None)?;
    // gather settings inputs for each mementer
    let mut inputs = vec![];
    for link in mementer_links {
      inputs.push(GetLinksInput::new(link.target.into(), LinkTypes::MementerSettings.try_into()?, None))
    }

    get_latest_mementer_settings(inputs)
}

#[hdk_extern]
fn get_mementer(mementer_entry_hash: EntryHash) -> ExternResult<Mementer> {
    let inputs = vec![GetLinksInput::new(mementer_entry_hash.into(), LinkTypes::MementerSettings.try_into()?, None)];
    let mementers = get_latest_mementer_settings(inputs).unwrap();
    let mementer: Option<Mementer> = Some(mementers[0].clone());

    Ok(mementer.ok_or(wasm_error!(WasmErrorInner::Guest("Mementer not found".into())))?)
}

#[hdk_extern]
pub fn update_mementer(input: Mementer) -> ExternResult<ActionHash> {
    let settings_action_hash = create_entry(EntryTypes::MementerSettings(input.settings.clone()))?;
    create_link(input.entry_hash, settings_action_hash.clone(), LinkTypes::MementerSettings, ())?;

    Ok(settings_action_hash.into())
}