import { generateText, UIMessage } from "ai";

export const generateConversationTitle = async (
  userMessage: string,
  aiMessage: string,
) => {
  const { text } = await generateText({
    model: "openai/gpt-oss-20b",
    prompt: `Generate a 3-5 word title for this conversation.
    User asked: "${userMessage}"
    AI responded: "${aiMessage}"
    Only return the title, without any quotes or formatting`,
  });
  const title = text.trim();

  return title;
};

export const extractTextFromMessage = (message: UIMessage) => {
  if (!message) return "";

  if (message.parts && Array.isArray(message.parts)) {
    const textPart = message.parts.find((part) => part.type === "text");

    return textPart ? textPart.text : "";
  }

  return "";
};
