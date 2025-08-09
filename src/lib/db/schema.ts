import { pgTable, text, integer, timestamp, boolean, decimal, uuid, index, uniqueIndex, pgEnum } from "drizzle-orm/pg-core";

// Enums
export const userRoleEnum = pgEnum('user_role', ['user', 'admin']);
export const contentTypeEnum = pgEnum('content_type', ['movie', 'series']);
export const contentStatusEnum = pgEnum('content_status', ['draft', 'published', 'archived']);
export const contentRatingEnum = pgEnum('content_rating', ['G', 'PG', 'PG-13', 'R', 'NC-17']);
export const transactionTypeEnum = pgEnum('transaction_type', ['deposit', 'withdraw', 'vip_purchase', 'coin_purchase']);
export const transactionStatusEnum = pgEnum('transaction_status', ['pending', 'completed', 'failed', 'cancelled']);

// Users table
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  phone: text('phone').notNull().unique(),
  password_hash: text('password_hash').notNull(),
  avatar_url: text('avatar_url').default('/avatars/default.webp'),
  role: userRoleEnum('role').default('user').notNull(),
  coins: integer('coins').default(0).notNull(),
  balance: decimal('balance', { precision: 10, scale: 2 }).default('0.00').notNull(),
  is_vip: boolean('is_vip').default(false).notNull(),
  vip_expires_at: timestamp('vip_expires_at'),
  last_login_at: timestamp('last_login_at'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  phoneIdx: uniqueIndex('users_phone_idx').on(table.phone),
}));

// Categories table
export const categories = pgTable('categories', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  slugIdx: uniqueIndex('categories_slug_idx').on(table.slug),
}));

// Content table (for both movies and series)
export const content = pgTable('content', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: text('title').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description'),
  type: contentTypeEnum('type').notNull(),
  status: contentStatusEnum('status').default('draft').notNull(),
  content_rating: contentRatingEnum('content_rating').default('PG').notNull(),
  poster_url: text('poster_url'),
  backdrop_url: text('backdrop_url'),
  trailer_url: text('trailer_url'),
  video_url: text('video_url'), // Main video URL for movies
  release_date: timestamp('release_date'),
  duration_minutes: integer('duration_minutes'), // For movies
  total_episodes: integer('total_episodes'), // For series
  views: integer('views').default(0).notNull(),
  saves: integer('saves').default(0).notNull(),
  is_vip_required: boolean('is_vip_required').default(false).notNull(),
  category_id: uuid('category_id').references(() => categories.id),
  search_vector: text('search_vector'), // For PostgreSQL full-text search
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  slugIdx: uniqueIndex('content_slug_idx').on(table.slug),
  titleIdx: index('content_title_idx').on(table.title),
  typeIdx: index('content_type_idx').on(table.type),
  statusIdx: index('content_status_idx').on(table.status),
  categoryIdx: index('content_category_idx').on(table.category_id),
  vipIdx: index('content_vip_idx').on(table.is_vip_required),
}));

// Episodes table (for series)
export const episodes = pgTable('episodes', {
  id: uuid('id').defaultRandom().primaryKey(),
  content_id: uuid('content_id').references(() => content.id, { onDelete: 'cascade' }).notNull(),
  episode_number: text('episode_number').notNull(), // Support formats like "1.01", "1.2", "0"
  title: text('title').notNull(),
  description: text('description'),
  duration_minutes: integer('duration_minutes'),
  video_url: text('video_url'), // HLS (.m3u8) URL
  thumbnail_url: text('thumbnail_url'),
  is_vip_required: boolean('is_vip_required').default(false).notNull(),
  views: integer('views').default(0).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  contentEpisodeIdx: uniqueIndex('episodes_content_episode_idx').on(table.content_id, table.episode_number),
  contentIdx: index('episodes_content_idx').on(table.content_id),
}));

