/* Generate by @shikijs/codegen */

import {
  createdBundledHighlighter,
  createSingletonShorthands,
} from "@shikijs/core";
import { createJavaScriptRegexEngine } from "@shikijs/engine-javascript";
import type {
  DynamicImportLanguageRegistration,
  DynamicImportThemeRegistration,
} from "@shikijs/types";

type BundledLanguage = "tsx";
type BundledTheme = "github-light";

const bundledLanguages = {
  tsx: () => import("@shikijs/langs-precompiled/tsx"),
} as Record<BundledLanguage, DynamicImportLanguageRegistration>;

const bundledThemes = {
  "github-light": () => import("@shikijs/themes/github-light"),
} as Record<BundledTheme, DynamicImportThemeRegistration>;

const createHighlighter = /* @__PURE__ */ createdBundledHighlighter<
  BundledLanguage,
  BundledTheme
>({
  langs: bundledLanguages,
  themes: bundledThemes,
  engine: () => createJavaScriptRegexEngine(),
});

const { codeToHtml } = /* @__PURE__ */ createSingletonShorthands<
  BundledLanguage,
  BundledTheme
>(createHighlighter);

export { codeToHtml };
