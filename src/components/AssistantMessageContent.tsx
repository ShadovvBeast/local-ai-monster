import React from 'react';
import { useLLMOutput } from '@llm-ui/react';
import { markdownLookBack } from '@llm-ui/markdown';
import { codeBlockLookBack, findCompleteCodeBlock, findPartialCodeBlock } from '@llm-ui/code';
import { MarkdownComponent } from './MarkdownComponent';
import { CodeComponent } from './CodeComponent';
import { highlighter, codeToHtmlOptions } from '../utils/highlighter';

interface AssistantMessageContentProps {
  content: string;
  isStreaming: boolean;
}

export const AssistantMessageContent: React.FC<AssistantMessageContentProps> = ({ content, isStreaming }) => {
  const { blockMatches } = useLLMOutput({
    llmOutput: content,
    isStreamFinished: !isStreaming,
    blocks: [
      {
        component: (props) => <CodeComponent {...props} highlighter={highlighter} codeToHtmlOptions={codeToHtmlOptions} />,
        findCompleteMatch: findCompleteCodeBlock(),
        findPartialMatch: findPartialCodeBlock(),
        lookBack: codeBlockLookBack(),
      },
    ],
    fallbackBlock: {
      component: MarkdownComponent,
      lookBack: markdownLookBack(),
    },
  });

  return (
    <>
      {blockMatches.map((blockMatch, index) => {
        const Component = blockMatch.block.component;
        return <Component key={index} blockMatch={blockMatch} />;
      })}
    </>
  );
};