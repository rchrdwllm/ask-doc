import { convertToModelMessages, stepCountIs, tool, UIMessage } from "ai";
import { Elysia } from "elysia";
import * as z from "zod";
import { streamText } from "ai";
import { google } from "@ai-sdk/google";
import { retrieveInformation } from "@/lib/retrieval";
import { client } from "@/lib/api";

export const aiRouter = new Elysia({ prefix: "/ai" }).post(
  "/chat",
  async ({ body }) => {
    const { messages, documentId } = body;

    const result = streamText({
      model: google("gemini-2.0-flash"),
      messages: await convertToModelMessages(messages),
      stopWhen: stepCountIs(5),
      system: `You are a helpful assistant. Check your knowledge base before answering any questions.
    Only respond to questions using information from tool calls.
    if no relevant information is found in the tool calls, respond, "Sorry, I don't know."`,
      tools: {
        getInformation: tool({
          description:
            "Get relevant information from the knowledge base based on the question and document ID.",
          inputSchema: z.object({
            question: z.string(),
          }),
          execute: async ({ question }) => {
            const { data, error } = await client.embeddings.query.post({
              query: question,
            });

            if (error || !data) {
              console.error("Failed to create embedding for question:", error);

              return "Sorry, I don't know.";
            }

            const result = await retrieveInformation(data, documentId);

            return result;
          },
        }),
      },
    });

    return result.toUIMessageStreamResponse();
  },
  {
    body: z.object({
      messages: z.array(z.custom<UIMessage>()),
      documentId: z.string().optional(),
    }),
  },
);
