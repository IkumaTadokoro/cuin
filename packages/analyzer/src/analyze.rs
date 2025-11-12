use serde::Serialize;
use std::collections::HashMap;
use std::path::Path;

use crate::AnalysisError;
use crate::config::AnalyzerConfig;
use crate::parser::{ImportBinding, ImportedName, OxcParser, SourceFile, SourceLocation};
use crate::resolver::ModuleResolver;
use crate::result::AnalysisMetadata;
use crate::service::{Package, ProjectContext};

pub struct Analyzer {
    parser: OxcParser,
}

impl Analyzer {
    pub fn new() -> Self {
        Self {
            parser: OxcParser::new(),
        }
    }

    pub fn analyze_file(
        &self,
        file_path: &Path,
        context: &AnalysisContext,
    ) -> Result<Vec<ComponentUsage>, AnalysisError> {
        let source_file = SourceFile::new(file_path, context.project_context().root())?;
        let source_text = std::fs::read_to_string(file_path)?;
        let parsed_file = self.parser.parse(&source_text, &source_file)?;

        if parsed_file.jsx_elements().is_empty() {
            return Ok(Vec::new());
        }

        let usages: Vec<ComponentUsage> = parsed_file
            .jsx_elements()
            .iter()
            .filter_map(|element| {
                let binding = parsed_file.find_binding_for_element(element);
                let definition = context.identify_component(element, binding)?;
                let usage_package = context.resolve_package_for_file(element.location());

                Some(ComponentUsage::new(
                    definition,
                    element.clone(),
                    binding.cloned(),
                    usage_package,
                ))
            })
            .collect();

        Ok(usages)
    }
}

impl Default for Analyzer {
    fn default() -> Self {
        Self::new()
    }
}

pub struct AnalysisContext {
    project_context: ProjectContext,
    module_resolver: ModuleResolver,
    config: AnalyzerConfig,
}

impl AnalysisContext {
    pub fn new(
        project_context: ProjectContext,
        module_resolver: ModuleResolver,
        config: AnalyzerConfig,
    ) -> Self {
        Self {
            project_context,
            module_resolver,
            config,
        }
    }

    pub fn project_context(&self) -> &ProjectContext {
        &self.project_context
    }

    pub fn config(&self) -> &AnalyzerConfig {
        &self.config
    }

    pub fn metadata(&self) -> AnalysisMetadata {
        AnalysisMetadata::new(self.project_context.root().to_path_buf())
    }

    pub fn resolve_package_for_file(&self, source_file: &SourceLocation) -> Option<Package> {
        self.module_resolver
            .resolve_package_for_path(source_file.file().canonical())
    }

    pub fn identify_component(
        &self,
        element: &JSXElementOccurrence,
        binding: Option<&ImportBinding>,
    ) -> Option<ComponentDefinition> {
        if element.tag_name().is_native() {
            if !self.config.include_native_elements {
                return None;
            }

            let tag_name = element.tag_name().display_name();
            let identity = ComponentIdentity::native(tag_name);
            return Some(ComponentDefinition::new(
                identity,
                Some(element.location().clone()),
            ));
        }

        let binding = binding?;

        let resolved = self
            .module_resolver
            .resolve(binding.source(), element.location().file())
            .ok()?;

        let export_name = match binding.imported_name() {
            ImportedName::Named(name) => ExportName::direct(name.clone()),
            ImportedName::Default => ExportName::direct("default"),
            ImportedName::Namespace => match element.tag_name() {
                JSXElementReference::MemberAccess { object: _, members } => {
                    if members.is_empty() {
                        return None;
                    }
                    if members.len() == 1 {
                        ExportName::direct(members[0].clone())
                    } else {
                        ExportName::member(members[0].clone(), members[1].clone())
                    }
                }
                _ => return None,
            },
        };

        let resolved_path_str = resolved.canonical_path().display().to_string();
        let is_external = resolved_path_str.contains("node_modules");

        let (source, package) = if is_external {
            let package = resolved.package_info()?.clone();
            (
                ComponentSource::External {
                    package: package.clone(),
                },
                Some(package),
            )
        } else {
            let canonical_path = resolved.canonical_path().display().to_string();

            let relative_path = if let Ok(stripped) = resolved
                .canonical_path()
                .strip_prefix(self.project_context.root())
            {
                stripped.display().to_string()
            } else {
                canonical_path.clone()
            };

            let package = resolved.package_info()?.clone();
            (
                ComponentSource::Internal {
                    canonical_path: relative_path,
                },
                Some(package),
            )
        };

        let identity = ComponentIdentity::new(source, export_name, package);

        Some(ComponentDefinition::new(
            identity,
            Some(element.location().clone()),
        ))
    }
}

