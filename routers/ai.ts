import {
  APICallError,
  convertToModelMessages,
  UIMessage,
  streamText,
  stepCountIs,
  tool,
  createUIMessageStream,
  createUIMessageStreamResponse,
} from "ai";
import { Elysia } from "elysia";
import * as z from "zod";
import { headers } from "next/headers";
import { client } from "@/lib/api";
import { retrieveInformation } from "@/lib/retrieval";
import { loadPrompt } from "@/lib/prompt";

export const aiRouter = new Elysia({ prefix: "/ai" }).post(
  "/chat",
  async ({ body, status }) => {
    const { messages, documentId, conversationId } = body;
    const incoming = await headers();
    const cookieHeader = incoming.get("cookie") ?? "";

    try {
      const systemPrompt = await loadPrompt("chat");
      const stream = createUIMessageStream({
        execute: async ({ writer }) => {
          const result = streamText({
            model: "google/gemini-3.1-flash-lite",
            messages: await convertToModelMessages(messages),
            stopWhen: stepCountIs(5),
            system: systemPrompt,
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

                  const mappedResult = result.map((item) => ({
                    text: item.content,
                    title: item.content,
                    url: `/documents/${item.documentId}`,
                    id: item.id,
                  }));

                  mappedResult.forEach((item) => {
                    writer.write({
                      type: "source-url",
                      sourceId: item.id,
                      title: item.title,
                      url: item.url,
                    });
                  });

                  const formattedResult = `Here are relevant sources:\n${mappedResult
                    .map((item) => `- ${item.text} (source: ${item.url})`)
                    .join("\n")}`;

                  return formattedResult;
                },
              }),
            },
          });

          writer.merge(
            result.toUIMessageStream({
              sendReasoning: true,
              sendSources: true,
            }),
          );
        },
      });

      return status(200, createUIMessageStreamResponse({ stream }));
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
