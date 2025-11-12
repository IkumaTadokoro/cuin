mod analyze;
pub mod config;
mod parser;
mod resolver;
pub mod result;
pub mod service;
mod walk;

pub use analyze::{Analyzer, ComponentUsage, ComponentUsageAggregate};
pub use config::AnalyzerConfig;
pub use result::{AnalysisReport, AnalysisResult};
pub use service::AnalysisService;

use std::fmt;

#[derive(Debug, Clone)]
pub struct AnalysisError {
    message: String,
}

impl AnalysisError {
    pub fn new(message: impl Into<String>) -> Self {
        Self {
            message: message.into(),
        }
    }

    pub fn message(&self) -> &str {
        &self.message
    }
}

impl fmt::Display for AnalysisError {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(f, "{}", self.message)
    }
}

impl std::error::Error for AnalysisError {}

impl From<std::io::Error> for AnalysisError {
    fn from(err: std::io::Error) -> Self {
        Self::new(err.to_string())
    }
}

pub type Result<T> = std::result::Result<T, AnalysisError>;

#[cfg(feature = "napi")]
use napi_derive::napi;

#[cfg(feature = "napi")]
#[napi]
pub fn analyze(input_path: String) -> std::result::Result<String, napi::Error> {
    use std::path::Path;

    let config = AnalyzerConfig::default();
    let service = AnalysisService::new(config);

    let report = service
        .run(Path::new(&input_path))
        .map_err(|e| napi::Error::from_reason(e.message().to_string()))?;

    serde_json::to_string_pretty(&report).map_err(|e| napi::Error::from_reason(e.to_string()))
}