#[derive(Debug, Clone)]
pub struct ComponentDefinition {
    identity: ComponentIdentity,
    source_location: Option<SourceLocation>,
}

impl ComponentDefinition {
    pub fn new(identity: ComponentIdentity, source_location: Option<SourceLocation>) -> Self {
        Self {
            identity,
            source_location,
        }
    }

    pub fn identity(&self) -> &ComponentIdentity {
        &self.identity
    }

    pub fn source_location(&self) -> Option<&SourceLocation> {
        self.source_location.as_ref()
    }
}

#[derive(Debug, Clone)]
pub struct ComponentUsage {
    definition: ComponentDefinition,
    occurrence: JSXElementOccurrence,
    binding: Option<ImportBinding>,
    simplified_props: Vec<SimplifiedProp>,
    usage_package: Option<UsagePackageSchema>,
}

impl ComponentUsage {
    pub fn new(
        definition: ComponentDefinition,
        occurrence: JSXElementOccurrence,
        binding: Option<ImportBinding>,
        usage_package: Option<Package>,
    ) -> Self {
        let mut simplified_props: Vec<SimplifiedProp> = Vec::new();

        // Process regular props and spread props
        for attr in occurrence.attributes() {
            match attr {
                JSXAttribute::Regular(prop) => {
                    simplified_props.push(prop.to_simplified());
                }
                JSXAttribute::Spread(spread) => {
                    // Expand spread (individual props if analyzable, spread itself otherwise)
                    simplified_props.extend(spread.to_simplified_props());
                }
            }
        }

        // If there are children, add them as a children property
        if !occurrence.children().is_empty() {
            if let Some(children_prop) = create_children_prop(occurrence.children()) {
                simplified_props.push(children_prop);
            }
        }

        // Convert Option<Package> to Option<UsagePackageSchema>
        let usage_package_schema =
            if matches!(definition.identity().source(), ComponentSource::Native) {
                // For native elements
                Some(UsagePackageSchema::Native)
            } else {
                // For others, determine from package information
                usage_package.map(|package| {
                    // Determine by checking if file path contains node_modules
                    let file_path = occurrence.location().file().display_path();
                    if file_path.contains("node_modules") {
                        UsagePackageSchema::External { package }
                    } else {
                        UsagePackageSchema::Internal { package }
                    }
                })
            };

        Self {
            definition,
            occurrence,
            binding,
            simplified_props,
            usage_package: usage_package_schema,
        }
    }

    pub fn definition(&self) -> &ComponentDefinition {
        &self.definition
    }

    pub fn occurrence(&self) -> &JSXElementOccurrence {
        &self.occurrence
    }

    pub fn binding(&self) -> Option<&ImportBinding> {
        self.binding.as_ref()
    }

    pub fn simplified_props(&self) -> &[SimplifiedProp] {
        &self.simplified_props
    }

    pub fn to_serializable(&self) -> SerializableComponentUsage {
        SerializableComponentUsage {
            file_path: self.occurrence.location().file().display_path(),
            props: self
                .simplified_props
                .iter()
                .map(|p| p.to_serializable())
                .collect(),
            raw: self.occurrence.raw_text().to_string(),
            span: self.occurrence.location().span().clone(),
            import_specifier: self
                .binding
                .as_ref()
                .map(|b| b.source().as_str().to_string()),
            resolved_path: self
                .definition
                .source_location()
                .map(|loc| loc.file().display_path()),
            usage_package_schema: self.usage_package.clone(),
        }
    }
}

#[derive(Debug, Clone)]
pub struct ComponentUsageAggregate {
    id: String,
    identity: ComponentIdentity,
    display_name: String,
    usages: Vec<ComponentUsage>,
    statistics: UsageStatistics,
}

