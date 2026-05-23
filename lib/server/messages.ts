"use server";

import { cacheTag } from "next/cache";
import { cacheLife } from "next/cache";
import { client } from "../api";

export const getConversationLastMessage = async (
  conversationId: string,
  cookieHeader: string,
  userId: string,
) => {
  "use cache";

  cacheLife("hours");
  cacheTag(`${userId}:conversations:${conversationId}:lastMessage`);

  const { data, error } = await client
    .conversations({ id: conversationId })
    .messages.last.get({
      headers: {
        cookie: cookieHeader,
      },
    });

  return { data, error };
};

export const getConversationMessages = async (
  conversationId: string,
  cookieHeader: string,
  userId: string,
) => {
  "use cache";

  cacheLife("hours");
  cacheTag(`${userId}:conversations:${conversationId}:messages`);

  const { data, error } = await client
    .conversations({
      id: conversationId,
    })
    .messages.get({
      headers: {
        cookie: cookieHeader,
      },
    });

  return { data, error };
};
