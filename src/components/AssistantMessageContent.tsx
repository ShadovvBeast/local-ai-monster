import React from 'react';
import { useLLMOutput } from '@llm-ui/react';
import { markdownLookBack } from '@llm-ui/markdown';
import { codeBlockLookBack, findCompleteCodeBlock, findPartialCodeBlock } from '@llm-ui/code';
import { MarkdownComponent } from './MarkdownComponent';
import { CodeComponent } from './CodeComponent';
import { ThinkingComponent } from './ThinkingComponent';
import { highlighter, codeToHtmlOptions } from '../utils/highlighter';

interface AssistantMessageContentProps {
  content: string;
  isStreaming: boolean;
}

// Helper function to extract thinking content and clean the main content
const parseThinkingContent = (content: string, isStreaming: boolean = false) => {
  const thinkingBlocks: string[] = [];
  const streamingStates: boolean[] = [];
  let workingContent = content;
  
  // First pass: Extract all complete <think>...</think> blocks
  const completeBlockRegex = /<think>([\s\S]*?)<\/think>/g;
  let match;
  
  while ((match = completeBlockRegex.exec(content)) !== null) {
    const thinkContent = match[1] ? String(match[1].trim()) : '';
    if (thinkContent) {
      thinkingBlocks.push(thinkContent);
      streamingStates.push(false); // Complete blocks are not streaming
    }
    // Remove this complete block from working content
    workingContent = workingContent.replace(match[0], '');
  }
  
  // Second pass: Handle any remaining unclosed <think> tags (only during streaming)
  if (isStreaming) {
    const openTagIndex = workingContent.indexOf('<think>');
    if (openTagIndex !== -1) {
      // Check if this is truly an unclosed tag (no closing tag after it)
      const contentAfterOpen = workingContent.substring(openTagIndex);
      if (!contentAfterOpen.includes('</think>')) {
        // This is an unclosed <think> tag while streaming
        const thinkContent = workingContent.substring(openTagIndex + 7).trim(); // 7 = length of '<think>'
        if (thinkContent) {
          thinkingBlocks.push(String(thinkContent));
          streamingStates.push(true); // This is a streaming block
        }
        
        // Remove the unclosed think tag and its content from working content
        workingContent = workingContent.substring(0, openTagIndex).trim();
      }
    }
  }
  
  return {
    thinkingBlocks,
    streamingStates,
    cleanContent: workingContent.trim()
  };
};

export const AssistantMessageContent: React.FC<AssistantMessageContentProps> = ({ content, isStreaming }) => {
  // Ensure content is a string to prevent errors
  const safeContent = typeof content === 'string' ? content : '';
  
  // Create a unique message identifier to prevent key conflicts between messages
  const messageId = React.useMemo(() => {
    return `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }, []);
  
  // Parse thinking content separately
  const { thinkingBlocks, streamingStates, cleanContent } = parseThinkingContent(safeContent, isStreaming);
  
  // Debug logging for message processing
  console.log('AssistantMessageContent processing:', {
    messageId,
    contentLength: safeContent.length,
    thinkingBlocksCount: thinkingBlocks.length,
    isStreaming,
    thinkingBlocks: thinkingBlocks.map((block, i) => ({
      index: i,
      contentPreview: block.slice(0, 50) + '...',
      isStreaming: streamingStates[i]
    }))
  });
  
  const llmOutput = useLLMOutput({
    llmOutput: cleanContent,
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

  // Safely extract blockMatches with fallback
  const blockMatches = llmOutput?.blockMatches || [];

  return (
    <>
      {/* Render thinking blocks first */}
      {thinkingBlocks.map((thinkContent, index) => {
        const isStreamingBlock = streamingStates[index] || false;
        // Create a unique key that prevents conflicts between messages
        const uniqueKey = `${messageId}-think-${index}-${isStreamingBlock ? 'streaming' : 'complete'}`;
        
        return (
          <ThinkingComponent 
            key={uniqueKey}
            content={thinkContent}
            isStreaming={isStreamingBlock}
          />
        );
      })}
      
      {/* Render main content */}
      {blockMatches.map((blockMatch, index) => {
        const Component = blockMatch?.block?.component;
        if (!Component) return null;
        return <Component key={`content-${index}`} blockMatch={blockMatch} />;
      })}
    </>
  );
};