impl ComponentUsageAggregate {
    pub fn new(identity: ComponentIdentity, usages: Vec<ComponentUsage>) -> Self {
        let id = identity.generate_id();
        let display_name = compute_display_name(&identity, &usages);
        let statistics = UsageStatistics::compute(&usages);

        Self {
            id,
            identity,
            display_name,
            usages,
            statistics,
        }
    }

    pub fn id(&self) -> &str {
        &self.id
    }

    pub fn identity(&self) -> &ComponentIdentity {
        &self.identity
    }

    pub fn display_name(&self) -> &str {
        &self.display_name
    }

    pub fn usages(&self) -> &[ComponentUsage] {
        &self.usages
    }

    pub fn statistics(&self) -> &UsageStatistics {
        &self.statistics
    }

    pub fn to_serializable(&self) -> SerializableComponentGroup {
        SerializableComponentGroup {
            id: self.id.clone(),
            name: self.display_name.clone(),
            identity: self.identity.clone(),
            instances: self.usages.iter().map(|u| u.to_serializable()).collect(),
            props_usages: self
                .statistics
                .prop_patterns()
                .iter()
                .map(|p| p.to_serializable())
                .collect(),
        }
    }

    /// Sort usages for deterministic output in tests
    pub fn sort_usages(&mut self) {
        self.usages.sort_by(|a, b| {
            a.occurrence()
                .location()
                .file()
                .display_path()
                .cmp(&b.occurrence().location().file().display_path())
                .then_with(|| {
                    a.occurrence()
                        .location()
                        .span()
                        .start()
                        .cmp(&b.occurrence().location().span().start())
                })
        });

        self.statistics.sort_prop_patterns();
    }
}

fn compute_display_name(identity: &ComponentIdentity, usages: &[ComponentUsage]) -> String {
    use crate::analyze::ComponentSource;

    if matches!(identity.source(), ComponentSource::Native) {
        if let Some(first_usage) = usages.first() {
            return first_usage.occurrence().tag_name().display_name();
        }
        return String::new();
    }

    let export_name = identity.display_name();

    if export_name == "default" {
        if let Some(first_usage) = usages.first() {
            return first_usage.occurrence().tag_name().display_name();
        }
    }

    export_name
}

pub fn group_by_identity(usages: Vec<ComponentUsage>) -> Vec<ComponentUsageAggregate> {
    let mut groups: HashMap<ComponentIdentity, Vec<ComponentUsage>> = HashMap::new();

    for usage in usages {
        let identity = usage.definition().identity().clone();
        groups.entry(identity).or_default().push(usage);
    }

    groups
        .into_iter()
        .map(|(identity, usages)| ComponentUsageAggregate::new(identity, usages))
        .collect()
}

#[derive(Debug, Clone)]
pub struct SerializableComponentUsage {
    pub file_path: String,
    pub props: Vec<SerializableProp>,
    pub raw: String,
    pub span: crate::parser::Span,
    pub import_specifier: Option<String>,
    pub resolved_path: Option<String>,
    pub usage_package_schema: Option<UsagePackageSchema>,
}

#[derive(Debug, Clone, Serialize)]
pub struct SerializableComponentGroup {
    pub id: String,
    pub name: String,
    #[serde(rename = "package")]
    pub identity: ComponentIdentity,
    pub instances: Vec<SerializableComponentUsage>,
    pub props_usages: Vec<SerializablePropUsage>,
}

#[derive(Debug, Clone)]
pub struct UsageStatistics {
    total_count: usize,
    prop_patterns: Vec<PropPattern>,
}

impl UsageStatistics {
    pub fn compute(usages: &[ComponentUsage]) -> Self {
        let total_count = usages.len();
        let prop_patterns = compute_prop_patterns(usages);

        Self {
            total_count,
            prop_patterns,
        }
    }

    pub fn total_count(&self) -> usize {
        self.total_count
    }

    pub fn prop_patterns(&self) -> &[PropPattern] {
        &self.prop_patterns
    }

    pub fn sort_prop_patterns(&mut self) {
        self.prop_patterns.sort_by(|a, b| a.key.cmp(&b.key));

        for pattern in &mut self.prop_patterns {
            pattern.distribution.sort_by(|a, b| {
                a.raw
                    .cmp(&b.raw)
                    .then_with(|| a.value.cmp(&b.value))
                    .then_with(|| a.value_pattern.cmp(&b.value_pattern))
                    .then_with(|| a.count.cmp(&b.count))
            });
        }
    }
}

