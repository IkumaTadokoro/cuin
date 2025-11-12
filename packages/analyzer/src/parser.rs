use oxc::ast::ast::{
    JSXAttributeItem, JSXAttributeName, JSXAttributeValue, JSXChild, JSXElementName, JSXExpression,
    JSXOpeningElement, JSXText,
};
use oxc::{allocator::Allocator, parser::Parser, span::SourceType};
use oxc_ast_visit::Visit;
use oxc_syntax::module_record::{ImportImportName, ModuleRecord};

use crate::AnalysisError;
use crate::analyze::{
    ChildNode, ExpressionKind, JSXAttribute, JSXElementOccurrence, JSXElementReference,
    PropAssignment, PropName, PropValue, ResolvedProp, SpreadAttribute,
};
// SourceFile, SourceLocation, Span, ImportBinding, ImportedName, ModuleSpecifier are defined in this file

pub struct OxcParser;

impl OxcParser {
    pub fn new() -> Self {
        Self
    }

    pub fn parse(&self, source_text: &str, file: &SourceFile) -> Result<ParsedFile, AnalysisError> {
        if !source_text.contains('<') {
            return Ok(ParsedFile::new(Vec::new(), Vec::new()));
        }

        let source_type = SourceType::from_path(file.canonical())
            .unwrap_or_default()
            .with_jsx(true);

        let allocator = Allocator::default();
        let ret = Parser::new(&allocator, source_text, source_type).parse();

        let mut collector = JSXCollector::new(source_text, file);
        collector.visit_program(&ret.program);

        let imports = extract_imports(&ret.module_record);

        Ok(ParsedFile::new(collector.elements, imports))
    }
}

impl Default for OxcParser {
    fn default() -> Self {
        Self::new()
    }
}

/// Parse result
pub struct ParsedFile {
    jsx_elements: Vec<JSXElementOccurrence>,
    imports: Vec<ImportBinding>,
}

impl ParsedFile {
    /// Create a new ParsedFile
    pub fn new(jsx_elements: Vec<JSXElementOccurrence>, imports: Vec<ImportBinding>) -> Self {
        Self {
            jsx_elements,
            imports,
        }
    }

    /// Get the list of JSX elements
    pub fn jsx_elements(&self) -> &[JSXElementOccurrence] {
        &self.jsx_elements
    }

    #[allow(dead_code)]
    pub fn imports(&self) -> &[ImportBinding] {
        &self.imports
    }

    /// Find the ImportBinding corresponding to a JSX element
    pub fn find_binding_for_element(
        &self,
        element: &JSXElementOccurrence,
    ) -> Option<&ImportBinding> {
        let identifier = element.tag_name().get_identifier();
        self.imports
            .iter()
            .find(|binding| binding.local_name() == identifier)
    }
}

struct JSXCollector<'b> {
    elements: Vec<JSXElementOccurrence>,
    source_text: &'b str,
    source_file: &'b SourceFile,
    variables: std::collections::HashMap<String, VariableValue>,
}

impl<'b> JSXCollector<'b> {
    fn new(source_text: &'b str, source_file: &'b SourceFile) -> Self {
        Self {
            elements: Vec::new(),
            source_text,
            source_file,
            variables: std::collections::HashMap::new(),
        }
    }
}

/// Information about a value stored in a variable
#[derive(Debug, Clone)]
enum VariableValue {
    /// Object literal
    ObjectLiteral(Vec<ObjectProperty>),
    /// Other (cannot be analyzed)
    Unknown,
}

/// Property of an object
#[derive(Debug, Clone)]
struct ObjectProperty {
    key: String,
    value_pattern: String,
    value: Option<String>,
    raw: String,
}

impl<'a, 'b> Visit<'a> for JSXCollector<'b> {
    fn visit_variable_declarator(&mut self, it: &oxc::ast::ast::VariableDeclarator<'a>) {
        use oxc::ast::ast::BindingPatternKind;

        // Get the variable name
        if let BindingPatternKind::BindingIdentifier(id) = &it.id.kind {
            let var_name = id.name.to_string();

            // Process only if there is an initialization expression
            if let Some(init) = &it.init {
                let value = analyze_variable_value(init);
                self.variables.insert(var_name, value);
            }
        }

        // Continue default visiting behavior (visit child nodes as well)
        oxc_ast_visit::walk::walk_variable_declarator(self, it);
    }

    fn visit_jsx_element(&mut self, it: &oxc::ast::ast::JSXElement<'a>) {
        let tag_name = format_component_name(&it.opening_element.name);
        let attributes = extract_props(&it.opening_element, &self.variables);
        let span = create_span_with_position(self.source_text, it.span.start, it.span.end);
        let location = SourceLocation::new(self.source_file.clone(), span);
        let raw_text = normalize_indentation(it.span.source_text(self.source_text));
        let children = extract_children(&it.children, self.source_text);

        let element = JSXElementOccurrence::new(location, tag_name, attributes, raw_text, children);
        self.elements.push(element);

        // Recursively visit child JSX elements as well
        // This allows nested JSX elements to be collected individually
        oxc_ast_visit::walk::walk_jsx_element(self, it);
    }
}

/// Extract children of a JSX element
fn extract_children(children: &[JSXChild], source_text: &str) -> Vec<ChildNode> {
    children
        .iter()
        .filter_map(|child| match child {
            JSXChild::Text(text) => {
                let text_value = extract_jsx_text(text);
                // Skip text nodes that are whitespace only
                if text_value.trim().is_empty() {
                    None
                } else {
                    Some(ChildNode::Text(text_value))
                }
            }
            JSXChild::Element(element) => {
                let tag_name = format_component_name(&element.opening_element.name);
                let raw = normalize_indentation(element.span.source_text(source_text));
                Some(ChildNode::JSXElement {
                    tag: tag_name.display_name(),
                    raw,
                })
            }
            JSXChild::Fragment(_) => Some(ChildNode::JSXFragment),
            JSXChild::ExpressionContainer(container) => {
                Some(analyze_jsx_expression_to_child_node(&container.expression))
            }
            JSXChild::Spread(_) => {
                // Treat spread elements as expressions
                Some(ChildNode::Expression {
                    raw: "...spread".to_string(),
                    kind: ExpressionKind::Complex,
                })
            }
        })
        .collect()
}

/// Normalize text (trim + combine consecutive whitespace into one)
fn normalize_text(text: &str) -> String {
    // Remove leading and trailing whitespace
    let trimmed = text.trim();

    // Replace consecutive whitespace characters (spaces, tabs, newlines) with a single space
    let mut result = String::new();
    let mut prev_was_whitespace = false;

    for ch in trimmed.chars() {
        if ch.is_whitespace() {
            if !prev_was_whitespace {
                result.push(' ');
                prev_was_whitespace = true;
            }
        } else {
            result.push(ch);
            prev_was_whitespace = false;
        }
    }

    result
}

