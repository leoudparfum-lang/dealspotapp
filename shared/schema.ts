import { sql, relations } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  decimal,
  boolean,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  loyaltyPoints: integer("loyalty_points").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const categories = pgTable("categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  nameNl: varchar("name_nl").notNull(),
  icon: varchar("icon").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const businesses = pgTable("businesses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  description: text("description"),
  address: text("address").notNull(),
  city: varchar("city").notNull(),
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),
  phone: varchar("phone"),
  email: varchar("email"),
  website: varchar("website"),
  imageUrl: varchar("image_url"),
  rating: decimal("rating", { precision: 2, scale: 1 }).default("0.0"),
  reviewCount: integer("review_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const deals = pgTable("deals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  businessId: varchar("business_id").references(() => businesses.id).notNull(),
  categoryId: varchar("category_id").references(() => categories.id).notNull(),
  title: varchar("title").notNull(),
  description: text("description").notNull(),
  originalPrice: decimal("original_price", { precision: 10, scale: 2 }).notNull(),
  discountedPrice: decimal("discounted_price", { precision: 10, scale: 2 }).notNull(),
  discountPercentage: integer("discount_percentage").notNull(),
  imageUrl: varchar("image_url"),
  imageUrls: text("image_urls").array(),
  isActive: boolean("is_active").default(true),
  isFeatured: boolean("is_featured").default(false),
  availableCount: integer("available_count"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const vouchers = pgTable("vouchers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  dealId: varchar("deal_id").references(() => deals.id).notNull(),
  code: varchar("code").unique().notNull(),
  status: varchar("status").default("active"), // active, used, expired
  purchasedAt: timestamp("purchased_at").defaultNow(),
  usedAt: timestamp("used_at"),
  expiresAt: timestamp("expires_at").notNull(),
});

export const reservations = pgTable("reservations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  dealId: varchar("deal_id").references(() => deals.id).notNull(),
  businessId: varchar("business_id").references(() => businesses.id).notNull(),
  reservationDate: timestamp("reservation_date").notNull(),
  partySize: integer("party_size").notNull(),
  specialRequests: text("special_requests"),
  status: varchar("status").default("pending"), // pending, confirmed, cancelled
  createdAt: timestamp("created_at").defaultNow(),
});

export const reviews = pgTable("reviews", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  businessId: varchar("business_id").references(() => businesses.id).notNull(),
  dealId: varchar("deal_id").references(() => deals.id),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const favorites = pgTable("favorites", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  dealId: varchar("deal_id").references(() => deals.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  title: varchar("title").notNull(),
  message: text("message").notNull(),
  type: varchar("type").notNull(), // 'voucher_redeemed', 'deal_approved', etc.
  read: boolean("read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const business_payments = pgTable("business_payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  businessId: varchar("business_id").references(() => businesses.id).notNull(),
  voucherId: varchar("voucher_id").references(() => vouchers.id).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  description: text("description"),
  stripeTransferId: varchar("stripe_transfer_id"),
  status: varchar("status").default("pending"), // 'pending', 'completed', 'failed'
  createdAt: timestamp("created_at").defaultNow(),
});

// Admin users table for admin panel access
export const adminUsers = pgTable("admin_users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: varchar("username").unique().notNull(),
  password: varchar("password").notNull(), // In real app, this would be hashed
  name: varchar("name").notNull(),
  role: varchar("role").default("admin"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Loyalty transactions for points system
export const loyaltyTransactions = pgTable("loyalty_transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  delta: integer("delta").notNull(), // Points gained or lost
  reason: varchar("reason").notNull(), // purchase, redemption, bonus
  referenceType: varchar("reference_type"), // voucher, deal, referral
  referenceId: varchar("reference_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

// User location preferences
export const userLocations = pgTable("user_locations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  latitude: decimal("latitude", { precision: 10, scale: 8 }).notNull(),
  longitude: decimal("longitude", { precision: 11, scale: 8 }).notNull(),
  address: text("address"),
  city: varchar("city"),
  isDefault: boolean("is_default").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Business users - separate accounts for businesses
export const businessUsers = pgTable("business_users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  businessId: varchar("business_id").references(() => businesses.id).notNull(),
  email: varchar("email").unique().notNull(),
  password: varchar("password").notNull(), // Hashed password
  name: varchar("name").notNull(),
  role: varchar("role").default("manager"), // manager, owner, staff
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Deal submissions from businesses
export const dealSubmissions = pgTable("deal_submissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  businessId: varchar("business_id").references(() => businesses.id).notNull(),
  submittedBy: varchar("submitted_by").references(() => businessUsers.id),
  title: varchar("title").notNull(),
  description: text("description").notNull(),
  originalPrice: decimal("original_price", { precision: 10, scale: 2 }).notNull(),
  discountedPrice: decimal("discounted_price", { precision: 10, scale: 2 }).notNull(),
  categoryId: varchar("category_id").references(() => categories.id).notNull(),
  imageUrls: text("image_urls").array(), // Multiple images
  terms: text("terms"), // Terms and conditions
  availableCount: integer("available_count"),
  validFrom: timestamp("valid_from").defaultNow(),
  validUntil: timestamp("valid_until").notNull(),
  status: varchar("status").default("pending"), // pending, approved, rejected, expired
  adminNotes: text("admin_notes"),
  approvedBy: varchar("approved_by").references(() => adminUsers.id),
  approvedAt: timestamp("approved_at"),
  dealId: varchar("deal_id").references(() => deals.id), // If approved
  createdAt: timestamp("created_at").defaultNow(),
});

// User deal nominations
export const dealNominations = pgTable("deal_nominations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  businessId: varchar("business_id").references(() => businesses.id).notNull(),
  title: varchar("title").notNull(),
  description: text("description").notNull(),
  suggestedDiscount: varchar("suggested_discount"), // "20% off" or "€10 korting"
  reason: text("reason"), // Why this would be a good deal
  upvotes: integer("upvotes").default(0),
  status: varchar("status").default("active"), // active, responded, closed
  businessResponse: text("business_response"),
  respondedAt: timestamp("responded_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Votes on deal nominations
export const nominationVotes = pgTable("nomination_votes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  nominationId: varchar("nomination_id").references(() => dealNominations.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  voteType: varchar("vote_type").notNull(), // upvote, downvote
  createdAt: timestamp("created_at").defaultNow(),
});

// Deal analytics
export const dealAnalytics = pgTable("deal_analytics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  dealId: varchar("deal_id").references(() => deals.id).notNull(),
  date: timestamp("date").defaultNow(),
  views: integer("views").default(0),
  clicks: integer("clicks").default(0),
  purchases: integer("purchases").default(0),
  favorites: integer("favorites").default(0),
  shares: integer("shares").default(0),
});

// User-generated content for deals
export const dealContent = pgTable("deal_content", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  dealId: varchar("deal_id").references(() => deals.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  type: varchar("type").notNull(), // photo, video, story
  content: text("content"), // URL or text content
  caption: text("caption"),
  isApproved: boolean("is_approved").default(false),
  moderatedBy: varchar("moderated_by").references(() => adminUsers.id),
  moderatedAt: timestamp("moderated_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  vouchers: many(vouchers),
  reservations: many(reservations),
  reviews: many(reviews),
  favorites: many(favorites),
  notifications: many(notifications),
  loyaltyTransactions: many(loyaltyTransactions),
  userLocations: many(userLocations),
  dealNominations: many(dealNominations),
  nominationVotes: many(nominationVotes),
  dealContent: many(dealContent),
}));

export const businessesRelations = relations(businesses, ({ many }) => ({
  deals: many(deals),
  reservations: many(reservations),
  reviews: many(reviews),
  businessUsers: many(businessUsers),
  dealSubmissions: many(dealSubmissions),
  dealNominations: many(dealNominations),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  deals: many(deals),
}));

export const dealsRelations = relations(deals, ({ one, many }) => ({
  business: one(businesses, {
    fields: [deals.businessId],
    references: [businesses.id],
  }),
  category: one(categories, {
    fields: [deals.categoryId],
    references: [categories.id],
  }),
  vouchers: many(vouchers),
  reservations: many(reservations),
  reviews: many(reviews),
  favorites: many(favorites),
  analytics: many(dealAnalytics),
  content: many(dealContent),
}));

export const vouchersRelations = relations(vouchers, ({ one }) => ({
  user: one(users, {
    fields: [vouchers.userId],
    references: [users.id],
  }),
  deal: one(deals, {
    fields: [vouchers.dealId],
    references: [deals.id],
  }),
}));

export const reservationsRelations = relations(reservations, ({ one }) => ({
  user: one(users, {
    fields: [reservations.userId],
    references: [users.id],
  }),
  deal: one(deals, {
    fields: [reservations.dealId],
    references: [deals.id],
  }),
  business: one(businesses, {
    fields: [reservations.businessId],
    references: [businesses.id],
  }),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  user: one(users, {
    fields: [reviews.userId],
    references: [users.id],
  }),
  business: one(businesses, {
    fields: [reviews.businessId],
    references: [businesses.id],
  }),
  deal: one(deals, {
    fields: [reviews.dealId],
    references: [deals.id],
  }),
}));

export const favoritesRelations = relations(favorites, ({ one }) => ({
  user: one(users, {
    fields: [favorites.userId],
    references: [users.id],
  }),
  deal: one(deals, {
    fields: [favorites.dealId],
    references: [deals.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

export const loyaltyTransactionsRelations = relations(loyaltyTransactions, ({ one }) => ({
  user: one(users, {
    fields: [loyaltyTransactions.userId],
    references: [users.id],
  }),
}));

export const userLocationsRelations = relations(userLocations, ({ one }) => ({
  user: one(users, {
    fields: [userLocations.userId],
    references: [users.id],
  }),
}));

export const businessUsersRelations = relations(businessUsers, ({ one, many }) => ({
  business: one(businesses, {
    fields: [businessUsers.businessId],
    references: [businesses.id],
  }),
  dealSubmissions: many(dealSubmissions),
}));

export const dealSubmissionsRelations = relations(dealSubmissions, ({ one }) => ({
  business: one(businesses, {
    fields: [dealSubmissions.businessId],
    references: [businesses.id],
  }),
  submittedBy: one(businessUsers, {
    fields: [dealSubmissions.submittedBy],
    references: [businessUsers.id],
  }),
  category: one(categories, {
    fields: [dealSubmissions.categoryId],
    references: [categories.id],
  }),
  approvedBy: one(adminUsers, {
    fields: [dealSubmissions.approvedBy],
    references: [adminUsers.id],
  }),
  deal: one(deals, {
    fields: [dealSubmissions.dealId],
    references: [deals.id],
  }),
}));

export const dealNominationsRelations = relations(dealNominations, ({ one, many }) => ({
  user: one(users, {
    fields: [dealNominations.userId],
    references: [users.id],
  }),
  business: one(businesses, {
    fields: [dealNominations.businessId],
    references: [businesses.id],
  }),
  votes: many(nominationVotes),
}));

export const nominationVotesRelations = relations(nominationVotes, ({ one }) => ({
  nomination: one(dealNominations, {
    fields: [nominationVotes.nominationId],
    references: [dealNominations.id],
  }),
  user: one(users, {
    fields: [nominationVotes.userId],
    references: [users.id],
  }),
}));

export const dealAnalyticsRelations = relations(dealAnalytics, ({ one }) => ({
  deal: one(deals, {
    fields: [dealAnalytics.dealId],
    references: [deals.id],
  }),
}));

export const dealContentRelations = relations(dealContent, ({ one }) => ({
  deal: one(deals, {
    fields: [dealContent.dealId],
    references: [deals.id],
  }),
  user: one(users, {
    fields: [dealContent.userId],
    references: [users.id],
  }),
  moderatedBy: one(adminUsers, {
    fields: [dealContent.moderatedBy],
    references: [adminUsers.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
  createdAt: true,
});

export const insertBusinessSchema = createInsertSchema(businesses).omit({
  id: true,
  createdAt: true,
});

export const insertDealSchema = createInsertSchema(deals).omit({
  id: true,
  createdAt: true,
});

export const insertVoucherSchema = createInsertSchema(vouchers).omit({
  id: true,
  purchasedAt: true,
});

export const insertReservationSchema = createInsertSchema(reservations).omit({
  id: true,
  createdAt: true,
});

export const insertReviewSchema = createInsertSchema(reviews).omit({
  id: true,
  createdAt: true,
});

export const insertFavoriteSchema = createInsertSchema(favorites).omit({
  id: true,
  createdAt: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});

export const insertBusinessPaymentSchema = createInsertSchema(business_payments).omit({
  id: true,
  createdAt: true,
});

export const insertAdminUserSchema = createInsertSchema(adminUsers).omit({
  id: true,
  createdAt: true,
});

export const insertLoyaltyTransactionSchema = createInsertSchema(loyaltyTransactions).omit({
  id: true,
  createdAt: true,
});

export const insertUserLocationSchema = createInsertSchema(userLocations).omit({
  id: true,
  createdAt: true,
});

export const insertBusinessUserSchema = createInsertSchema(businessUsers).omit({
  id: true,
  createdAt: true,
});

export const insertDealSubmissionSchema = createInsertSchema(dealSubmissions).omit({
  id: true,
  createdAt: true,
});

export const insertDealNominationSchema = createInsertSchema(dealNominations).omit({
  id: true,
  createdAt: true,
});

export const insertNominationVoteSchema = createInsertSchema(nominationVotes).omit({
  id: true,
  createdAt: true,
});

export const insertDealAnalyticsSchema = createInsertSchema(dealAnalytics).omit({
  id: true,
});

export const insertDealContentSchema = createInsertSchema(dealContent).omit({
  id: true,
  createdAt: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Business = typeof businesses.$inferSelect;
export type InsertBusiness = z.infer<typeof insertBusinessSchema>;
export type Deal = typeof deals.$inferSelect;
export type InsertDeal = z.infer<typeof insertDealSchema>;
export type Voucher = typeof vouchers.$inferSelect;
export type InsertVoucher = z.infer<typeof insertVoucherSchema>;
export type Reservation = typeof reservations.$inferSelect;
export type InsertReservation = z.infer<typeof insertReservationSchema>;
export type Review = typeof reviews.$inferSelect;
export type InsertReview = z.infer<typeof insertReviewSchema>;
export type Favorite = typeof favorites.$inferSelect;
export type InsertFavorite = z.infer<typeof insertFavoriteSchema>;
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type AdminUser = typeof adminUsers.$inferSelect;
export type InsertAdminUser = z.infer<typeof insertAdminUserSchema>;
export type LoyaltyTransaction = typeof loyaltyTransactions.$inferSelect;
export type InsertLoyaltyTransaction = z.infer<typeof insertLoyaltyTransactionSchema>;
export type UserLocation = typeof userLocations.$inferSelect;
export type InsertUserLocation = z.infer<typeof insertUserLocationSchema>;
export type BusinessUser = typeof businessUsers.$inferSelect;
export type InsertBusinessUser = z.infer<typeof insertBusinessUserSchema>;
export type DealSubmission = typeof dealSubmissions.$inferSelect;
export type InsertDealSubmission = z.infer<typeof insertDealSubmissionSchema>;
export type DealNomination = typeof dealNominations.$inferSelect;
export type InsertDealNomination = z.infer<typeof insertDealNominationSchema>;
export type NominationVote = typeof nominationVotes.$inferSelect;
export type InsertNominationVote = z.infer<typeof insertNominationVoteSchema>;
export type DealAnalytics = typeof dealAnalytics.$inferSelect;
export type InsertDealAnalytics = z.infer<typeof insertDealAnalyticsSchema>;
export type DealContent = typeof dealContent.$inferSelect;
export type InsertDealContent = z.infer<typeof insertDealContentSchema>;
export type BusinessPayment = typeof business_payments.$inferSelect;
export type InsertBusinessPayment = z.infer<typeof insertBusinessPaymentSchema>;