// User saves (bookmarks)
export const user_saves = pgTable('user_saves', {
  id: uuid('id').defaultRandom().primaryKey(),
  user_id: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  content_id: uuid('content_id').references(() => content.id, { onDelete: 'cascade' }).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  userContentIdx: uniqueIndex('user_saves_user_content_idx').on(table.user_id, table.content_id),
  userIdx: index('user_saves_user_idx').on(table.user_id),
  contentIdx: index('user_saves_content_idx').on(table.content_id),
}));

// Transactions table
export const transactions = pgTable('transactions', {
  id: uuid('id').defaultRandom().primaryKey(),
  user_id: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  type: transactionTypeEnum('type').notNull(),
  status: transactionStatusEnum('status').default('pending').notNull(),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  coins: integer('coins').default(0).notNull(), // Coins awarded/spent
  description: text('description'),
  payment_method: text('payment_method'), // e.g., 'bank_transfer', 'credit_card'
  payment_reference: text('payment_reference'), // External payment ID
  processed_at: timestamp('processed_at'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  userIdx: index('transactions_user_idx').on(table.user_id),
  typeIdx: index('transactions_type_idx').on(table.type),
  statusIdx: index('transactions_status_idx').on(table.status),
}));

// Announcements table
export const announcements = pgTable('announcements', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: text('title').notNull(),
  slug: text('slug').notNull().unique(),
  content: text('content').notNull(),
  is_published: boolean('is_published').default(false).notNull(),
  published_at: timestamp('published_at'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  slugIdx: uniqueIndex('announcements_slug_idx').on(table.slug),
  publishedIdx: index('announcements_published_idx').on(table.is_published),
}));

// Upload jobs table (for BullMQ tracking)
export const upload_jobs = pgTable('upload_jobs', {
  id: uuid('id').defaultRandom().primaryKey(),
  job_id: text('job_id').notNull().unique(), // BullMQ job ID
  user_id: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  content_id: uuid('content_id').references(() => content.id, { onDelete: 'cascade' }),
  episode_id: uuid('episode_id').references(() => episodes.id, { onDelete: 'cascade' }),
  file_type: text('file_type').notNull(), // 'video', 'avatar', 'poster', etc.
  original_filename: text('original_filename').notNull(),
  file_size: integer('file_size').notNull(),
  upload_url: text('upload_url'), // R2 upload URL
  processed_url: text('processed_url'), // Final processed URL
  status: text('status').default('pending').notNull(), // 'pending', 'processing', 'completed', 'failed'
  progress: integer('progress').default(0).notNull(), // 0-100
  error_message: text('error_message'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  jobIdIdx: uniqueIndex('upload_jobs_job_id_idx').on(table.job_id),
  userIdx: index('upload_jobs_user_idx').on(table.user_id),
  statusIdx: index('upload_jobs_status_idx').on(table.status),
}));

// Password reset tokens
export const password_reset_tokens = pgTable('password_reset_tokens', {
  id: uuid('id').defaultRandom().primaryKey(),
  user_id: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  token: text('token').notNull().unique(),
  expires_at: timestamp('expires_at').notNull(),
  used_at: timestamp('used_at'),
  created_at: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  tokenIdx: uniqueIndex('password_reset_tokens_token_idx').on(table.token),
  userIdx: index('password_reset_tokens_user_idx').on(table.user_id),
}));

// Rate limiting table
export const rate_limits = pgTable('rate_limits', {
  id: uuid('id').defaultRandom().primaryKey(),
  identifier: text('identifier').notNull(), // IP or user ID
  action: text('action').notNull(), // 'login', 'signup', 'forgot_password', etc.
  attempts: integer('attempts').default(1).notNull(),
  last_attempt_at: timestamp('last_attempt_at').defaultNow().notNull(),
  blocked_until: timestamp('blocked_until'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  identifierActionIdx: uniqueIndex('rate_limits_identifier_action_idx').on(table.identifier, table.action),
}));