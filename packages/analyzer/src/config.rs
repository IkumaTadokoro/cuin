#[derive(Debug, Clone)]
pub struct AnalyzerConfig {
    pub target_extensions: Vec<String>,
    pub include_native_elements: bool,
    pub cache_enabled: bool,
}

impl Default for AnalyzerConfig {
    fn default() -> Self {
        Self {
            target_extensions: vec![
                "tsx".to_string(),
                "jsx".to_string(),
                "ts".to_string(),
                "js".to_string(),
            ],
            include_native_elements: true,
            cache_enabled: true,
        }
    }
}