#[derive(Debug, Clone)]
pub struct PropPattern {
    key: String,
    distribution: Vec<ValueDistribution>,
}

impl PropPattern {
    pub fn new(key: String, distribution: Vec<ValueDistribution>) -> Self {
        Self { key, distribution }
    }

    pub fn key(&self) -> &str {
        &self.key
    }

    pub fn distribution(&self) -> &[ValueDistribution] {
        &self.distribution
    }

    pub fn to_serializable(&self) -> SerializablePropUsage {
        SerializablePropUsage {
            key: self.key.clone(),
            distribution: self
                .distribution
                .iter()
                .map(|d| d.to_serializable())
                .collect(),
        }
    }
}

#[derive(Debug, Clone)]
pub struct ValueDistribution {
    value_pattern: String,
    value: Option<String>,
    raw: String,
    count: usize,
}

impl ValueDistribution {
    pub fn new(value_pattern: String, value: Option<String>, raw: String, count: usize) -> Self {
        Self {
            value_pattern,
            value,
            raw,
            count,
        }
    }

    pub fn value_pattern(&self) -> &str {
        &self.value_pattern
    }

    pub fn value(&self) -> Option<&str> {
        self.value.as_deref()
    }

    pub fn raw(&self) -> &str {
        &self.raw
    }

    pub fn count(&self) -> usize {
        self.count
    }

    pub fn to_serializable(&self) -> SerializablePropDistribution {
        SerializablePropDistribution {
            value: self.value.clone(),
            raw: self.raw.clone(),
            prop_type: self.value_pattern.clone(),
            count: self.count as u32,
        }
    }
}

/// Generate "children" property from children
fn create_children_prop(children: &[ChildNode]) -> Option<SimplifiedProp> {
    if children.is_empty() {
        return None;
    }

    // Analyze the type of children
    let mut has_text = false;
    let mut has_jsx = false;
    let mut has_expression = false;
    let mut has_fragment = false;

    let mut text_content = Vec::new();

    for child in children {
        match child {
            ChildNode::Text(text) => {
                has_text = true;
                text_content.push(text.clone());
            }
            ChildNode::JSXElement { .. } => has_jsx = true,
            ChildNode::JSXFragment => has_fragment = true,
            ChildNode::Expression { .. } => has_expression = true,
        }
    }

    // Count types
    let type_count = [has_text, has_jsx, has_expression, has_fragment]
        .iter()
        .filter(|&&x| x)
        .count();

    // Determine value_pattern, value, and raw
    let (value_pattern, value, raw) = if type_count > 1 {
        // Multiple types are mixed
        let raw_text = children
            .iter()
            .map(|c| c.raw_text())
            .collect::<Vec<_>>()
            .join("");
        ("mixed".to_string(), None, raw_text)
    } else if has_text && !has_jsx && !has_expression && !has_fragment {
        // Text only
        let text = text_content.join("");
        ("string".to_string(), Some(text.clone()), text)
    } else if has_jsx {
        // JSX elements only
        let raw_text = children
            .iter()
            .map(|c| c.raw_text())
            .collect::<Vec<_>>()
            .join("");
        ("jsx".to_string(), None, raw_text)
    } else if has_fragment {
        // Fragment only
        ("fragment".to_string(), None, "fragment".to_string())
    } else if has_expression {
        // Expression only
        let raw_text = children
            .iter()
            .map(|c| c.raw_text())
            .collect::<Vec<_>>()
            .join("");
        ("expression".to_string(), None, raw_text)
    } else {
        // Other (unexpected)
        ("unknown".to_string(), None, "unknown".to_string())
    };

    Some(SimplifiedProp {
        key: "children".to_string(),
        value_pattern,
        value,
        raw,
    })
}

type PropValueKey = (String, Option<String>, String);
type PropPatternMap = HashMap<String, HashMap<PropValueKey, usize>>;

