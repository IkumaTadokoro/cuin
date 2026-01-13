# cuin

[![npm version](https://img.shields.io/npm/v/@ikuma-t/cuin.svg)](https://www.npmjs.com/package/@ikuma-t/cuin) [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Component Usage Inspector for React Project

## Overview

`cuin` is a tool for analyzing and visualizing component usage patterns in React projects. It helps you understand where components are used throughout your project and what props are being passed to them.

**[Screenshot placeholder: Main dashboard screenshot here]**

## Usage

### Basic Usage

Run the following command in your project root directory:

```bash
npx @ikuma-t/cuin
```

Your browser will automatically open to `http://localhost:3214` where you can view the analysis results.

**[Screenshot placeholder: Component list view screenshot here]**

### Options

```bash
npx @ikuma-t/cuin [options]

Options:
  -p, --path <path>   Path to analyze (default: current directory)
  -P, --port <port>   Port number for the server (default: 3214)
  -h, --help          Display help message
```

### Examples

```bash
# Analyze a specific directory
npx @ikuma-t/cuin --path ./src

# Run on a different port
npx @ikuma-t/cuin --port 8080
```

**[Screenshot placeholder: Component detail view (usage locations) screenshot here]**

## License

MIT License - see the [LICENSE](./LICENSE) file for details.

## Links

- [npm package](https://www.npmjs.com/package/@ikuma-t/cuin)
- [GitHub repository](https://github.com/IkumaTadokoro/cuin)
- [Issue tracker](https://github.com/IkumaTadokoro/cuin/issues)