/// Extract and normalize string from JSXText
fn extract_jsx_text(text: &JSXText) -> String {
    normalize_text(text.value.as_ref())
}

/// Convert JSXExpression to ChildNode
fn analyze_jsx_expression_to_child_node(expression: &JSXExpression) -> ChildNode {
    match expression {
        // Literal values
        JSXExpression::NumericLiteral(num) => ChildNode::Expression {
            raw: num
                .raw
                .as_ref()
                .map(|s| s.to_string())
                .unwrap_or_else(|| num.value.to_string()),
            kind: ExpressionKind::Literal,
        },
        JSXExpression::BooleanLiteral(bool_lit) => ChildNode::Expression {
            raw: bool_lit.value.to_string(),
            kind: ExpressionKind::Literal,
        },
        JSXExpression::StringLiteral(str_lit) => ChildNode::Expression {
            raw: str_lit.value.to_string(),
            kind: ExpressionKind::Literal,
        },
        JSXExpression::NullLiteral(_) => ChildNode::Expression {
            raw: "null".to_string(),
            kind: ExpressionKind::Literal,
        },

        // Identifier
        JSXExpression::Identifier(id) => ChildNode::Expression {
            raw: id.name.to_string(),
            kind: ExpressionKind::Identifier,
        },

        // JSX elements/fragments
        JSXExpression::JSXElement(element) => {
            let tag_name = format_component_name(&element.opening_element.name);
            // Simplified representation for JSX elements within expressions
            ChildNode::JSXElement {
                tag: tag_name.display_name(),
                raw: format!("<{} />", tag_name.display_name()),
            }
        }
        JSXExpression::JSXFragment(_) => ChildNode::JSXFragment,

        // Conditional expression
        JSXExpression::ConditionalExpression(_) => ChildNode::Expression {
            raw: "<conditional>".to_string(),
            kind: ExpressionKind::ConditionalExpression,
        },

        // Arrow function
        JSXExpression::ArrowFunctionExpression(_) => ChildNode::Expression {
            raw: "() => {}".to_string(),
            kind: ExpressionKind::ArrowFunction,
        },

        // Other complex expressions
        _ => ChildNode::Expression {
            raw: "<expression>".to_string(),
            kind: ExpressionKind::Complex,
        },
    }
}

fn extract_imports(module_record: &ModuleRecord) -> Vec<ImportBinding> {
    module_record
        .import_entries
        .iter()
        .map(|entry| {
            let source = ModuleSpecifier::new(entry.module_request.name.to_string());
            let local_name = entry.local_name.name.to_string();

            let imported_name = match &entry.import_name {
                ImportImportName::Name(name_span) => {
                    ImportedName::Named(name_span.name.to_string())
                }
                ImportImportName::Default(_) => ImportedName::Default,
                ImportImportName::NamespaceObject => ImportedName::Namespace,
            };

            ImportBinding::new(source, imported_name, local_name)
        })
        .collect()
}

fn format_component_name(name: &JSXElementName) -> JSXElementReference {
    match name {
        JSXElementName::Identifier(identifier) => {
            JSXElementReference::direct(identifier.name.to_string())
        }
        JSXElementName::IdentifierReference(it) => JSXElementReference::direct(it.name.to_string()),
        JSXElementName::NamespacedName(it) => {
            JSXElementReference::direct(format!("{}:{}", it.namespace.name, it.name))
        }
        JSXElementName::MemberExpression(it) => {
            let full_name = format!("{}.{}", it.object, it.property);
            let parts: Vec<String> = full_name.split('.').map(|s| s.to_string()).collect();
            if parts.len() >= 2 {
                let object = parts[0].clone();
                let members = parts[1..].to_vec();
                JSXElementReference::member(object, members)
            } else {
                JSXElementReference::direct(full_name)
            }
        }
        JSXElementName::ThisExpression(_) => JSXElementReference::direct("this"),
    }
}

/// Analyze JSXExpression in detail and return PropValue
fn analyze_jsx_expression(expression: &JSXExpression) -> PropValue {
    match expression {
        // Literal values
        JSXExpression::NumericLiteral(num) => PropValue::Expression {
            raw: num
                .raw
                .as_ref()
                .map(|s| s.to_string())
                .unwrap_or_else(|| num.value.to_string()),
            kind: ExpressionKind::Literal,
        },
        JSXExpression::BooleanLiteral(bool_lit) => PropValue::Expression {
            raw: bool_lit.value.to_string(),
            kind: ExpressionKind::Literal,
        },
        JSXExpression::NullLiteral(_) => PropValue::Expression {
            raw: "null".to_string(),
            kind: ExpressionKind::Literal,
        },
        JSXExpression::StringLiteral(str_lit) => PropValue::Expression {
            raw: str_lit.value.to_string(),
            kind: ExpressionKind::Literal,
        },
        JSXExpression::BigIntLiteral(bigint) => PropValue::Expression {
            raw: bigint
                .raw
                .as_ref()
                .map(|s| s.to_string())
                .unwrap_or_else(|| "<bigint>".to_string()),
            kind: ExpressionKind::Literal,
        },

        // Identifier (variable reference)
        JSXExpression::Identifier(id) => PropValue::Expression {
            raw: id.name.to_string(),
            kind: ExpressionKind::Identifier,
        },

        // Member expression
        JSXExpression::StaticMemberExpression(member) => {
            use oxc::ast::ast::Expression;
            // Get the name if object is an identifier, otherwise "<expr>"
            let object_str = if let Expression::Identifier(id) = &member.object {
                id.name.to_string()
            } else {
                "<expr>".to_string()
            };
            let property_str = member.property.name.to_string();
            PropValue::Expression {
                raw: format!("{object_str}.{property_str}"),
                kind: ExpressionKind::MemberExpression,
            }
        }
        JSXExpression::ComputedMemberExpression(member) => {
            use oxc::ast::ast::Expression;
            let object_str = if let Expression::Identifier(id) = &member.object {
                id.name.to_string()
            } else {
                "<expr>".to_string()
            };
            PropValue::Expression {
                raw: format!("{object_str}[<computed>]"),
                kind: ExpressionKind::MemberExpression,
            }
        }
        JSXExpression::PrivateFieldExpression(member) => {
            use oxc::ast::ast::Expression;
            let object_str = if let Expression::Identifier(id) = &member.object {
                id.name.to_string()
            } else {
                "<expr>".to_string()
            };
            PropValue::Expression {
                raw: format!("{}.#{}", object_str, member.field.name),
                kind: ExpressionKind::MemberExpression,
            }
        }

        // 関数呼び出し
        JSXExpression::CallExpression(call) => {
            use oxc::ast::ast::Expression;
            let callee_str = if let Expression::Identifier(id) = &call.callee {
                id.name.to_string()
            } else {
                "<fn>".to_string()
            };
            PropValue::Expression {
                raw: format!("{callee_str}()"),
                kind: ExpressionKind::CallExpression,
            }
        }

        // アロー関数
        JSXExpression::ArrowFunctionExpression(_) => PropValue::Expression {
            raw: "() => {}".to_string(),
            kind: ExpressionKind::ArrowFunction,
        },

        // Conditional expression (ternary operator)
        JSXExpression::ConditionalExpression(_) => PropValue::Expression {
            raw: "<condition> ? <consequent> : <alternate>".to_string(),
            kind: ExpressionKind::ConditionalExpression,
        },

        // JSX element
        JSXExpression::JSXElement(_) => PropValue::JSXElement("jsx".to_string()),
        JSXExpression::JSXFragment(_) => PropValue::JSXFragment,

        // Empty expression
        JSXExpression::EmptyExpression(_) => PropValue::Expression {
            raw: "".to_string(),
            kind: ExpressionKind::Complex,
        },

        // Other complex expressions
        _ => PropValue::Expression {
            raw: "<expression>".to_string(),
            kind: ExpressionKind::Complex,
        },
    }
}

