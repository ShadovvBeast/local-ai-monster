import React from 'react';
import { useCodeBlockToHtml } from '@llm-ui/code';
import parse from "html-react-parser";
import { Highlighter } from '../utils/highlighter';

interface CodeComponentProps {
  blockMatch: {
    output: string;
  };
  highlighter: Highlighter;
  codeToHtmlOptions: { theme: string };
}

export const CodeComponent: React.FC<CodeComponentProps> = ({ blockMatch, highlighter, codeToHtmlOptions }) => {
  const { html, code } = useCodeBlockToHtml({
    markdownCodeBlock: blockMatch.output,
    highlighter,
    codeToHtmlOptions,
  });
  if (!html) {
    return <pre className="shiki"><code>{code}</code></pre>;
  }
  return parse(html);
};