import { cacheLife, cacheTag } from "next/cache";
import { client } from "../api";

export const getDocuments = async (cookie: string, userId: string) => {
  "use cache";

  cacheLife("hours");
  cacheTag(`${userId}:documents`);

  const { data, error } = await client.documents.get({
    fetch: {
      headers: {
        cookie,
      },
    },
  });

  return { data, error };
};

export const getDocumentById = async (
  documentId: string,
  cookie: string,
  userId: string,
) => {
  "use cache";

  cacheLife("hours");
  cacheTag(`${userId}:documents:${documentId}`);

  const { data, error } = await client.documents({ id: documentId }).get({
    fetch: {
      headers: {
        cookie,
      },
    },
  });

  return { data, error };
};
