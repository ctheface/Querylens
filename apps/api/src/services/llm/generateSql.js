import { generateText } from 'ai';
import { google } from '@ai-sdk/google';
import { config } from '../../config.js';
import { SYSTEM_PROMPT, buildUserPrompt } from './prompt.js';

/** Strips markdown fences and trailing prose the model may add despite instructions. */
export function cleanSql(text) {
  let sql = text.trim();
  const fenced = sql.match(/```(?:sql)?\s*([\s\S]*?)```/i);
  if (fenced) {
    sql = fenced[1].trim();
  }
  return sql.replace(/;+\s*$/, '');
}

function providerOptions() {
  const budget = config.llm.thinkingBudget;
  if (budget === 'auto') return undefined;
  return {
    google: {
      thinkingConfig: {
        thinkingBudget: Number.parseInt(budget, 10),
        includeThoughts: false,
      },
    },
  };
}

export async function generateSql(tables, question) {
  const { text, finishReason } = await generateText({
    model: google(config.llm.model),
    system: SYSTEM_PROMPT,
    prompt: buildUserPrompt(tables, question),
    temperature: 0,
    maxOutputTokens: config.llm.maxOutputTokens,
    providerOptions: providerOptions(),
  });

  // A truncated response yields SQL that may still parse (e.g. a SELECT whose
  // JOINs were cut off), so this has to be caught before the guard sees it.
  if (finishReason === 'length') {
    throw new Error(
      'The model ran out of output tokens before finishing the query. ' +
        'Raise LLM_MAX_OUTPUT_TOKENS or lower LLM_THINKING_BUDGET.'
    );
  }

  return cleanSql(text);
}