fn extract_props(
    jsx_element: &JSXOpeningElement,
    variables: &std::collections::HashMap<String, VariableValue>,
) -> Vec<JSXAttribute> {
    let mut props = Vec::new();
    for attr in &jsx_element.attributes {
        match attr {
            JSXAttributeItem::Attribute(jsxattribute) => {
                let key = match &jsxattribute.name {
                    JSXAttributeName::Identifier(id) => PropName::Simple(id.name.to_string()),
                    JSXAttributeName::NamespacedName(namespaced) => PropName::Namespaced {
                        namespace: namespaced.namespace.name.to_string(),
                        name: namespaced.name.to_string(),
                    },
                };

                let value = if let Some(value) = &jsxattribute.value {
                    match value {
                        JSXAttributeValue::StringLiteral(string_literal) => {
                            PropValue::StringLiteral(string_literal.value.to_string())
                        }
                        JSXAttributeValue::ExpressionContainer(container) => {
                            analyze_jsx_expression(&container.expression)
                        }
                        JSXAttributeValue::Element(_) => PropValue::JSXElement("jsx".to_string()),
                        JSXAttributeValue::Fragment(_) => PropValue::JSXFragment,
                    }
                } else {
                    PropValue::BooleanImplicit
                };

                props.push(JSXAttribute::Regular(PropAssignment::new(key, value)));
            }
            JSXAttributeItem::SpreadAttribute(spread) => {
                let spread_attr = analyze_spread_attribute(&spread.argument, variables);
                props.push(JSXAttribute::Spread(spread_attr));
            }
        }
    }
    props
}

/// Analyze the value of a variable
fn analyze_variable_value(expr: &oxc::ast::ast::Expression) -> VariableValue {
    use oxc::ast::ast::Expression;

    match expr {
        // Object literal: { key: value, ... }
        Expression::ObjectExpression(obj) => {
            let properties = extract_object_properties(&obj.properties);
            VariableValue::ObjectLiteral(properties)
        }
        // Conditional expression: condition ? obj1 : obj2
        Expression::ConditionalExpression(cond) => {
            // Analyze and merge both branches
            let consequent_value = analyze_variable_value(&cond.consequent);
            let alternate_value = analyze_variable_value(&cond.alternate);
            merge_variable_values(consequent_value, alternate_value)
        }
        // Others cannot be analyzed
        _ => VariableValue::Unknown,
    }
}

/// Extract a list of properties from an object
fn extract_object_properties(
    properties: &oxc::allocator::Vec<oxc::ast::ast::ObjectPropertyKind>,
) -> Vec<ObjectProperty> {
    use oxc::ast::ast::{ObjectPropertyKind, PropertyKey};

    let mut result = Vec::new();

    for prop in properties {
        match prop {
            ObjectPropertyKind::ObjectProperty(obj_prop) => {
                // Get the key name
                let key = match &obj_prop.key {
                    PropertyKey::StaticIdentifier(id) => id.name.to_string(),
                    PropertyKey::StringLiteral(s) => s.value.to_string(),
                    PropertyKey::Identifier(id) => id.name.to_string(),
                    _ => continue, // Skip computed properties, etc.
                };

                // Analyze the value
                let (value_pattern, value, raw) =
                    analyze_expression_to_pattern_value_raw(&obj_prop.value);

                result.push(ObjectProperty {
                    key,
                    value_pattern,
                    value,
                    raw,
                });
            }
            ObjectPropertyKind::SpreadProperty(spread) => {
                // Spread property: { ...other }
                // Can only be processed if the spread source is an identifier,
                // but we skip it here as we don't track variable references
                // Could potentially be resolved recursively in the future
                let _ = spread;
            }
        }
    }

    result
}

/// Analyze an expression and return pattern, value, and raw
fn analyze_expression_to_pattern_value_raw(
    expr: &oxc::ast::ast::Expression,
) -> (String, Option<String>, String) {
    use oxc::ast::ast::Expression;

    match expr {
        Expression::StringLiteral(s) => (
            "string".to_string(),
            Some(s.value.to_string()),
            s.value.to_string(),
        ),
        Expression::NumericLiteral(n) => {
            let raw = n
                .raw
                .as_ref()
                .map(|r| r.to_string())
                .unwrap_or_else(|| n.value.to_string());
            ("literal".to_string(), Some(raw.clone()), raw)
        }
        Expression::BooleanLiteral(b) => {
            let s = b.value.to_string();
            ("literal".to_string(), Some(s.clone()), s)
        }
        Expression::NullLiteral(_) => (
            "literal".to_string(),
            Some("null".to_string()),
            "null".to_string(),
        ),
        Expression::Identifier(id) => {
            let name = id.name.to_string();
            ("identifier".to_string(), None, name)
        }
        Expression::StaticMemberExpression(member) => {
            let object_str = if let Expression::Identifier(id) = &member.object {
                id.name.to_string()
            } else {
                "<expr>".to_string()
            };
            let property_str = member.property.name.to_string();
            let raw = format!("{object_str}.{property_str}");
            ("member".to_string(), None, raw)
        }
        Expression::ArrowFunctionExpression(_) => {
            ("arrow".to_string(), None, "() => {}".to_string())
        }
        Expression::CallExpression(call) => {
            let callee_str = if let Expression::Identifier(id) = &call.callee {
                id.name.to_string()
            } else {
                "<fn>".to_string()
            };
            let raw = format!("{callee_str}()");
            ("call".to_string(), None, raw)
        }
        _ => ("expression".to_string(), None, "<expression>".to_string()),
    }
}

