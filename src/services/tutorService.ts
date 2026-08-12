import type { ChatMessage } from '@/types';
import { delay, randomId } from '@/utils/async';

export const SUGGESTED_PROMPTS = [
  'Explain this like I\u2019m a beginner',
  'Give me an example',
  'Quiz me on this topic',
  'What am I doing wrong?',
  'Give me a shortcut to remember this',
];

const CANNED_RESPONSES: { match: RegExp; reply: string }[] = [
  {
    match: /dynamic programming|\bdp\b/i,
    reply:
      'Think of dynamic programming as solving a big problem by remembering solutions to smaller problems you\u2019ve already solved, instead of recomputing them.\n\nTwo ingredients make a problem a good DP candidate:\n1. **Overlapping subproblems** \u2014 the same smaller calculation shows up again and again.\n2. **Optimal substructure** \u2014 the best overall answer is built from the best answers to those smaller pieces.\n\nA classic example is climbing stairs: to know the number of ways to reach step *n*, you just add the ways to reach step *n-1* and *n-2*. Store each answer once (memoization) and you turn an exponential brute force into a linear-time solution.',
  },
  {
    match: /beginner|simple terms|simpler/i,
    reply:
      'Sure \u2014 stripping away the jargon: you break a hard problem into smaller versions of the same problem, solve the small ones first, and reuse those answers to build up to the full solution. It\u2019s the difference between re-deriving a fact every time versus writing it on a sticky note the first time you learn it.',
  },
  {
    match: /example/i,
    reply:
      'Here\u2019s a concrete one: the Fibonacci sequence. Naively, computing fib(30) recomputes fib(28) thousands of times. With memoization, you calculate each fib(n) once, cache it, and every later call is a instant lookup \u2014 O(n) instead of O(2^n).',
  },
  {
    match: /quiz/i,
    reply:
      'Happy to! Quick one: "A problem is a good fit for dynamic programming if it has overlapping subproblems and ______." Type your answer and I\u2019ll tell you if you\u2019ve got it \u2014 or head to Assessments for a full mock test on this topic.',
  },
  {
    match: /doing wrong|mistake|stuck/i,
    reply:
      'The most common slip is writing the recursive solution correctly but forgetting to cache results \u2014 so it still runs in exponential time even though the logic is right. Check whether you\u2019re storing each subproblem\u2019s answer the first time you compute it, and reading from that cache before recursing again.',
  },
  {
    match: /shortcut|remember|trick/i,
    reply:
      'A memory trick: DP = "Don\u2019t repeat yourself, Plan the order." If you can describe a problem as "the answer for n depends on the answer for smaller n," it\u2019s very likely solvable with DP \u2014 define the state, write the recurrence, then decide top-down (memoization) or bottom-up (tabulation).',
  },
  {
    match: /graph/i,
    reply:
      'For graphs, anchor everything to two traversals: BFS explores level-by-level and is your go-to for shortest paths on unweighted graphs; DFS dives deep first and is great for detecting cycles or exploring all paths. Almost every graph problem starts by picking one of these two.',
  },
  {
    match: /normali[sz]ation/i,
    reply:
      'Normalization is about removing redundancy. 1NF removes repeating groups, 2NF removes partial dependencies on part of a composite key, and 3NF removes transitive dependencies where a non-key attribute depends on another non-key attribute. Each step reduces the chance of inconsistent data during updates.',
  },
];

const FALLBACK_REPLIES = [
  'Good question. Let\u2019s break it down step by step \u2014 what specifically is tripping you up: the concept itself, or applying it to a problem?',
  'That\u2019s a topic worth slowing down on. Want me to explain it with an analogy, walk through an example, or quiz you to check your understanding?',
  'I can help with that. Based on your recent sessions, this connects to what you studied earlier \u2014 want a quick refresher first?',
];

export const tutorService = {
  getSuggestedPrompts(): string[] {
    return SUGGESTED_PROMPTS;
  },

  async sendMessage(history: ChatMessage[], content: string): Promise<ChatMessage> {
    await delay(1100 + Math.random() * 700);

    if (Math.random() < 0.03) {
      throw new Error('Your AI tutor is temporarily unavailable. Try again in a moment.');
    }

    const canned = CANNED_RESPONSES.find((entry) => entry.match.test(content));
    const reply = canned
      ? canned.reply
      : FALLBACK_REPLIES[Math.min(history.length, FALLBACK_REPLIES.length - 1)];

    return {
      id: randomId('msg'),
      role: 'ai',
      content: reply,
      timestamp: new Date().toISOString(),
    };
  },
};
