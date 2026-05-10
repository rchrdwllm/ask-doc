import { relations } from "drizzle-orm";
import {
  pgTable,
  text,
  timestamp,
  boolean,
  index,
  vector,
  pgEnum,
  integer,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

// Enums
export const messageRoleEnum = pgEnum("message_role", [
  "system",
  "user",
  "assistant",
]);

export const documentStatusEnum = pgEnum("document_status", [
  "processing",
  "ready",
  "error",
]);

// Tables
export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at").notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [index("session_userId_idx").on(table.userId)],
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("account_userId_idx").on(table.userId)],
);

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)],
);

export const document = pgTable(
  "document",
  {
    id: text("id").primaryKey(),
    title: text("title").notNull(),
    status: documentStatusEnum().default("processing"),
    url: text("url").notNull(),
    storage_path: text("storage_path").notNull(),
    pageCount: integer("page_count"),
    errorMessage: text("error_message"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    userId: text("user_id").references(() => user.id),
  },
  (table) => [
    index("document_title_idx").on(table.title),
    index("document_user_id_idx").on(table.userId),
    index("document_status").on(table.status),
  ],
);

export const documentChunk = pgTable(
  "document_chunk",
  {
    id: text("id").primaryKey(),
    content: text("content").notNull(),
    pageNumbers: integer("page_numbers").array(),
    chunkIndex: integer("chunk_index").notNull(),
    embedding: vector("embedding", { dimensions: 768 }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    documentId: text("document_id").references(() => document.id, {
      onDelete: "cascade",
    }),
  },
  (table) => [
    index("document_chunk_embedding_idx").using(
      "hnsw",
      table.embedding.op("vector_cosine_ops"),
    ),
  ],
);

export const conversation = pgTable(
  "conversation",
  {
    id: text("id").primaryKey(),
    title: text("title"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    userId: text("user_id").references(() => user.id, { onDelete: "cascade" }),
    documentId: text("document_id").references(() => document.id, {
      onDelete: "cascade",
    }),
  },
  (table) => [
    index("conversation_title_idx").on(table.title),
    index("conversation_user_id").on(table.userId),
  ],
);

export const message = pgTable(
  "message",
  {
    id: text("id").primaryKey(),
    role: messageRoleEnum().notNull().default("user"),
    content: text("content").notNull(),
    sourceChunkIds: text("source_chunk_ids").array(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    conversationId: text("conversation_id").references(() => conversation.id, {
      onDelete: "cascade",
    }),
  },
  (table) => [index("message_conversation_id").on(table.conversationId)],
);

// Relations
export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
  documents: many(document),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));

export const documentRelations = relations(document, ({ many, one }) => ({
  documentChunk: many(documentChunk),
  user: one(user, {
    fields: [document.userId],
    references: [user.id],
  }),
  conversation: one(conversation),
}));

export const conversationRelations = relations(
  conversation,
  ({ many, one }) => ({
    document: one(document, {
      fields: [conversation.documentId],
      references: [document.id],
    }),
    user: one(user, {
      fields: [conversation.userId],
      references: [user.id],
    }),
    message: many(message),
  }),
);

export const messageRelations = relations(message, ({ many, one }) => ({
  conversation: one(conversation, {
    fields: [message.conversationId],
    references: [conversation.id],
  }),
}));

// Zod Schemas
export const documentInsertSchema = createInsertSchema(document);
export const documentSelectSchema = createSelectSchema(document);
