import {
  APICallError,
  convertToModelMessages,
  UIMessage,
  streamText,
  stepCountIs,
  tool,
} from "ai";
import { Elysia } from "elysia";
import * as z from "zod";
import { headers } from "next/headers";
import { client } from "@/lib/api";
import { retrieveInformation } from "@/lib/retrieval";

export const aiRouter = new Elysia({ prefix: "/ai" }).post(
  "/chat",
  async ({ body, status }) => {
    const { messages, documentId, conversationId } = body;
    const incoming = await headers();
    const cookieHeader = incoming.get("cookie") ?? "";

    try {
      const result = streamText({
        model: "openai/gpt-oss-20b",
        messages: await convertToModelMessages(messages),
        stopWhen: stepCountIs(5),
        system: `You are a helpful assistant. Check your knowledge base before answering any questions.
        Only respond to questions using information from tool calls.
        if no relevant information is found in the tool calls, respond with your best guess based on your training data, but make sure to indicate that it's a guess.`,
        tools: {
          getInformation: tool({
            description:
              "Get relevant information from the knowledge base based on the question and document ID.",
            inputSchema: z.object({
              question: z.string(),
            }),
            execute: async ({ question }) => {
              const { data, error } = await client.embeddings.query.post(
                {
                  query: question,
                },
                {
                  headers: {
                    cookie: cookieHeader,
                  },
                },
              );

              if (error || !data) {
                console.error(
                  "Failed to create embedding for question:",
                  error,
                );

                return "Sorry, I don't know.";
              }

              const { data: result, error: retrieveError } =
                await retrieveInformation(data, documentId);

              if (retrieveError || !result) {
                console.error(
                  "No relevant information found for query:",
                  question,
                );

                return "Sorry, I don't know.";
              }

              return result;
            },
          }),
        },
      });

      return status(
        200,
        result.toUIMessageStreamResponse({ sendReasoning: true }),
      );
    } catch (error) {
      if (APICallError.isInstance(error)) {
        if (error.statusCode === 429) {
          return status(429, {
            message: "Quota reached. Please try again later.",
          });
        }

        return status(502, {
          message: "Upstream AI error.",
        });
      }

      return status(500, {
        message: "Unexpected error.",
      });
    }
  },
  {
    body: z.object({
      messages: z.array(z.custom<UIMessage>()),
      documentId: z.string(),
      conversationId: z.string(),
    }),
    response: {
      200: z.custom<any>(),
      429: z.object({
        message: z.string(),
      }),
      502: z.object({
        message: z.string(),
      }),
      500: z.object({
        message: z.string(),
      }),
    },
  },
);
