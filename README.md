# cuin

[![npm version](https://img.shields.io/npm/v/@ikuma-t/cuin.svg)](https://www.npmjs.com/package/@ikuma-t/cuin) [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

`cuin` is a tool for analyzing and visualizing component usage patterns in React projects. It helps you understand where components are used throughout your project and what props are being passed to them.

## Usage

### Basic Usage

Run the following command in your project root directory:

```bash
npx @ikuma-t/cuin
```

Your browser will automatically open to `http://localhost:3214` where you can view the analysis results.

<img width="2666" height="1874" alt="CleanShot 2026-01-13 at 20 10 21@2x" src="https://github.com/user-attachments/assets/ae2d5fa7-1f4f-4f93-860c-fb9f7ae5a6df" />

<img width="2666" height="1874" alt="CleanShot 2026-01-13 at 20 10 45@2x" src="https://github.com/user-attachments/assets/67533792-97e2-4705-b566-4f6c3bbb08ff" />

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

## License

MIT License - see the [LICENSE](./LICENSE) file for details.

## Links

- [npm package](https://www.npmjs.com/package/@ikuma-t/cuin)
- [GitHub repository](https://github.com/IkumaTadokoro/cuin)
- [Issue tracker](https://github.com/IkumaTadokoro/cuin/issues)