/// Merge two VariableValues (for conditional branches)
fn merge_variable_values(v1: VariableValue, v2: VariableValue) -> VariableValue {
    match (v1, v2) {
        (VariableValue::ObjectLiteral(mut props1), VariableValue::ObjectLiteral(props2)) => {
            // Merge both properties
            props1.extend(props2);
            VariableValue::ObjectLiteral(props1)
        }
        _ => VariableValue::Unknown,
    }
}

/// Analyze spread attribute
fn analyze_spread_attribute(
    expr: &oxc::ast::ast::Expression,
    variables: &std::collections::HashMap<String, VariableValue>,
) -> SpreadAttribute {
    use oxc::ast::ast::Expression;

    match expr {
        // Parenthesized expression: {...(expr)}
        Expression::ParenthesizedExpression(paren) => {
            // Remove parentheses and process recursively
            analyze_spread_attribute(&paren.expression, variables)
        }

        // Object literal: {...{ key: value }}
        Expression::ObjectExpression(obj) => {
            let properties = extract_object_properties(&obj.properties);
            let resolved_props: Vec<ResolvedProp> = properties
                .into_iter()
                .map(|p| ResolvedProp::new(p.key, p.value_pattern, p.value, p.raw))
                .collect();
            SpreadAttribute::new_with_resolved("<inline>".to_string(), resolved_props)
        }

        // Identifier: {...props}
        Expression::Identifier(id) => {
            let var_name = id.name.to_string();
            if let Some(var_value) = variables.get(&var_name) {
                match var_value {
                    VariableValue::ObjectLiteral(properties) => {
                        let resolved_props: Vec<ResolvedProp> = properties
                            .iter()
                            .map(|p| {
                                ResolvedProp::new(
                                    p.key.clone(),
                                    p.value_pattern.clone(),
                                    p.value.clone(),
                                    p.raw.clone(),
                                )
                            })
                            .collect();
                        SpreadAttribute::new_with_resolved(var_name, resolved_props)
                    }
                    VariableValue::Unknown => SpreadAttribute::new(var_name),
                }
            } else {
                // Variable not found (imported values, etc.)
                SpreadAttribute::new(var_name)
            }
        }

        // Member expression: {...obj.props}
        Expression::StaticMemberExpression(member) => {
            let source = if let Expression::Identifier(id) = &member.object {
                format!("{}.{}", id.name, member.property.name)
            } else {
                "<expr>.<member>".to_string()
            };
            // Tracking member expressions is complex, so treat as unanalyzable for now
            SpreadAttribute::new(source)
        }

        // Function call: {...getProps()}
        Expression::CallExpression(call) => {
            let source = if let Expression::Identifier(id) = &call.callee {
                format!("{}()", id.name)
            } else {
                "<fn>()".to_string()
            };
            SpreadAttribute::new(source)
        }

        // Conditional expression: {...(condition ? obj1 : obj2)}
        Expression::ConditionalExpression(cond) => {
            // Analyze both branches
            let consequent_attr = analyze_spread_attribute(&cond.consequent, variables);
            let alternate_attr = analyze_spread_attribute(&cond.alternate, variables);

            // Merge if both can be resolved
            if let (Some(props1), Some(props2)) = (
                consequent_attr.resolved_props(),
                alternate_attr.resolved_props(),
            ) {
                let mut merged_props = props1.to_vec();
                merged_props.extend(props2.iter().cloned());
                SpreadAttribute::new_with_resolved("<conditional>".to_string(), merged_props)
            } else {
                // Unanalyzable if either one cannot be resolved
                SpreadAttribute::new("<conditional>".to_string())
            }
        }

        // Other
        _ => SpreadAttribute::new("<expression>".to_string()),
    }
}

fn offset_to_line_col(source_text: &str, offset: u32) -> (u32, u32) {
    let offset = offset as usize;
    if offset > source_text.len() {
        return (1, 1);
    }

    let mut line = 1u32;
    let mut col = 1u32;

    for (i, ch) in source_text.char_indices() {
        if i >= offset {
            break;
        }
        if ch == '\n' {
            line += 1;
            col = 1;
        } else {
            col += 1;
        }
    }

    (line, col)
}

fn create_span_with_position(source_text: &str, start: u32, end: u32) -> Span {
    let (start_line, start_col) = offset_to_line_col(source_text, start);
    let (end_line, end_col) = offset_to_line_col(source_text, end);

    Span::new(start, end, start_line, start_col, end_line, end_col)
}

