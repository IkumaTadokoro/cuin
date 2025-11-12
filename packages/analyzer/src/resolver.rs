#![allow(dead_code)]

use dashmap::DashMap;
use oxc_resolver::{ResolveOptions, Resolver, TsconfigOptions, TsconfigReferences};
use serde::Deserialize;
use std::fs;
use std::hash::Hash;
use std::marker::PhantomData;
use std::path::{Path, PathBuf};
use std::sync::Arc;

use crate::AnalysisError;
use crate::parser::{ModuleSpecifier, SourceFile};
use crate::service::Package;

pub struct ModuleResolver {
    fs_context: FileSystemContext,
    tsconfig_cache: Arc<dyn Cache<PathBuf, PathBuf>>,
    resolver_cache: Arc<dyn Cache<PathBuf, Arc<Resolver>>>,
    package_cache: Arc<dyn Cache<PathBuf, Package>>,
}

impl ModuleResolver {
    pub fn new(fs_context: FileSystemContext) -> Self {
        Self {
            fs_context,
            tsconfig_cache: Arc::new(ConcurrentCache::new()),
            resolver_cache: Arc::new(ConcurrentCache::new()),
            package_cache: Arc::new(ConcurrentCache::new()),
        }
    }

    pub fn resolve_package_for_path(&self, path: &Path) -> Option<Package> {
        self.get_package_info(path)
    }

    pub fn resolve(
        &self,
        specifier: &ModuleSpecifier,
        from: &SourceFile,
    ) -> Result<ResolvedModule, AnalysisError> {
        let file_dir = from
            .canonical()
            .parent()
            .ok_or_else(|| AnalysisError::new("Failed to get parent directory"))?;

        let tsconfig_path = self.get_tsconfig(file_dir);

        let resolver = self.get_resolver(&tsconfig_path);

        let resolution = resolver
            .resolve(file_dir, specifier.as_str())
            .map_err(|e| {
                AnalysisError::new(format!(
                    "Failed to resolve module '{}': {}",
                    specifier.as_str(),
                    e
                ))
            })?;

        let resolved_path = resolution.full_path().to_path_buf();
        let canonical_path = resolved_path
            .canonicalize()
            .unwrap_or_else(|_| resolved_path.clone());

        let package_info = self.get_package_info(&canonical_path);

        Ok(ResolvedModule {
            canonical_path,
            package_info,
        })
    }

    fn get_tsconfig(&self, file_dir: &Path) -> PathBuf {
        if let Some(cached) = self.tsconfig_cache.get(&file_dir.to_path_buf()) {
            return cached;
        }

        let tsconfig = self
            .fs_context
            .find_tsconfig(file_dir)
            .unwrap_or_else(|| PathBuf::from("./tsconfig.json"));

        self.tsconfig_cache
            .insert(file_dir.to_path_buf(), tsconfig.clone());

        tsconfig
    }

    fn get_resolver(&self, tsconfig_path: &Path) -> Arc<Resolver> {
        if let Some(cached) = self.resolver_cache.get(&tsconfig_path.to_path_buf()) {
            return cached;
        }

        let resolver = Arc::new(Resolver::new(ResolveOptions {
            tsconfig: Some(TsconfigOptions {
                config_file: tsconfig_path.to_path_buf(),
                references: TsconfigReferences::Auto,
            }),
            extensions: vec![".jsx".into(), ".tsx".into(), ".js".into(), ".ts".into()],
            condition_names: vec!["node".into(), "import".into()],
            ..ResolveOptions::default()
        }));

        self.resolver_cache
            .insert(tsconfig_path.to_path_buf(), resolver.clone());

        resolver
    }

    fn get_package_info(&self, resolved_path: &Path) -> Option<Package> {
        if let Some(cached) = self.package_cache.get(&resolved_path.to_path_buf()) {
            return Some(cached);
        }

        let package_json_path = self.fs_context.find_package_json(resolved_path)?;
        let package_info = load_package_info(&package_json_path)?;

        self.package_cache
            .insert(resolved_path.to_path_buf(), package_info.clone());

        Some(package_info)
    }
}

#[derive(Debug, Clone)]
pub struct ResolvedModule {
    canonical_path: PathBuf,
    package_info: Option<Package>,
}

impl ResolvedModule {
    pub fn canonical_path(&self) -> &Path {
        &self.canonical_path
    }

    pub fn package_info(&self) -> Option<&Package> {
        self.package_info.as_ref()
    }
}

pub trait Cache<K, V>: Send + Sync {
    fn get(&self, key: &K) -> Option<V>;
    fn insert(&self, key: K, value: V);
}

pub struct ConcurrentCache<K, V>
where
    K: Eq + Hash + Clone + Send + Sync,
    V: Clone + Send + Sync,
{
    inner: Arc<DashMap<K, V>>,
}

impl<K, V> ConcurrentCache<K, V>
where
    K: Eq + Hash + Clone + Send + Sync,
    V: Clone + Send + Sync,
{
    pub fn new() -> Self {
        Self {
            inner: Arc::new(DashMap::new()),
        }
    }
}

impl<K, V> Default for ConcurrentCache<K, V>
where
    K: Eq + Hash + Clone + Send + Sync,
    V: Clone + Send + Sync,
{
    fn default() -> Self {
        Self::new()
    }
}

impl<K, V> Cache<K, V> for ConcurrentCache<K, V>
where
    K: Eq + Hash + Clone + Send + Sync,
    V: Clone + Send + Sync,
{
    fn get(&self, key: &K) -> Option<V> {
        self.inner.get(key).map(|v| v.clone())
    }

    fn insert(&self, key: K, value: V) {
        self.inner.insert(key, value);
    }
}

pub struct NoCache<K, V> {
    _phantom: PhantomData<(K, V)>,
}

impl<K, V> NoCache<K, V> {
    pub fn new() -> Self {
        Self {
            _phantom: PhantomData,
        }
    }
}

impl<K, V> Default for NoCache<K, V> {
    fn default() -> Self {
        Self::new()
    }
}

impl<K, V> Cache<K, V> for NoCache<K, V>
where
    K: Send + Sync,
    V: Send + Sync,
{
    fn get(&self, _key: &K) -> Option<V> {
        None
    }

    fn insert(&self, _key: K, _value: V) {}
}

pub struct FileSystemContext {
    project_root: PathBuf,
}

impl FileSystemContext {
    pub fn new(project_root: PathBuf) -> Self {
        Self { project_root }
    }

    pub fn project_root(&self) -> &Path {
        &self.project_root
    }

    pub fn find_tsconfig(&self, start_path: &Path) -> Option<PathBuf> {
        let mut current = start_path.parent()?;

        loop {
            let tsconfig_path = current.join("tsconfig.json");
            if tsconfig_path.exists() {
                return Some(tsconfig_path);
            }

            current = current.parent()?;
        }
    }

    pub fn find_package_json(&self, start_path: &Path) -> Option<PathBuf> {
        let mut current = start_path;

        loop {
            let package_json_path = current.join("package.json");
            if package_json_path.exists() {
                return Some(package_json_path);
            }

            current = current.parent()?;
        }
    }
}

#[derive(Deserialize)]
struct PackageJson {
    name: String,
    version: String,
}

pub(crate) fn load_package_info(package_json_path: &Path) -> Option<Package> {
    let content = fs::read_to_string(package_json_path).ok()?;
    let package_json: PackageJson = sonic_rs::from_str(&content).ok()?;

    Some(Package::new(package_json.name, package_json.version))
}