fn compute_prop_patterns(usages: &[ComponentUsage]) -> Vec<PropPattern> {
    // Count with (pattern, value, raw) as key
    let mut prop_map: PropPatternMap = HashMap::new();

    for usage in usages {
        for prop in usage.simplified_props() {
            let key = prop.key().to_string();
            let value_type_triple = (
                prop.value_pattern().to_string(),
                prop.value().map(|s| s.to_string()),
                prop.raw().to_string(),
            );

            prop_map
                .entry(key)
                .or_default()
                .entry(value_type_triple)
                .and_modify(|count| *count += 1)
                .or_insert(1);
        }
    }

    prop_map
        .into_iter()
        .map(|(key, value_counts)| {
            let distribution: Vec<ValueDistribution> = value_counts
                .into_iter()
                .map(|((pattern, value, raw), count)| {
                    ValueDistribution::new(pattern, value, raw, count)
                })
                .collect();

            PropPattern::new(key, distribution)
        })
        .collect()
}

#[derive(Debug, Clone, Serialize)]
pub struct SerializablePropUsage {
    pub key: String,
    pub distribution: Vec<SerializablePropDistribution>,
}

#[derive(Debug, Clone, Serialize)]
pub struct SerializablePropDistribution {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub value: Option<String>,
    pub raw: String,
    pub prop_type: String,
    pub count: u32,
}
use serde::Serializer;

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum JSXElementReference {
    Direct(String),
    MemberAccess {
        object: String,
        members: Vec<String>,
    },
}

impl JSXElementReference {
    pub fn direct(name: impl Into<String>) -> Self {
        Self::Direct(name.into())
    }

    pub fn member(object: impl Into<String>, members: Vec<String>) -> Self {
        Self::MemberAccess {
            object: object.into(),
            members,
        }
    }

    pub fn display_name(&self) -> String {
        match self {
            Self::Direct(name) => name.clone(),
            Self::MemberAccess { object, members } => {
                let mut parts = vec![object.clone()];
                parts.extend(members.clone());
                parts.join(".")
            }
        }
    }

    pub fn get_identifier(&self) -> &str {
        match self {
            Self::Direct(name) => name,
            Self::MemberAccess { object, .. } => object,
        }
    }

    pub fn is_native(&self) -> bool {
        match self {
            Self::Direct(name) => name
                .chars()
                .next()
                .map(|c| c.is_lowercase())
                .unwrap_or(false),
            Self::MemberAccess { .. } => false,
        }
    }
}

/// Type representing child elements of a JSX element
#[derive(Debug, Clone)]
pub enum ChildNode {
    /// Text node
    Text(String),
    /// JSX element
    JSXElement {
        tag: String, // Tag name
        raw: String, // Complete source code
    },
    /// JSX fragment
    JSXFragment,
    /// Expression (e.g., {value}, {isLoading ? "Loading..." : "Submit"})
    Expression { raw: String, kind: ExpressionKind },
}

impl ChildNode {
    /// Return the type of ChildNode as a string
    pub fn node_type(&self) -> &str {
        match self {
            ChildNode::Text(_) => "text",
            ChildNode::JSXElement { .. } => "jsx",
            ChildNode::JSXFragment => "fragment",
            ChildNode::Expression { .. } => "expression",
        }
    }

    /// Return the raw string representation of ChildNode
    pub fn raw_text(&self) -> String {
        match self {
            ChildNode::Text(text) => text.clone(),
            ChildNode::JSXElement { raw, .. } => raw.clone(),
            ChildNode::JSXFragment => "<>...</>".to_string(),
            ChildNode::Expression { raw, .. } => format!("{{{raw}}}"),
        }
    }
}

#[derive(Debug, Clone)]
pub struct JSXElementOccurrence {
    location: SourceLocation,
    tag_name: JSXElementReference,
    attributes: Vec<JSXAttribute>,
    raw_text: String,
    children: Vec<ChildNode>,
}

impl JSXElementOccurrence {
    pub fn new(
        location: SourceLocation,
        tag_name: JSXElementReference,
        attributes: Vec<JSXAttribute>,
        raw_text: String,
        children: Vec<ChildNode>,
    ) -> Self {
        Self {
            location,
            tag_name,
            attributes,
            raw_text,
            children,
        }
    }

    pub fn location(&self) -> &SourceLocation {
        &self.location
    }

