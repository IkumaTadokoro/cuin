use serde::Serialize;
use std::path::PathBuf;

use crate::AnalysisError;
use crate::analyze::ComponentUsageAggregate;

#[derive(Debug)]
pub enum AnalysisResult {
    /// Analysis succeeded
    Success { report: AnalysisReport },
    /// No files found
    NoFilesFound,
    /// Invalid path
    InvalidPath(String),
    /// Analysis error
    AnalysisError(AnalysisError),
}

impl AnalysisResult {
    pub fn exit_code(&self) -> i32 {
        match self {
            Self::Success { .. } => 0,
            Self::NoFilesFound => 1,
            Self::InvalidPath(_) => 2,
            Self::AnalysisError(_) => 3,
        }
    }

    pub fn message(&self) -> Option<String> {
        match self {
            Self::Success { .. } => None,
            Self::NoFilesFound => Some("No target files found".to_string()),
            Self::InvalidPath(path) => Some(format!("Invalid path: {path}")),
            Self::AnalysisError(err) => Some(err.message().to_string()),
        }
    }

    pub fn is_success(&self) -> bool {
        matches!(self, Self::Success { .. })
    }
}

impl From<Result<AnalysisReport, AnalysisError>> for AnalysisResult {
    fn from(result: Result<AnalysisReport, AnalysisError>) -> Self {
        match result {
            Ok(report) => Self::Success { report },
            Err(err) => {
                if err.message().contains("No target files") {
                    Self::NoFilesFound
                } else if err.message().contains("canonicalize") {
                    Self::InvalidPath(err.message().to_string())
                } else {
                    Self::AnalysisError(err)
                }
            }
        }
    }
}

#[derive(Debug, Clone, Serialize)]
pub struct AnalysisReport {
    meta: AnalysisMetadata,
    components: Vec<ComponentUsageAggregate>,
}

impl AnalysisReport {
    pub fn new(meta: AnalysisMetadata, aggregates: Vec<ComponentUsageAggregate>) -> Self {
        Self {
            meta,
            components: aggregates,
        }
    }

    pub fn meta(&self) -> &AnalysisMetadata {
        &self.meta
    }

    pub fn components(&self) -> &[ComponentUsageAggregate] {
        &self.components
    }

    pub fn components_mut(&mut self) -> &mut Vec<ComponentUsageAggregate> {
        &mut self.components
    }
}

#[derive(Debug, Clone, Serialize)]
pub struct AnalysisMetadata {
    base_path: String,
}

impl AnalysisMetadata {
    pub fn new(base_path: PathBuf) -> Self {
        Self {
            base_path: base_path.display().to_string(),
        }
    }

    pub fn base_path(&self) -> &str {
        &self.base_path
    }
}
