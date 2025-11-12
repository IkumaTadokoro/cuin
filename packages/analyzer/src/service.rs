use rayon::prelude::*;
use serde::Serialize;
use std::path::{Path, PathBuf};

use crate::AnalysisError;
use crate::analyze::{AnalysisContext, Analyzer, ComponentUsage, group_by_identity};
use crate::config::AnalyzerConfig;
use crate::resolver::{FileSystemContext, ModuleResolver, load_package_info};
use crate::result::AnalysisReport;
use crate::walk;

#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize)]
pub struct Package {
    name: String,
    version: String,
}

impl Package {
    pub fn new(name: String, version: String) -> Self {
        Self { name, version }
    }

    pub fn name(&self) -> &str {
        &self.name
    }

    pub fn version(&self) -> &str {
        &self.version
    }
}

#[derive(Debug, Clone)]
pub struct ProjectContext {
    root: PathBuf,
    package_info: Package,
    tsconfig: Option<PathBuf>,
}

impl ProjectContext {
    pub fn new(root: PathBuf, package_info: Package, tsconfig: Option<PathBuf>) -> Self {
        Self {
            root,
            package_info,
            tsconfig,
        }
    }

    pub fn root(&self) -> &Path {
        &self.root
    }

    pub fn package_info(&self) -> &Package {
        &self.package_info
    }

    pub fn tsconfig(&self) -> Option<&Path> {
        self.tsconfig.as_deref()
    }
}

pub struct AnalysisService {
    config: AnalyzerConfig,
}

impl AnalysisService {
    pub fn new(config: AnalyzerConfig) -> Self {
        Self { config }
    }

    pub fn run(&self, input_path: &Path) -> Result<AnalysisReport, AnalysisError> {
        let project = self.setup_project(input_path)?;

        let target_files = walk::collect_files(&project.input_path, &self.config.target_extensions);
        if target_files.is_empty() {
            return Err(AnalysisError::new("No target files found"));
        }

        let fs_context = FileSystemContext::new(project.project_context.root().to_path_buf());
        let module_resolver = ModuleResolver::new(fs_context);
        let context = AnalysisContext::new(
            project.project_context,
            module_resolver,
            self.config.clone(),
        );

        let analyzer = Analyzer::new();
        let all_usages: Vec<ComponentUsage> = target_files
            .par_iter()
            .flat_map(|file_path| {
                analyzer
                    .analyze_file(file_path, &context)
                    .unwrap_or_default()
            })
            .collect();

        let aggregates = group_by_identity(all_usages);

        let metadata = context.metadata();
        Ok(AnalysisReport::new(metadata, aggregates))
    }

    fn setup_project(&self, input_path: &Path) -> Result<ProjectSetup, AnalysisError> {
        let input_path_buf = input_path
            .canonicalize()
            .map_err(|e| AnalysisError::new(format!("Failed to canonicalize path: {e}")))?;

        let base_path = if input_path_buf.is_file() {
            input_path_buf
                .parent()
                .ok_or_else(|| AnalysisError::new("Failed to get parent directory"))?
                .to_path_buf()
        } else {
            input_path_buf.clone()
        };

        let project_context = self.create_project_context(&base_path)?;

        Ok(ProjectSetup {
            input_path: input_path_buf,
            project_context,
        })
    }

    fn create_project_context(&self, base_path: &Path) -> Result<ProjectContext, AnalysisError> {
        let fs_context = FileSystemContext::new(base_path.to_path_buf());

        let package_json_path = fs_context
            .find_package_json(base_path)
            .ok_or_else(|| AnalysisError::new("package.json not found"))?;

        let package_info = load_package_info(&package_json_path)
            .ok_or_else(|| AnalysisError::new("Failed to load package.json"))?;

        let tsconfig = fs_context.find_tsconfig(base_path);

        Ok(ProjectContext::new(
            base_path.to_path_buf(),
            package_info,
            tsconfig,
        ))
    }
}

impl Default for AnalysisService {
    fn default() -> Self {
        Self::new(AnalyzerConfig::default())
    }
}

struct ProjectSetup {
    input_path: PathBuf,
    project_context: ProjectContext,
}
