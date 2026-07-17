import { GoogleGenerativeAI } from '@google/generative-ai';
import { v } from 'convex/values';
import { internal } from './_generated/api';
import {
  action,
  internalMutation,
  internalQuery,
  query,
} from './_generated/server';

export const saveMessage = internalMutation({
  args: {
    sessionId: v.string(),
    role: v.union(v.literal('user'), v.literal('assistant')),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert('chat_messages', {
      sessionId: args.sessionId,
      role: args.role,
      content: args.content,
      createdAt: Date.now(),
    });
  },
});

export const listMessagesInternal = internalQuery({
  args: { sessionId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('chat_messages')
      .withIndex('by_session', (q) => q.eq('sessionId', args.sessionId))
      .order('asc')
      .collect();
  },
});

export const listMessages = query({
  args: { sessionId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('chat_messages')
      .withIndex('by_session', (q) => q.eq('sessionId', args.sessionId))
      .order('asc')
      .collect();
  },
});

export const sendMessage = action({
  args: {
    sessionId: v.string(),
    content: v.string(),
    resumeContext: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.runMutation(internal.chat.saveMessage, {
      sessionId: args.sessionId,
      role: 'user',
      content: args.content,
    });

    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        await ctx.runMutation(internal.chat.saveMessage, {
          sessionId: args.sessionId,
          role: 'assistant',
          content:
            "I'm not able to connect to the AI service right now. The API key hasn't been configured yet. Please try again later!",
        });
        return;
      }

      const messages = await ctx.runQuery(internal.chat.listMessagesInternal, {
        sessionId: args.sessionId,
      });

      const recentMessages = messages.slice(-20);

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

      const systemPrompt = `You are Jacob Stein's professional portfolio assistant running inside a retro Mac OS X iChat interface. Answer questions about his experience, skills, and projects based ONLY on the verified information below. Do not fabricate dates, companies, technologies, or achievements. If asked about something not in the data, say "I don't have information about that."

Keep responses concise and conversational — this is a chat interface, not an essay. Use short paragraphs.

${args.resumeContext}`;

      const chatHistory = recentMessages
        .filter((m) => m.role === 'user' || m.role === 'assistant')
        .slice(0, -1)
        .map((m) => ({
          role: m.role === 'user' ? ('user' as const) : ('model' as const),
          parts: [{ text: m.content }],
        }));

      const chat = model.startChat({
        history: chatHistory,
        systemInstruction: systemPrompt,
      });

      const result = await chat.sendMessage(args.content);
      const responseText = result.response.text();

      await ctx.runMutation(internal.chat.saveMessage, {
        sessionId: args.sessionId,
        role: 'assistant',
        content: responseText,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      await ctx.runMutation(internal.chat.saveMessage, {
        sessionId: args.sessionId,
        role: 'assistant',
        content: `Sorry, I encountered an error: ${errorMessage}. Please try again!`,
      });
    }
  },
});
