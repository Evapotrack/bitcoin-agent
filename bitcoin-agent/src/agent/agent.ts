import Anthropic from '@anthropic-ai/sdk';
import type {
  MessageParam,
  ContentBlockParam,
  ToolResultBlockParam,
} from '@anthropic-ai/sdk/resources/messages';
import { SYSTEM_PROMPT } from './prompts';
import { TOOL_DEFINITIONS, executeTool, AgentContext } from './tools';

const MODEL = 'claude-sonnet-4-6';
const MAX_TOKENS = 1024;

export interface ToolCallResult {
  tool: string;
  input: Record<string, unknown>;
  result: string;
}

export interface AgentResponse {
  message: string;
  toolResults: ToolCallResult[];
}

export async function sendAgentMessage(
  apiKey: string,
  userMessage: string,
  chatHistory: MessageParam[],
  context: AgentContext
): Promise<AgentResponse> {
  const client = new Anthropic({ apiKey });

  // Build messages array with history + new user message
  const messages: MessageParam[] = [
    ...chatHistory,
    { role: 'user', content: userMessage },
  ];

  const toolResults: ToolCallResult[] = [];
  let finalMessage = '';

  // Agentic loop: keep calling Claude until we get a final text response
  let currentMessages = messages;
  let iterations = 0;
  const maxIterations = 5; // Safety limit

  while (iterations < maxIterations) {
    iterations++;

    const response = await client.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: SYSTEM_PROMPT,
      tools: TOOL_DEFINITIONS,
      messages: currentMessages,
    });

    // Collect text blocks
    const textBlocks = response.content.filter((b) => b.type === 'text');
    const toolUseBlocks = response.content.filter((b) => b.type === 'tool_use');

    // If no tool calls, we're done
    if (toolUseBlocks.length === 0) {
      finalMessage = textBlocks.map((b) => {
        if (b.type === 'text') return b.text;
        return '';
      }).join('\n');
      break;
    }

    // Execute tool calls one at a time (enforce one-task-at-a-time)
    const toolBlock = toolUseBlocks[0];
    if (toolBlock.type !== 'tool_use') break;

    let toolResult: string;
    try {
      toolResult = await executeTool(
        toolBlock.name,
        toolBlock.input as Record<string, unknown>,
        context
      );
    } catch (err) {
      toolResult = JSON.stringify({
        error: `Tool execution failed: ${(err as Error).message}`,
      });
    }

    toolResults.push({
      tool: toolBlock.name,
      input: toolBlock.input as Record<string, unknown>,
      result: toolResult,
    });

    // Build the tool result message for the next turn
    const toolResultContent: ToolResultBlockParam[] = [{
      type: 'tool_result',
      tool_use_id: toolBlock.id,
      content: toolResult,
    }];

    // If there were additional tool_use blocks we skipped, return their results as
    // "not executed" to avoid the API expecting results for them
    for (let i = 1; i < toolUseBlocks.length; i++) {
      const skipped = toolUseBlocks[i];
      if (skipped.type === 'tool_use') {
        toolResultContent.push({
          type: 'tool_result',
          tool_use_id: skipped.id,
          content: JSON.stringify({
            skipped: true,
            message: 'This task was not executed. The agent confirms one task at a time. Please suggest this task next if still needed.',
          }),
        });
      }
    }

    // Add assistant response + tool results to continue the loop
    currentMessages = [
      ...currentMessages,
      { role: 'assistant', content: response.content },
      { role: 'user', content: toolResultContent as ContentBlockParam[] },
    ];

    // Collect any text from this iteration
    if (textBlocks.length > 0) {
      const text = textBlocks.map((b) => {
        if (b.type === 'text') return b.text;
        return '';
      }).join('\n');
      if (text.trim()) {
        finalMessage += (finalMessage ? '\n' : '') + text;
      }
    }
  }

  return {
    message: finalMessage || 'I completed the requested action.',
    toolResults,
  };
}