/// Remove common leading indentation from all lines and preserve relative indentation
fn normalize_indentation(text: &str) -> String {
    // Split by \n (handles both escape sequences and actual newlines)
    let lines: Vec<&str> = text.split('\n').collect();
    if lines.is_empty() {
        return text.to_string();
    }

    // Calculate the leading whitespace count for each non-empty line, excluding the first line
    let min_indent = lines
        .iter()
        .skip(1) // Exclude the first line
        .filter(|line| !line.trim().is_empty())
        .map(|line| line.len() - line.trim_start().len())
        .min()
        .unwrap_or(0);

    // Remove common indentation from each line (keep the first line as is)
    lines
        .iter()
        .enumerate()
        .map(|(i, line)| {
            if i == 0 {
                // Keep the first line as is
                *line
            } else if line.trim().is_empty() {
                *line
            } else if line.len() >= min_indent {
                &line[min_indent..]
            } else {
                line
            }
        })
        .collect::<Vec<_>>()
        .join("\n")
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::parser::SourceFile;
    use std::path::PathBuf;

    #[test]
    fn test_parse_simple_component() {
        let source = r#"
function App() {
    return <Button className="primary">Click me</Button>
}
"#;

        let file_path = PathBuf::from("/test/App.tsx");
        let source_file = SourceFile::new_for_test(file_path.clone(), PathBuf::from("App.tsx"));

        let parser = OxcParser::new();
        let result = parser.parse(source, &source_file).unwrap();

        assert_eq!(result.jsx_elements().len(), 1);
        let element = &result.jsx_elements()[0];
        assert_eq!(element.tag_name().display_name(), "Button");
        assert_eq!(element.attributes().len(), 1);

        // JSX要素全体（開始タグ～終了タグ）が取得できることを確認
        let raw = element.raw_text();
        assert!(raw.contains("<Button"), "Should contain opening tag");
        assert!(raw.contains("Click me"), "Should contain children text");
        assert!(raw.contains("</Button>"), "Should contain closing tag");
    }

    #[test]
    fn test_parse_member_expression() {
        let source = r#"
const Icons = {
    spinner: <svg>spinner</svg>
}

function App() {
    return <Icons.spinner />
}
"#;

        let file_path = PathBuf::from("/test/App.tsx");
        let source_file = SourceFile::new_for_test(file_path.clone(), PathBuf::from("App.tsx"));

        let parser = OxcParser::new();
        let result = parser.parse(source, &source_file).unwrap();

        // svg と Icons.spinner の2つが収集されるべき
        assert_eq!(
            result.jsx_elements().len(),
            2,
            "Expected 2 elements (svg, Icons.spinner) but got {}",
            result.jsx_elements().len()
        );

        // svgタグが収集されていることを確認
        let svg = result
            .jsx_elements()
            .iter()
            .find(|e| e.tag_name().display_name() == "svg");
        assert!(svg.is_some(), "svg should be collected");

        // Icons.spinnerが収集されていることを確認
        let icons_spinner = result
            .jsx_elements()
            .iter()
            .find(|e| e.tag_name().display_name() == "Icons.spinner");
        assert!(icons_spinner.is_some(), "Icons.spinner should be collected");
    }

    #[test]
    fn test_parse_self_closing_element() {
        let source = r#"
function App() {
    return <Input type="text" />
}
"#;

        let file_path = PathBuf::from("/test/App.tsx");
        let source_file = SourceFile::new_for_test(file_path.clone(), PathBuf::from("App.tsx"));

        let parser = OxcParser::new();
        let result = parser.parse(source, &source_file).unwrap();

        assert_eq!(result.jsx_elements().len(), 1);
        let element = &result.jsx_elements()[0];
        assert_eq!(element.tag_name().display_name(), "Input");

        // 自己終了タグが正しく取得できることを確認
        let raw = element.raw_text();
        assert!(raw.contains("<Input"), "Should contain opening tag");
        assert!(raw.contains("/>"), "Should contain self-closing tag");
        assert!(
            !raw.contains("</Input>"),
            "Should not contain separate closing tag"
        );
    }

    #[test]
    fn test_normalize_indentation() {
        let source = "<HoverCardContent\n          align=\"start\"\n          className=\"w-[260px] text-sm\"\n          side=\"left\"\n        >";

        // normalize_indentation
        let normalized_source = normalize_indentation(source);

        assert_eq!(
            normalized_source,
            "<HoverCardContent\n  align=\"start\"\n  className=\"w-[260px] text-sm\"\n  side=\"left\"\n>"
        );
    }

    #[test]
    fn test_analyze_jsx_expression_literals() {
        let source = r#"
function App() {
    return (
        <Button
            count={42}
            enabled={true}
            disabled={false}
            value={null}
        />
    )
}
"#;

        let file_path = PathBuf::from("/test/App.tsx");
        let source_file = SourceFile::new_for_test(file_path.clone(), PathBuf::from("App.tsx"));

        let parser = OxcParser::new();
        let result = parser.parse(source, &source_file).unwrap();

        assert_eq!(result.jsx_elements().len(), 1);
        let element = &result.jsx_elements()[0];

        // count={42}
        let count_prop = element.attributes().iter().find(|attr| {
            if let crate::analyze::JSXAttribute::Regular(prop) = attr {
                prop.name().as_string() == "count"
            } else {
                false
            }
        });
        assert!(count_prop.is_some());

        // enabled={true}
        let enabled_prop = element.attributes().iter().find(|attr| {
            if let crate::analyze::JSXAttribute::Regular(prop) = attr {
                prop.name().as_string() == "enabled"
            } else {
                false
            }
        });
        assert!(enabled_prop.is_some());
    }

    #[test]
    fn test_analyze_jsx_expression_identifiers() {
        let source = r#"
function App() {
    const disabled = true;
    const handleClick = () => {};

    return (
        <Button
            isDisabled={disabled}
            onClick={handleClick}
        />
    )
}
"#;

        let file_path = PathBuf::from("/test/App.tsx");
        let source_file = SourceFile::new_for_test(file_path.clone(), PathBuf::from("App.tsx"));

        let parser = OxcParser::new();
        let result = parser.parse(source, &source_file).unwrap();

        let button_element = result
            .jsx_elements()
            .iter()
            .find(|e| e.tag_name().display_name() == "Button");
        assert!(button_element.is_some());
    }

    #[test]
    fn test_analyze_jsx_expression_member_access() {
        let source = r#"
function App() {
    const state = { isOpen: true };

    return <Modal isOpen={state.isOpen} />
}
"#;

        let file_path = PathBuf::from("/test/App.tsx");
        let source_file = SourceFile::new_for_test(file_path.clone(), PathBuf::from("App.tsx"));

        let parser = OxcParser::new();
        let result = parser.parse(source, &source_file).unwrap();

        let modal_element = result
            .jsx_elements()
            .iter()
            .find(|e| e.tag_name().display_name() == "Modal");
        assert!(modal_element.is_some());
    }

    #[test]
    fn test_analyze_jsx_expression_function_call() {
        let source = r#"
function App() {
    return <Button onClick={getValue()} />
}
"#;

        let file_path = PathBuf::from("/test/App.tsx");
        let source_file = SourceFile::new_for_test(file_path.clone(), PathBuf::from("App.tsx"));

        let parser = OxcParser::new();
        let result = parser.parse(source, &source_file).unwrap();

        assert_eq!(result.jsx_elements().len(), 1);
    }

    #[test]
    fn test_analyze_jsx_expression_conditional() {
        let source = r#"
function App() {
    const isActive = true;
    return <Button className={isActive ? 'active' : 'inactive'} />
}
"#;

        let file_path = PathBuf::from("/test/App.tsx");
        let source_file = SourceFile::new_for_test(file_path.clone(), PathBuf::from("App.tsx"));

        let parser = OxcParser::new();
        let result = parser.parse(source, &source_file).unwrap();

        assert_eq!(result.jsx_elements().len(), 1);
    }

    #[test]
    fn test_extract_imports() {
        let source = r#"
import Button from "./Button"
import { Input } from "./Input"
import * as Icons from "./icons"

function App() {
    return <Button />
}
"#;

        let file_path = PathBuf::from("/test/App.tsx");
        let source_file = SourceFile::new_for_test(file_path.clone(), PathBuf::from("App.tsx"));

        let parser = OxcParser::new();
        let result = parser.parse(source, &source_file).unwrap();

        assert_eq!(result.imports().len(), 3);

        let button_import = {
            let this = &result;
            &this.imports
        }
        .iter()
        .find(|i| i.local_name() == "Button");
        assert!(button_import.is_some());
        assert_eq!(
            button_import.unwrap().imported_name(),
            &ImportedName::Default
        );

        let input_import = {
            let this = &result;
            &this.imports
        }
        .iter()
        .find(|i| i.local_name() == "Input");
        assert!(input_import.is_some());
        assert_eq!(
            input_import.unwrap().imported_name(),
            &ImportedName::Named("Input".to_string())
        );

        let icons_import = {
            let this = &result;
            &this.imports
        }
        .iter()
        .find(|i| i.local_name() == "Icons");
        assert!(icons_import.is_some());
        assert_eq!(
            icons_import.unwrap().imported_name(),
            &ImportedName::Namespace
        );
    }

    #[test]
    fn test_parse_text_children() {
        let source = r#"
function App() {
    return <Button>Click me</Button>
}
"#;

        let file_path = PathBuf::from("/test/App.tsx");
        let source_file = SourceFile::new_for_test(file_path.clone(), PathBuf::from("App.tsx"));

        let parser = OxcParser::new();
        let result = parser.parse(source, &source_file).unwrap();

        assert_eq!(result.jsx_elements().len(), 1);
        let element = &result.jsx_elements()[0];

        // childrenが収集されていることを確認
        assert_eq!(element.children().len(), 1);

        // テキストchildrenであることを確認
        if let crate::analyze::ChildNode::Text(text) = &element.children()[0] {
            assert_eq!(text, "Click me");
        } else {
            panic!("Expected text child node");
        }
    }

    #[test]
    fn test_parse_jsx_children() {
        let source = r#"
function App() {
    return (
        <Card>
            <Header />
            <Body />
        </Card>
    )
}
"#;

        let file_path = PathBuf::from("/test/App.tsx");
        let source_file = SourceFile::new_for_test(file_path.clone(), PathBuf::from("App.tsx"));

        let parser = OxcParser::new();
        let result = parser.parse(source, &source_file).unwrap();

        // Card, Header, Body の3つが収集されるべき
        assert_eq!(
            result.jsx_elements().len(),
            3,
            "Expected 3 elements (Card, Header, Body) but got {}",
            result.jsx_elements().len()
        );

        // Card要素を検証
        let card = result
            .jsx_elements()
            .iter()
            .find(|e| e.tag_name().display_name() == "Card");
        assert!(card.is_some(), "Card should be collected");

        // Header要素を検証
        let header = result
            .jsx_elements()
            .iter()
            .find(|e| e.tag_name().display_name() == "Header");
        assert!(header.is_some(), "Header should be collected");

        // Body要素を検証
        let body = result
            .jsx_elements()
            .iter()
            .find(|e| e.tag_name().display_name() == "Body");
        assert!(body.is_some(), "Body should be collected");

        // Card要素のchildrenも検証（既存のテスト）
        let card = card.unwrap();
        assert_eq!(card.children().len(), 2);

        // 各childがJSX要素であることを確認
        for child in card.children() {
            assert!(matches!(
                child,
                crate::analyze::ChildNode::JSXElement { .. }
            ));
        }
    }

    #[test]
    fn test_parse_expression_children() {
        let source = r#"
function App() {
    const value = "test";
    return <Button>{value}</Button>
}
"#;

        let file_path = PathBuf::from("/test/App.tsx");
        let source_file = SourceFile::new_for_test(file_path.clone(), PathBuf::from("App.tsx"));

        let parser = OxcParser::new();
        let result = parser.parse(source, &source_file).unwrap();

        let button = result
            .jsx_elements()
            .iter()
            .find(|e| e.tag_name().display_name() == "Button");

        assert!(button.is_some());
        let button = button.unwrap();

        // 式childrenが収集されていることを確認
        assert_eq!(button.children().len(), 1);

        if let crate::analyze::ChildNode::Expression { raw, kind } = &button.children()[0] {
            assert_eq!(raw, "value");
            assert!(matches!(kind, crate::analyze::ExpressionKind::Identifier));
        } else {
            panic!("Expected expression child node");
        }
    }

    #[test]
    fn test_parse_mixed_children() {
        let source = r#"
function App() {
    const count = 42;
    return (
        <div>
            Hello, <span>world</span> {count}
        </div>
    )
}
"#;

        let file_path = PathBuf::from("/test/App.tsx");
        let source_file = SourceFile::new_for_test(file_path.clone(), PathBuf::from("App.tsx"));

        let parser = OxcParser::new();
        let result = parser.parse(source, &source_file).unwrap();

        // divとspanの2つのJSX要素が収集されるべき
        assert_eq!(
            result.jsx_elements().len(),
            2,
            "Expected 2 elements (div, span) but got {}",
            result.jsx_elements().len()
        );

        let div = result
            .jsx_elements()
            .iter()
            .find(|e| e.tag_name().display_name() == "div");
        assert!(div.is_some(), "div should be collected");

        let span = result
            .jsx_elements()
            .iter()
            .find(|e| e.tag_name().display_name() == "span");
        assert!(span.is_some(), "span should be collected");

        let div = div.unwrap();

        // 混在したchildrenが収集されていることを確認
        // "Hello, " (text), <span> (jsx), " " (text - 空白のみなので除外), {count} (expression)
        assert!(div.children().len() >= 3);

        // 最初はテキスト
        assert!(matches!(
            &div.children()[0],
            crate::analyze::ChildNode::Text(_)
        ));
        // 2番目はJSX
        assert!(matches!(
            &div.children()[1],
            crate::analyze::ChildNode::JSXElement { .. }
        ));
        // 3番目は式
        assert!(matches!(
            &div.children()[2],
            crate::analyze::ChildNode::Expression { .. }
        ));
    }

    #[test]
    fn test_parse_conditional_children() {
        let source = r#"
function App() {
    const isLoading = true;
    return <Button>{isLoading ? "Loading..." : "Submit"}</Button>
}
"#;

        let file_path = PathBuf::from("/test/App.tsx");
        let source_file = SourceFile::new_for_test(file_path.clone(), PathBuf::from("App.tsx"));

        let parser = OxcParser::new();
        let result = parser.parse(source, &source_file).unwrap();

        let button = result
            .jsx_elements()
            .iter()
            .find(|e| e.tag_name().display_name() == "Button");

        assert!(button.is_some());
        let button = button.unwrap();

        // 条件式childrenが収集されていることを確認
        assert_eq!(button.children().len(), 1);

        if let crate::analyze::ChildNode::Expression { kind, .. } = &button.children()[0] {
            assert!(matches!(
                kind,
                crate::analyze::ExpressionKind::ConditionalExpression
            ));
        } else {
            panic!("Expected conditional expression child node");
        }
    }

    #[test]
    fn test_text_normalization() {
        // 改行とインデントを含むテキストが正規化されることを確認
        let source = r#"
function App() {
    return (
        <Alert>
          Component{ }
          not found in registry.
        </Alert>
    )
}
"#;

        let file_path = PathBuf::from("/test/App.tsx");
        let source_file = SourceFile::new_for_test(file_path.clone(), PathBuf::from("App.tsx"));

        let parser = OxcParser::new();
        let result = parser.parse(source, &source_file).unwrap();

        let alert = result
            .jsx_elements()
            .iter()
            .find(|e| e.tag_name().display_name() == "Alert");

        assert!(alert.is_some());
        let alert = alert.unwrap();

        // テキストchildrenが正規化されていることを確認
        // "Component"(text) + "{ }"(expression) + "not found in registry."(text)の3つ
        assert_eq!(alert.children().len(), 3);

        // 最初のテキスト: "Component"（正規化済み）
        if let crate::analyze::ChildNode::Text(text) = &alert.children()[0] {
            assert_eq!(text, "Component");
        } else {
            panic!("Expected text child node");
        }

        // 2番目は式: { }
        assert!(matches!(
            &alert.children()[1],
            crate::analyze::ChildNode::Expression { .. }
        ));

        // 3番目のテキスト: "not found in registry."（正規化済み）
        if let crate::analyze::ChildNode::Text(text) = &alert.children()[2] {
            assert_eq!(text, "not found in registry.");
        } else {
            panic!("Expected text child node");
        }
    }

    #[test]
    fn test_spread_inline_object() {
        // インラインオブジェクトのspread: {...{ variant: "hoge", size: "large" }}
        let source = r#"
function App() {
    return <Button {...{ variant: "hoge", size: "large" }} className="primary" />
}
"#;

        let file_path = PathBuf::from("/test/App.tsx");
        let source_file = SourceFile::new_for_test(file_path.clone(), PathBuf::from("App.tsx"));

        let parser = OxcParser::new();
        let result = parser.parse(source, &source_file).unwrap();

        let button = result
            .jsx_elements()
            .iter()
            .find(|e| e.tag_name().display_name() == "Button");

        assert!(button.is_some());
        let button = button.unwrap();

        // spread属性があることを確認
        let spread_attrs: Vec<_> = button
            .attributes()
            .iter()
            .filter_map(|attr| match attr {
                crate::analyze::JSXAttribute::Spread(s) => Some(s),
                _ => None,
            })
            .collect();

        assert_eq!(spread_attrs.len(), 1);
        let spread = spread_attrs[0];

        // インラインオブジェクトなので解析できているはず
        assert!(spread.is_resolved());

        // 解析されたプロパティを確認
        let resolved = spread.resolved_props().unwrap();
        assert_eq!(resolved.len(), 2);

        // variantとsizeが含まれていることを確認
        let variant = resolved.iter().find(|p| p.key() == "variant");
        assert!(variant.is_some());

        let size = resolved.iter().find(|p| p.key() == "size");
        assert!(size.is_some());
    }

    #[test]
    fn test_spread_variable() {
        // 変数のspread: const obj = { variant: "hoge" }; <Button {...obj} />
        let source = r#"
function App() {
    const obj = { variant: "hoge", size: "large" };
    return <Button {...obj} className="primary" />
}
"#;

        let file_path = PathBuf::from("/test/App.tsx");
        let source_file = SourceFile::new_for_test(file_path.clone(), PathBuf::from("App.tsx"));

        let parser = OxcParser::new();
        let result = parser.parse(source, &source_file).unwrap();

        let button = result
            .jsx_elements()
            .iter()
            .find(|e| e.tag_name().display_name() == "Button");

        assert!(button.is_some());
        let button = button.unwrap();

        let spread_attrs: Vec<_> = button
            .attributes()
            .iter()
            .filter_map(|attr| match attr {
                crate::analyze::JSXAttribute::Spread(s) => Some(s),
                _ => None,
            })
            .collect();

        assert_eq!(spread_attrs.len(), 1);
        let spread = spread_attrs[0];

        // 変数objが解析できているはず
        assert!(spread.is_resolved());
        assert_eq!(spread.source(), "obj");

        let resolved = spread.resolved_props().unwrap();
        assert_eq!(resolved.len(), 2);
    }

    #[test]
    fn test_spread_unresolved() {
        // 解析不能なspread: {...getConfig()}
        let source = r#"
function App() {
    return <Button {...getConfig()} className="primary" />
}
"#;

        let file_path = PathBuf::from("/test/App.tsx");
        let source_file = SourceFile::new_for_test(file_path.clone(), PathBuf::from("App.tsx"));

        let parser = OxcParser::new();
        let result = parser.parse(source, &source_file).unwrap();

        let button = result
            .jsx_elements()
            .iter()
            .find(|e| e.tag_name().display_name() == "Button");

        assert!(button.is_some());
        let button = button.unwrap();

        let spread_attrs: Vec<_> = button
            .attributes()
            .iter()
            .filter_map(|attr| match attr {
                crate::analyze::JSXAttribute::Spread(s) => Some(s),
                _ => None,
            })
            .collect();

        assert_eq!(spread_attrs.len(), 1);
        let spread = spread_attrs[0];

        // 関数呼び出しなので解析不能
        assert!(!spread.is_resolved());
        assert_eq!(spread.source(), "getConfig()");
    }

    #[test]
    fn test_spread_conditional() {
        // 条件分岐のspread（インライン）: {...(condition ? { variant: "primary" } : { variant: "secondary" })}
        let source = r#"
function App() {
    return <Button {...(true ? { variant: "primary" } : { variant: "secondary" })} />
}
"#;

        let file_path = PathBuf::from("/test/App.tsx");
        let source_file = SourceFile::new_for_test(file_path.clone(), PathBuf::from("App.tsx"));

        let parser = OxcParser::new();
        let result = parser.parse(source, &source_file).unwrap();

        let button = result
            .jsx_elements()
            .iter()
            .find(|e| e.tag_name().display_name() == "Button");

        assert!(button.is_some());
        let button = button.unwrap();

        let spread_attrs: Vec<_> = button
            .attributes()
            .iter()
            .filter_map(|attr| match attr {
                crate::analyze::JSXAttribute::Spread(s) => Some(s),
                _ => None,
            })
            .collect();

        assert_eq!(spread_attrs.len(), 1);
        let spread = spread_attrs[0];

        // 条件分岐が解析できているはず
        assert!(spread.is_resolved());

        let resolved = spread.resolved_props().unwrap();
        // 両方のvariantが含まれているはず
        assert_eq!(resolved.len(), 2);

        let variants: Vec<_> = resolved.iter().filter(|p| p.key() == "variant").collect();
        assert_eq!(variants.len(), 2);
    }

    #[test]
    fn test_spread_multiple() {
        // 複数のspreadと通常のprops: <Button {...obj1} className="primary" {...obj2} />
        let source = r#"
function App() {
    const obj1 = { variant: "hoge" };
    const obj2 = { size: "large" };
    return <Button {...obj1} className="primary" {...obj2} />
}
"#;

        let file_path = PathBuf::from("/test/App.tsx");
        let source_file = SourceFile::new_for_test(file_path.clone(), PathBuf::from("App.tsx"));

        let parser = OxcParser::new();
        let result = parser.parse(source, &source_file).unwrap();

        let button = result
            .jsx_elements()
            .iter()
            .find(|e| e.tag_name().display_name() == "Button");

        assert!(button.is_some());
        let button = button.unwrap();

        // 全部で3つの属性（spread2つ + className）
        assert_eq!(button.attributes().len(), 3);

        let spread_attrs: Vec<_> = button
            .attributes()
            .iter()
            .filter_map(|attr| match attr {
                crate::analyze::JSXAttribute::Spread(s) => Some(s),
                _ => None,
            })
            .collect();

        assert_eq!(spread_attrs.len(), 2);

        // 両方とも解析できているはず
        assert!(spread_attrs[0].is_resolved());
        assert!(spread_attrs[1].is_resolved());
    }

    #[test]
    fn test_jsx_children_raw_contains_full_source() {
        // JSX childrenのrawに完全なソースコードが含まれることを確認
        let source = r#"
function App() {
    return (
        <Card>
            <Header title="Test" />
        </Card>
    )
}
"#;

        let file_path = PathBuf::from("/test/App.tsx");
        let source_file = SourceFile::new_for_test(file_path.clone(), PathBuf::from("App.tsx"));

        let parser = OxcParser::new();
        let result = parser.parse(source, &source_file).unwrap();

        // Both Card and Header JSX elements should be collected
        assert_eq!(
            result.jsx_elements().len(),
            2,
            "Expected 2 elements (Card, Header) but got {}",
            result.jsx_elements().len()
        );

        let card = result
            .jsx_elements()
            .iter()
            .find(|e| e.tag_name().display_name() == "Card");
        assert!(card.is_some(), "Card should be collected");

        let header = result
            .jsx_elements()
            .iter()
            .find(|e| e.tag_name().display_name() == "Header");
        assert!(header.is_some(), "Header should be collected");

        let card = card.unwrap();

        // JSX childrenが収集されていることを確認
        assert_eq!(card.children().len(), 1);

        if let crate::analyze::ChildNode::JSXElement { tag, raw } = &card.children()[0] {
            assert_eq!(tag, "Header");
            // rawに完全なJSXコード（属性を含む）が含まれていることを確認
            assert!(raw.contains("Header"));
            assert!(raw.contains("title"));
            assert!(raw.contains("Test"));
        } else {
            panic!("Expected JSX element child node");
        }
    }

    #[test]
    fn test_nested_jsx_elements_should_be_collected() {
        // Verify that nested JSX elements are collected individually
        let source = r#"
function App() {
    return (
        <FormProvider {...methods}>
            <ThreeStepModal title="test" />
        </FormProvider>
    )
}
"#;

        let file_path = PathBuf::from("/test/App.tsx");
        let source_file = SourceFile::new_for_test(file_path.clone(), PathBuf::from("App.tsx"));

        let parser = OxcParser::new();
        let result = parser.parse(source, &source_file).unwrap();

        // Both FormProvider and ThreeStepModal should be collected
        assert_eq!(
            result.jsx_elements().len(),
            2,
            "Expected 2 elements (FormProvider and ThreeStepModal) but got {}",
            result.jsx_elements().len()
        );

        let form_provider = result
            .jsx_elements()
            .iter()
            .find(|e| e.tag_name().display_name() == "FormProvider");
        assert!(form_provider.is_some(), "FormProvider should be collected");

        let three_step_modal = result
            .jsx_elements()
            .iter()
            .find(|e| e.tag_name().display_name() == "ThreeStepModal");
        assert!(
            three_step_modal.is_some(),
            "ThreeStepModal should be collected but was not found"
        );
    }
}
use serde::Serialize;
use std::path::{Path, PathBuf};

