use hdk::prelude::*;
use std::convert::Infallible;

#[derive(thiserror::Error, Debug)]
pub enum MementerError {
    #[error(transparent)]
    Serialization(#[from] SerializedBytesError),
    #[error(transparent)]
    Infallible(#[from] Infallible),
    #[error(transparent)]
    EntryError(#[from] EntryError),
    #[error("Failed to convert an agent link tag to an agent pub key")]
    AgentTag,
    #[error(transparent)]
    Wasm(#[from] WasmError),
    #[error(transparent)]
    Timestamp(#[from] TimestampError),
    #[error("Tree path does not exist")]
    MissingPath,
    #[error("error converting hash")]
    HashConversionError,
}

pub type MementerResult<T> = Result<T, MementerError>;

impl From<MementerError> for WasmError {
    fn from(c: MementerError) -> Self {
        wasm_error!(WasmErrorInner::Guest(c.to_string()))
    }
}
