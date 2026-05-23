"use server";

import { cacheLife, cacheTag } from "next/cache";
import { client } from "../api";

export const getConversationById = async (
  conversationId: string,
  cookieHeader: string,
  userId: string,
) => {
  "use cache";

  cacheLife("hours");
  cacheTag(`${userId}:conversations:${conversationId}`);

  const { data, error } = await client
    .conversations({
      id: conversationId,
    })
    .get({
      headers: {
        cookie: cookieHeader,
      },
    });

  return { data, error };
};

export const getDocumentConversations = async (
  documentId: string,
  cookieHeader: string,
  userId: string,
) => {
  "use cache";

  cacheLife("hours");
  cacheTag(`${userId}:documents:${documentId}:conversations`);

  const { data, error } = await client
    .documents({ id: documentId })
    .conversations.get({
      headers: {
        cookie: cookieHeader,
      },
    });

  return { data, error };
};
