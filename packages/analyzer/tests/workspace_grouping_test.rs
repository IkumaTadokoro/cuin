use std::fs;
use std::path::PathBuf;
use tempfile::TempDir;

use cuin_analyzer::{AnalysisService, AnalyzerConfig};

fn create_test_workspace(temp_dir: &TempDir) -> PathBuf {
    let root = temp_dir.path();

    fs::write(
        root.join("pnpm-workspace.yaml"),
        "packages:\n  - packages/*\n",
    )
    .unwrap();

    fs::write(
        root.join("package.json"),
        r#"{"name": "test-monorepo", "version": "0.0.0", "private": true}"#,
    )
    .unwrap();

    let shared_dir = root.join("packages/shared");
    fs::create_dir_all(shared_dir.join("src")).unwrap();
    fs::write(
        shared_dir.join("package.json"),
        r#"{"name": "@test/shared", "version": "1.0.0", "main": "src/index.tsx"}"#,
    )
    .unwrap();
    fs::write(
        shared_dir.join("src/index.tsx"),
        r#"export function SharedComponent() {
    return <div>Shared</div>;
}
"#,
    )
    .unwrap();

    let app_a_dir = root.join("packages/app-a");
    fs::create_dir_all(app_a_dir.join("src")).unwrap();
    fs::write(
        app_a_dir.join("package.json"),
        r#"{"name": "@test/app-a", "version": "1.0.0", "dependencies": {"@test/shared": "workspace:*"}}"#,
    )
    .unwrap();
    fs::write(
        app_a_dir.join("tsconfig.json"),
        r#"{"compilerOptions": {"jsx": "react-jsx", "moduleResolution": "bundler"}}"#,
    )
    .unwrap();
    fs::write(
        app_a_dir.join("src/AComponent.tsx"),
        r#"import { SharedComponent } from "@test/shared";

export function AComponent() {
    return <SharedComponent />;
}
"#,
    )
    .unwrap();

    let app_b_dir = root.join("packages/app-b");
    fs::create_dir_all(app_b_dir.join("src")).unwrap();
    fs::write(
        app_b_dir.join("package.json"),
        r#"{"name": "@test/app-b", "version": "1.0.0", "dependencies": {"@test/shared": "1.0.0"}}"#,
    )
    .unwrap();
    fs::write(
        app_b_dir.join("src/BComponent.tsx"),
        r#"import { SharedComponent } from "@test/shared";

export function BComponent() {
    return <SharedComponent />;
}
"#,
    )
    .unwrap();

    #[cfg(unix)]
    {
        let node_modules = root.join("packages/app-a/node_modules/@test");
        fs::create_dir_all(&node_modules).unwrap();
        std::os::unix::fs::symlink(&shared_dir, node_modules.join("shared")).unwrap();

        let node_modules_b = root.join("packages/app-b/node_modules/@test");
        fs::create_dir_all(&node_modules_b).unwrap();
        std::os::unix::fs::symlink(&shared_dir, node_modules_b.join("shared")).unwrap();
    }

    root.to_path_buf()
}