    pub fn tag_name(&self) -> &JSXElementReference {
        &self.tag_name
    }

    pub fn attributes(&self) -> &[JSXAttribute] {
        &self.attributes
    }

    pub fn raw_text(&self) -> &str {
        &self.raw_text
    }

    pub fn children(&self) -> &[ChildNode] {
        &self.children
    }
}

#[derive(Debug, Clone, PartialEq, Eq, Hash)]
pub enum ComponentSource {
    Internal { canonical_path: String },
    External { package: Package },
    Native,
}

#[derive(Debug, Clone, PartialEq, Eq, Hash)]
pub enum ExportName {
    Direct(String),
    Member { object: String, property: String },
}

impl ExportName {
    pub fn direct(name: impl Into<String>) -> Self {
        Self::Direct(name.into())
    }

    pub fn member(object: impl Into<String>, property: impl Into<String>) -> Self {
        Self::Member {
            object: object.into(),
            property: property.into(),
        }
    }

    pub fn display_name(&self) -> String {
        match self {
            Self::Direct(name) => name.clone(),
            Self::Member { object, property } => format!("{object}.{property}"),
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq, Hash)]
pub struct ComponentIdentity {
    source: ComponentSource,
    export_name: ExportName,
    package: Option<Package>,
}

/// Type representing package information of the usage location
#[derive(Debug, Clone)]
pub enum UsagePackageSchema {
    Internal { package: Package },
    External { package: Package },
    Native,
}

impl Serialize for UsagePackageSchema {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        use serde::ser::SerializeMap;

        match self {
            UsagePackageSchema::Internal { package } => {
                let mut map = serializer.serialize_map(Some(3))?;
                map.serialize_entry("type", "internal")?;
                map.serialize_entry("name", package.name())?;
                map.serialize_entry("version", package.version())?;
                map.end()
            }
            UsagePackageSchema::External { package } => {
                let mut map = serializer.serialize_map(Some(3))?;
                map.serialize_entry("type", "external")?;
                map.serialize_entry("name", package.name())?;
                map.serialize_entry("version", package.version())?;
                map.end()
            }
            UsagePackageSchema::Native => {
                let mut map = serializer.serialize_map(Some(1))?;
                map.serialize_entry("type", "native")?;
                map.end()
            }
        }
    }
}

impl ComponentIdentity {
    pub fn new(source: ComponentSource, export_name: ExportName, package: Option<Package>) -> Self {
        Self {
            source,
            export_name,
            package,
        }
    }

    pub fn native(tag_name: impl Into<String>) -> Self {
        Self {
            source: ComponentSource::Native,
            export_name: ExportName::Direct(tag_name.into()),
            package: None,
        }
    }

    pub fn source(&self) -> &ComponentSource {
        &self.source
    }

    pub fn export_name(&self) -> &ExportName {
        &self.export_name
    }

    pub fn package(&self) -> Option<&Package> {
        self.package.as_ref()
    }

    pub fn display_name(&self) -> String {
        self.export_name.display_name()
    }

    /// Generate a deterministic hash ID from Identity
    pub fn generate_id(&self) -> String {
        use std::collections::hash_map::DefaultHasher;
        use std::hash::{Hash, Hasher};

        let mut hasher = DefaultHasher::new();
        self.hash(&mut hasher);
        format!("{:016x}", hasher.finish())
    }
}

impl Serialize for ComponentIdentity {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        use serde::ser::SerializeMap;

        match &self.source {
            ComponentSource::Internal { canonical_path } => {
                let mut map = serializer.serialize_map(Some(4))?;
                map.serialize_entry("type", "internal")?;
                map.serialize_entry("canonical_path", canonical_path)?;
                if let Some(pkg) = &self.package {
                    map.serialize_entry("name", pkg.name())?;
                    map.serialize_entry("version", pkg.version())?;
                }
                map.end()
            }
            ComponentSource::External { package } => {
                let mut map = serializer.serialize_map(Some(3))?;
                map.serialize_entry("type", "external")?;
                map.serialize_entry("name", package.name())?;
                map.serialize_entry("version", package.version())?;
                map.end()
            }
            ComponentSource::Native => {
                let mut map = serializer.serialize_map(Some(1))?;
                map.serialize_entry("type", "native")?;
                map.end()
            }
        }
    }
}

