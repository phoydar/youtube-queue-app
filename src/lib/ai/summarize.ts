import type Anthropic from '@anthropic-ai/sdk';
import { getAnthropic, SUMMARY_MODEL } from './anthropic-client';

export interface VideoSummary {
  summary: string;
  keyTopics: string[];
}

const SUMMARIZE_TOOL: Anthropic.Tool = {
  name: 'record_video_summary',
  description:
    'Record a structured summary of a YouTube video based on its transcript or description.',
  input_schema: {
    type: 'object',
    properties: {
      summary: {
        type: 'string',
        description:
          'A 200-400 word summary of the video covering its main thesis, key arguments, and practical takeaways. Write in plain prose, not bullet points.',
      },
      key_topics: {
        type: 'array',
        items: { type: 'string' },
        description:
          'Between 3 and 8 short topic labels (1-4 words each) that describe the subjects covered. Use canonical terminology (e.g. "LLM agents", "vector databases", "Rust ownership") rather than phrases.',
        minItems: 3,
        maxItems: 8,
      },
    },
    required: ['summary', 'key_topics'],
  },
};

export async function summarizeVideo(input: {
  title: string;
  channelName: string;
  content: string;
}): Promise<VideoSummary> {
  const anthropic = getAnthropic();

  const response = await anthropic.messages.create({
    model: SUMMARY_MODEL,
    max_tokens: 1024,
    tools: [SUMMARIZE_TOOL],
    tool_choice: { type: 'tool', name: SUMMARIZE_TOOL.name },
    messages: [
      {
        role: 'user',
        content: `You are summarizing a YouTube video for a personal research queue. The summary will later be embedded and clustered with other videos on similar topics.

Video title: ${input.title}
Channel: ${input.channelName}

Transcript or description:
"""
${input.content}
"""

Call the record_video_summary tool with a high-quality summary and canonical topic tags.`,
      },
    ],
  });

  const toolUse = response.content.find((block) => block.type === 'tool_use');
  if (!toolUse || toolUse.type !== 'tool_use') {
    throw new Error('Claude did not return a tool_use block');
  }

  const parsed = toolUse.input as { summary: string; key_topics: string[] };
  if (!parsed.summary || !Array.isArray(parsed.key_topics)) {
    throw new Error('Claude tool_use input was malformed');
  }

  return {
    summary: parsed.summary.trim(),
    keyTopics: parsed.key_topics.map((t) => t.trim()).filter(Boolean),
  };
}

const CLUSTER_LABEL_TOOL: Anthropic.Tool = {
  name: 'record_cluster_label',
  description: 'Record a human-readable label and description for a cluster of related videos.',
  input_schema: {
    type: 'object',
    properties: {
      label: {
        type: 'string',
        description:
          'A concise topic label for the cluster (3-6 words). Should read like a book chapter title, e.g. "LLM Agent Architectures" or "Postgres Performance Tuning".',
      },
      description: {
        type: 'string',
        description:
          'A one-sentence description of what unites the videos in this cluster.',
      },
    },
    required: ['label', 'description'],
  },
};

export async function generateClusterLabel(input: {
  titles: string[];
  topics: string[];
}): Promise<{ label: string; description: string }> {
  const anthropic = getAnthropic();

  const titlesList = input.titles.map((t, i) => `${i + 1}. ${t}`).join('\n');
  const topicsList = Array.from(new Set(input.topics)).slice(0, 30).join(', ');

  const response = await anthropic.messages.create({
    model: SUMMARY_MODEL,
    max_tokens: 512,
    tools: [CLUSTER_LABEL_TOOL],
    tool_choice: { type: 'tool', name: CLUSTER_LABEL_TOOL.name },
    messages: [
      {
        role: 'user',
        content: `These YouTube videos were grouped together by semantic similarity. Give the group a concise, specific label.

Video titles:
${titlesList}

Topic tags across the group:
${topicsList}

Call the record_cluster_label tool.`,
      },
    ],
  });

  const toolUse = response.content.find((block) => block.type === 'tool_use');
  if (!toolUse || toolUse.type !== 'tool_use') {
    throw new Error('Claude did not return a tool_use block');
  }

  const parsed = toolUse.input as { label: string; description: string };
  return {
    label: parsed.label.trim(),
    description: (parsed.description || '').trim(),
  };
}