#[derive(Debug, Clone, PartialEq, Eq, Hash)]
pub struct SourceFile {
    canonical_path: PathBuf,
    relative_path: PathBuf,
}

impl SourceFile {
    pub fn new(path: &Path, project_root: &Path) -> Result<Self, AnalysisError> {
        let canonical = path.canonicalize().map_err(|e| {
            AnalysisError::new(format!("Failed to canonicalize path {path:?}: {e}"))
        })?;

        let relative = canonical
            .strip_prefix(project_root)
            .unwrap_or(&canonical)
            .to_path_buf();

        Ok(Self {
            canonical_path: canonical,
            relative_path: relative,
        })
    }

    pub fn canonical(&self) -> &Path {
        &self.canonical_path
    }

    pub fn relative(&self) -> &Path {
        &self.relative_path
    }

    pub fn display_path(&self) -> String {
        self.relative_path.display().to_string()
    }

    #[cfg(test)]
    pub fn new_for_test(canonical_path: PathBuf, relative_path: PathBuf) -> Self {
        Self {
            canonical_path,
            relative_path,
        }
    }
}

#[derive(Debug, Clone)]
pub struct SourceLocation {
    file: SourceFile,
    span: Span,
}

impl SourceLocation {
    pub fn new(file: SourceFile, span: Span) -> Self {
        Self { file, span }
    }