#[derive(Debug, Clone)]
pub enum JSXAttribute {
    Regular(PropAssignment),
    Spread(SpreadAttribute),
}

impl JSXAttribute {
    pub fn as_regular(&self) -> Option<&PropAssignment> {
        match self {
            JSXAttribute::Regular(prop) => Some(prop),
            JSXAttribute::Spread(_) => None,
        }
    }
}

#[derive(Debug, Clone)]
pub struct PropAssignment {
    name: PropName,
    value: PropValue,
}

impl PropAssignment {
    pub fn new(name: PropName, value: PropValue) -> Self {
        Self { name, value }
    }

    pub fn name(&self) -> &PropName {
        &self.name
    }

    pub fn value(&self) -> &PropValue {
        &self.value
    }

    pub fn to_simplified(&self) -> SimplifiedProp {
        let key = self.name.as_string();
        let (value_pattern, value, raw) = self.value.to_pattern_value_and_raw();

        SimplifiedProp {
            key,
            value_pattern,
            value,
            raw,
        }
    }
}

/// Prop name
#[derive(Debug, Clone)]
pub enum PropName {
    Simple(String),
    Namespaced { namespace: String, name: String },
}

impl PropName {
    pub fn as_string(&self) -> String {
        match self {
            PropName::Simple(name) => name.clone(),
            PropName::Namespaced { namespace, name } => format!("{namespace}:{name}"),
        }
    }
}

#[derive(Debug, Clone)]
pub enum PropValue {
    StringLiteral(String),
    BooleanImplicit,
    Expression { raw: String, kind: ExpressionKind },
    JSXElement(String),
    JSXFragment,
    Mixed(String),
}

impl PropValue {
    pub fn to_pattern_value_and_raw(&self) -> (String, Option<String>, String) {
        match self {
            PropValue::StringLiteral(s) => ("string".to_string(), Some(s.clone()), s.clone()),
            PropValue::BooleanImplicit => (
                "boolean".to_string(),
                Some("true".to_string()),
                "true".to_string(),
            ),
            PropValue::Expression { raw, kind } => {
                let pattern = match kind {
                    ExpressionKind::Literal => "literal",
                    ExpressionKind::Identifier => "identifier",
                    ExpressionKind::MemberExpression => "member",
                    ExpressionKind::CallExpression => "call",
                    ExpressionKind::ArrowFunction => "arrow",
                    ExpressionKind::ConditionalExpression => "conditional",
                    ExpressionKind::Complex => "expression",
                };

                let value = if matches!(kind, ExpressionKind::Literal) {
                    Some(raw.clone())
                } else {
                    None
                };

                (pattern.to_string(), value, raw.clone())
            }
            PropValue::JSXElement(_) => ("jsx".to_string(), None, "jsx".to_string()),
            PropValue::JSXFragment => ("fragment".to_string(), None, "fragment".to_string()),
            PropValue::Mixed(raw) => ("mixed".to_string(), None, raw.clone()),
        }
    }
}

#[derive(Debug, Clone)]
pub enum ExpressionKind {
    Literal,               // {123}, {true}, {null}
    Identifier,            // {value}
    MemberExpression,      // {state.isOpen}, {obj.prop}
    CallExpression,        // {getValue()}, {fn(arg)}
    ArrowFunction,         // {() => {}}, {(x) => x + 1}
    ConditionalExpression, // {condition ? a : b}
    Complex,               // other
}

#[derive(Debug, Clone)]
pub struct SpreadAttribute {
    source: String,
    resolved_props: Option<Vec<ResolvedProp>>,
}

impl SpreadAttribute {
    pub fn new(source: String) -> Self {
        Self {
            source,
            resolved_props: None,
        }
    }

    pub fn new_with_resolved(source: String, resolved_props: Vec<ResolvedProp>) -> Self {
        Self {
            source,
            resolved_props: Some(resolved_props),
        }
    }

    pub fn source(&self) -> &str {
        &self.source
    }

    pub fn resolved_props(&self) -> Option<&[ResolvedProp]> {
        self.resolved_props.as_deref()
    }

    pub fn is_resolved(&self) -> bool {
        self.resolved_props.is_some()
    }