#[test]
fn test_workspace_package_symlink_resolved_to_internal() {
    let temp_dir = TempDir::new().unwrap();
    let workspace_root = create_test_workspace(&temp_dir);

    let config = AnalyzerConfig::default();
    let service = AnalysisService::new(config);

    let app_a_path = workspace_root.join("packages/app-a");
    let report = service.run(&app_a_path).unwrap();

    let json = serde_json::to_string_pretty(&report).unwrap();
    println!("Analysis result for app-a:\n{}", json);

    let has_internal_shared = json.contains(r#""type": "internal""#)
        && json.contains(r#""name": "@test/shared""#);

    println!("Has internal @test/shared: {}", has_internal_shared);

    assert!(
        has_internal_shared,
        "SharedComponent from @test/shared should be detected as internal when symlink is resolved"
    );
}

fn create_injected_workspace(temp_dir: &TempDir) -> PathBuf {
    let root = temp_dir.path();

    fs::write(
        root.join("pnpm-workspace.yaml"),
        "packages:\n  - packages/*\n",
    )
    .unwrap();

    fs::write(
        root.join("package.json"),
        r#"{"name": "test-monorepo", "version": "0.0.0", "private": true}"#,
    )
    .unwrap();

    let shared_dir = root.join("packages/shared");
    fs::create_dir_all(shared_dir.join("src")).unwrap();
    fs::write(
        shared_dir.join("package.json"),
        r#"{"name": "@test/shared", "version": "1.0.0", "main": "src/index.tsx"}"#,
    )
    .unwrap();
    fs::write(
        shared_dir.join("src/index.tsx"),
        r#"export function SharedComponent() {
    return <div>Shared</div>;
}
"#,
    )
    .unwrap();

    let app_a_dir = root.join("packages/app-a");
    fs::create_dir_all(app_a_dir.join("src")).unwrap();
    fs::write(
        app_a_dir.join("package.json"),
        r#"{"name": "@test/app-a", "version": "1.0.0", "dependencies": {"@test/shared": "workspace:*"}}"#,
    )
    .unwrap();
    fs::write(
        app_a_dir.join("tsconfig.json"),
        r#"{"compilerOptions": {"jsx": "react-jsx", "moduleResolution": "bundler"}}"#,
    )
    .unwrap();
    fs::write(
        app_a_dir.join("src/AComponent.tsx"),
        r#"import { SharedComponent } from "@test/shared";

export function AComponent() {
    return <SharedComponent />;
}
"#,
    )
    .unwrap();

    let injected_shared = root.join("packages/app-a/node_modules/@test/shared");
    fs::create_dir_all(injected_shared.join("src")).unwrap();
    fs::write(
        injected_shared.join("package.json"),
        r#"{"name": "@test/shared", "version": "1.0.0", "main": "src/index.tsx"}"#,
    )
    .unwrap();
    fs::write(
        injected_shared.join("src/index.tsx"),
        r#"export function SharedComponent() {
    return <div>Shared</div>;
}
"#,
    )
    .unwrap();

    root.to_path_buf()
}

#[test]
fn test_injected_workspace_package_detected_as_external() {
    let temp_dir = TempDir::new().unwrap();
    let workspace_root = create_injected_workspace(&temp_dir);

    let config = AnalyzerConfig::default();
    let service = AnalysisService::new(config);

    let app_a_path = workspace_root.join("packages/app-a");
    let report = service.run(&app_a_path).unwrap();

    let json = serde_json::to_string_pretty(&report).unwrap();
    println!("Analysis result for app-a (injected):\n{}", json);

    let has_external_shared = json.contains(r#""type": "external""#)
        && json.contains(r#""name": "@test/shared""#);

    println!(
        "Has external @test/shared (injected): {}",
        has_external_shared
    );

    assert!(
        has_external_shared,
        "SharedComponent from @test/shared should be detected as EXTERNAL when injected (file copied, not symlinked)"
    );
}

#[test]
fn test_real_external_package_detected_as_external() {
    let temp_dir = TempDir::new().unwrap();
    let root = temp_dir.path();

    fs::write(
        root.join("package.json"),
        r#"{"name": "test-app", "version": "1.0.0"}"#,
    )
    .unwrap();

    fs::write(
        root.join("tsconfig.json"),
        r#"{"compilerOptions": {"jsx": "react-jsx", "moduleResolution": "bundler"}}"#,
    )
    .unwrap();

    fs::create_dir_all(root.join("src")).unwrap();
    fs::write(
        root.join("src/App.tsx"),
        r#"import { Button } from "external-ui-lib";

export function App() {
    return <Button />;
}
"#,
    )
    .unwrap();

    fs::create_dir_all(root.join("node_modules/external-ui-lib")).unwrap();
    fs::write(
        root.join("node_modules/external-ui-lib/package.json"),
        r#"{"name": "external-ui-lib", "version": "2.0.0", "main": "index.js"}"#,
    )
    .unwrap();
    fs::write(
        root.join("node_modules/external-ui-lib/index.js"),
        r#"export function Button() { return null; }"#,
    )
    .unwrap();

    let config = AnalyzerConfig::default();
    let service = AnalysisService::new(config);

    let report = service.run(root).unwrap();

    let json = serde_json::to_string_pretty(&report).unwrap();
    println!("Analysis result:\n{}", json);

    let has_external = json.contains(r#""type": "external""#)
        && json.contains(r#""name": "external-ui-lib""#);

    println!("Has external external-ui-lib: {}", has_external);

    assert!(
        has_external,
        "Button from external-ui-lib should be detected as external (real node_modules)"
    );
}
