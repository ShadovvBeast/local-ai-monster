import React from 'react';
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface MarkdownComponentProps {
  blockMatch: {
    output: string;
  };
}

export const MarkdownComponent: React.FC<MarkdownComponentProps> = ({ blockMatch }) => {
  const markdown = blockMatch.output;
  return <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>;
};