    pub fn to_simplified_props(&self) -> Vec<SimplifiedProp> {
        if let Some(props) = &self.resolved_props {
            props.iter().map(|p| p.to_simplified()).collect()
        } else {
            vec![SimplifiedProp {
                key: "(spread)".to_string(),
                value_pattern: "spread".to_string(),
                value: None,
                raw: self.source.clone(),
            }]
        }
    }
}

#[derive(Debug, Clone)]
pub struct ResolvedProp {
    key: String,
    value_pattern: String,
    value: Option<String>,
    raw: String,
}

impl ResolvedProp {
    pub fn new(key: String, value_pattern: String, value: Option<String>, raw: String) -> Self {
        Self {
            key,
            value_pattern,
            value,
            raw,
        }
    }

    pub fn key(&self) -> &str {
        &self.key
    }

    pub fn value_pattern(&self) -> &str {
        &self.value_pattern
    }

    pub fn value(&self) -> Option<&str> {
        self.value.as_deref()
    }

    pub fn raw(&self) -> &str {
        &self.raw
    }

    pub fn to_simplified(&self) -> SimplifiedProp {
        SimplifiedProp {
            key: self.key.clone(),
            value_pattern: self.value_pattern.clone(),
            value: self.value.clone(),
            raw: self.raw.clone(),
        }
    }
}

#[derive(Debug, Clone)]
pub struct SimplifiedProp {
    key: String,
    value_pattern: String,
    value: Option<String>,
    raw: String,
}

impl SimplifiedProp {
    pub fn key(&self) -> &str {
        &self.key
    }

    pub fn value_pattern(&self) -> &str {
        &self.value_pattern
    }

    pub fn value(&self) -> Option<&str> {
        self.value.as_deref()
    }

    pub fn raw(&self) -> &str {
        &self.raw
    }

    pub fn to_serializable(&self) -> SerializableProp {
        SerializableProp {
            key: self.key.clone(),
            value: self.value.clone(),
            raw: self.raw.clone(),
            prop_type: self.value_pattern.clone(),
        }
    }
}

#[derive(Debug, Clone, Serialize)]
pub struct SerializableProp {
    pub key: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub value: Option<String>,
    pub raw: String,
    pub prop_type: String,
}

impl Serialize for SerializableComponentUsage {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        use serde::ser::SerializeMap;

        let field_count = if self.usage_package_schema.is_some() {
            7
        } else {
            6
        };

        let mut map = serializer.serialize_map(Some(field_count))?;

        map.serialize_entry("file_path", &self.file_path)?;
        map.serialize_entry("props", &self.props)?;
        map.serialize_entry("raw", &self.raw)?;
        map.serialize_entry("span", &self.span)?;
        map.serialize_entry("import_specifier", &self.import_specifier)?;
        map.serialize_entry("resolved_path", &self.resolved_path)?;

        if let Some(ref schema) = self.usage_package_schema {
            map.serialize_entry("package", schema)?;
        }

        map.end()
    }
}

impl Serialize for ComponentUsageAggregate {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        self.to_serializable().serialize(serializer)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_native_element_identity_preserves_tag_name() {
        let div_identity = ComponentIdentity::native("div");
        let span_identity = ComponentIdentity::native("span");
        let button_identity = ComponentIdentity::native("button");

        assert_eq!(div_identity.display_name(), "div");
        assert_eq!(span_identity.display_name(), "span");
        assert_eq!(button_identity.display_name(), "button");

        assert_ne!(div_identity.generate_id(), span_identity.generate_id());
        assert_ne!(div_identity.generate_id(), button_identity.generate_id());
        assert_ne!(span_identity.generate_id(), button_identity.generate_id());
    }

    #[test]
    fn test_native_elements_are_grouped_separately() {
        let div_identity = ComponentIdentity::native("div");
        let span_identity = ComponentIdentity::native("span");

        let mut map = std::collections::HashMap::new();
        map.insert(div_identity.clone(), "div_value");
        map.insert(span_identity.clone(), "span_value");

        assert_eq!(map.len(), 2);
        assert_eq!(map.get(&div_identity), Some(&"div_value"));
        assert_eq!(map.get(&span_identity), Some(&"span_value"));
    }
}
