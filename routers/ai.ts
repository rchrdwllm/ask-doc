import {
  APICallError,
  convertToModelMessages,
  UIMessage,
  streamText,
  stepCountIs,
  tool,
  createUIMessageStream,
  createUIMessageStreamResponse,
  generateText,
  Output,
} from "ai";
import { Elysia } from "elysia";
import * as z from "zod";
import { headers } from "next/headers";
import { client } from "@/lib/api";
import { retrieveInformation } from "@/lib/retrieval";
import { loadPrompt } from "@/lib/prompt";
import { getDenseDocumentChunksByDocumentId } from "@/functions/document-chunks";
import { createMessage } from "@/functions/messages";
import { updateConversation } from "@/functions/conversations";
import { auth } from "@/lib/auth";
import { revalidateTag } from "next/cache";

export const aiRouter = new Elysia({ prefix: "/ai" })
  .post(
    "/chat",
    async ({ body, status }) => {
      const { messages, documentId, conversationId } = body;
      const incoming = await headers();
      const cookieHeader = incoming.get("cookie") ?? "";
      const session = await auth.api.getSession({ headers: incoming });

      if (!session) {
        return status(401, {
          message: "Unauthorized",
        });
      }

      try {
        const systemPrompt = await loadPrompt("chat");
        const stream = createUIMessageStream({
          execute: async ({ writer }) => {
            const lastUserMessage = messages.findLast(
              (msg) => msg.role === "user",
            );

            if (lastUserMessage) {
              const [result] = await createMessage({
                ...lastUserMessage,
                metadata: lastUserMessage.metadata as any,
                conversationId,
              });

              if (!result) {
                console.error("Failed to save user message to database.");
              }
            }

            const savedSources: {
              type: "source-url";
              sourceId: string;
              title: string;
              url: string;
            }[] = [];

            const result = streamText({
              model: "openai/gpt-oss-120b",
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
                      const source = {
                        type: "source-url" as const,
                        sourceId: item.id,
                        title: item.title,
                        url: item.url,
                      };

                      savedSources.push(source);
                      writer.write(source);
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
                generateMessageId: () => crypto.randomUUID(),
                sendReasoning: true,
                sendSources: true,
                onFinish: async ({ responseMessage }) => {
                  const messageParts = [
                    ...responseMessage.parts,
                    ...savedSources,
                  ];

                  const [result] = await createMessage({
                    id: responseMessage.id,
                    role: responseMessage.role,
                    parts: messageParts,
                    metadata: responseMessage.metadata as any,
                    conversationId,
                  });

                  if (!result) {
                    console.error("Failed to save assistant message.");
                  }
                },
              }),
            );
          },
        });

        await updateConversation(conversationId, {
          updatedAt: new Date(),
        });

        revalidateTag(
          `${session.user.id}:documents:${documentId}:conversations`,
          {
            expire: 0,
          },
        );

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
        401: z.object({
          message: z.string(),
        }),
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
  )
  .post(
    "/title",
    async ({ body, status }) => {
      const { text } = body;

      try {
        const result = await generateText({
          model: "openai/gpt-oss-120b",
          prompt: `Generate a concise title for the following text to be used as a conversation title: "${text}". Output in plain text only.`,
        });

        if (!result) {
          return status(500, {
            message: "Failed to generate title.",
          });
        }

        const generatedTitle = result.text.trim();

        return status(200, { generatedTitle });
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
        text: z.string(),
      }),
      response: {
        200: z.object({
          generatedTitle: z.string(),
        }),
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
  )
  .post(
    "/suggestions",
    async ({ body, status }) => {
      const { documentId } = body;

      try {
        const chunks = await getDenseDocumentChunksByDocumentId(documentId);
        const chunkContents = chunks.map((chunk) => chunk.content);

        const result = await generateText({
          model: "openai/gpt-oss-120b",
          prompt:
            (await loadPrompt("suggestions")) +
            `\n\nContext:\n${chunkContents.join("\n\n")}`,
          output: Output.object({
            schema: z.object({
              suggestions: z.array(z.string()),
            }),
          }),
        });
        const suggestions = result.output.suggestions;

        if (!suggestions.length) {
          return status(500, {
            message: "Failed to generate suggestions.",
          });
        }

        return status(200, suggestions);
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
        documentId: z.string(),
      }),
      response: {
        200: z.array(z.string()),
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
