import { loadHighlighter } from '@llm-ui/code';
import { createHighlighterCore } from 'shiki/core';
import { bundledLanguagesInfo } from 'shiki/langs';
import getWasm from 'shiki/wasm';
import { bundledThemes } from 'shiki/themes';
import { createOnigurumaEngine } from '@shikijs/engine-oniguruma';
import { allLangs, allLangsAlias } from '@llm-ui/code';

export type Highlighter = Awaited<ReturnType<typeof createHighlighterCore>>;

export const highlighter = loadHighlighter(
  createHighlighterCore({
    langs: allLangs(bundledLanguagesInfo),
    langAlias: allLangsAlias(bundledLanguagesInfo),
    themes: Object.values(bundledThemes),
    engine: createOnigurumaEngine(getWasm),
  }),
);

export const codeToHtmlOptions = { theme: 'github-dark' };