    pub fn file(&self) -> &SourceFile {
        &self.file
    }

    pub fn span(&self) -> &Span {
        &self.span
    }
}

#[derive(Debug, Clone, Serialize)]
pub struct Span {
    start: u32,
    end: u32,
    start_line: u32,
    start_col: u32,
    end_line: u32,
    end_col: u32,
}

impl Span {
    pub fn new(
        start: u32,
        end: u32,
        start_line: u32,
        start_col: u32,
        end_line: u32,
        end_col: u32,
    ) -> Self {
        Self {
            start,
            end,
            start_line,
            start_col,
            end_line,
            end_col,
        }
    }

    pub fn start(&self) -> u32 {
        self.start
    }

    pub fn end(&self) -> u32 {
        self.end
    }

    pub fn start_line(&self) -> u32 {
        self.start_line
    }

    pub fn start_col(&self) -> u32 {
        self.start_col
    }

    pub fn end_line(&self) -> u32 {
        self.end_line
    }

    pub fn end_col(&self) -> u32 {
        self.end_col
    }
}
#[derive(Debug, Clone)]
pub struct ImportBinding {
    source: ModuleSpecifier,
    imported_name: ImportedName,
    local_name: String,
}

impl ImportBinding {
    pub fn new(source: ModuleSpecifier, imported_name: ImportedName, local_name: String) -> Self {
        Self {
            source,
            imported_name,
            local_name,
        }
    }

    pub fn source(&self) -> &ModuleSpecifier {
        &self.source
    }

    pub fn imported_name(&self) -> &ImportedName {
        &self.imported_name
    }

    pub fn local_name(&self) -> &str {
        &self.local_name
    }
}

#[derive(Debug, Clone)]
pub struct ModuleSpecifier(String);

impl ModuleSpecifier {
    pub fn new(specifier: impl Into<String>) -> Self {
        Self(specifier.into())
    }

    pub fn as_str(&self) -> &str {
        &self.0
    }

    pub fn is_relative(&self) -> bool {
        self.0.starts_with('.') || self.0.starts_with('/')
    }

    pub fn is_package(&self) -> bool {
        !self.is_relative()
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum ImportedName {
    Named(String),
    Default,
    Namespace,
}
