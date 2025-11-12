use ignore::WalkBuilder;
use std::path::{Path, PathBuf};
use std::sync::mpsc;

pub fn collect_files(path: &Path, extensions: &[String]) -> Vec<PathBuf> {
    let extensions_str: Vec<&str> = extensions.iter().map(|s| s.as_str()).collect();
    collect_files_with_extensions(path, &extensions_str)
}

fn collect_files_with_extensions(path: &Path, extensions: &[&str]) -> Vec<PathBuf> {
    // For a single file
    if path.is_file() {
        return if is_target_file(path, extensions) {
            vec![path.to_path_buf()]
        } else {
            vec![]
        };
    }

    let (tx, rx) = mpsc::channel();
    let extensions_vec: Vec<String> = extensions.iter().map(|s| s.to_string()).collect();

    WalkBuilder::new(path)
        .standard_filters(true)
        .hidden(false)
        .build_parallel()
        .run(|| {
            let tx = tx.clone();
            let extensions = extensions_vec.clone();
            Box::new(move |entry| {
                if let Ok(dir_entry) = entry {
                    if let Some(file_type) = dir_entry.file_type() {
                        if file_type.is_file() {
                            let entry_path = dir_entry.path();
                            if is_target_file(
                                entry_path,
                                &extensions.iter().map(|s| s.as_str()).collect::<Vec<_>>(),
                            ) {
                                let _ = tx.send(entry_path.to_path_buf());
                            }
                        }
                    }
                }
                ignore::WalkState::Continue
            })
        });

    drop(tx);
    rx.iter().collect()
}

#[inline]
fn is_target_file(path: &Path, extensions: &[&str]) -> bool {
    path.extension()
        .and_then(|ext| ext.to_str())
        .map(|ext| extensions.contains(&ext))
        .unwrap_or(false)
}
