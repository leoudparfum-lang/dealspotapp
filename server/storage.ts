import {
  users,
  categories,
  businesses,
  businessUsers,
  deals,
  vouchers,
  reservations,
  reviews,
  favorites,
  notifications,
  business_payments,
  type User,
  type UpsertUser,
  type Category,
  type InsertCategory,
  type Business,
  type InsertBusiness,
  type BusinessUser,
  type InsertBusinessUser,
  type Deal,
  type InsertDeal,
  type Voucher,
  type InsertVoucher,
  type Reservation,
  type InsertReservation,
  type Review,
  type InsertReview,
  type Favorite,
  type InsertFavorite,
  type Notification,
  type InsertNotification,
  type BusinessPayment,
  type InsertBusinessPayment,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, asc, and, ilike, sql, or } from "drizzle-orm";
import { randomUUID, createHash, pbkdf2Sync, randomBytes } from "crypto";

// Interface for storage operations
export interface IStorage {
  // User operations (IMPORTANT: mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Category operations
  getCategories(): Promise<Category[]>;
  createCategory(category: InsertCategory): Promise<Category>;
  
  // Business operations
  getBusinesses(): Promise<Business[]>;
  getBusiness(id: string): Promise<Business | undefined>;
  createBusiness(business: InsertBusiness): Promise<Business>;
  
  // Deal operations
  getDeals(categoryId?: string, search?: string, featured?: boolean): Promise<Deal[]>;
  getDeal(id: string): Promise<Deal | undefined>;
  getFeaturedDeals(): Promise<Deal[]>;
  createDeal(deal: InsertDeal): Promise<Deal>;
  
  // Voucher operations
  getUserVouchers(userId: string): Promise<Voucher[]>;
  getVoucher(id: string): Promise<Voucher | undefined>;
  createVoucher(voucher: InsertVoucher): Promise<Voucher>;
  useVoucher(voucherId: string): Promise<boolean>;
  
  // Reservation operations
  getUserReservations(userId: string): Promise<Reservation[]>;
  createReservation(reservation: InsertReservation): Promise<Reservation>;
  updateReservationStatus(id: string, status: string): Promise<boolean>;
  
  // Review operations
  getBusinessReviews(businessId: string): Promise<Review[]>;
  getDealReviews(dealId: string): Promise<Review[]>;
  createReview(review: InsertReview): Promise<Review>;
  
  // Favorite operations
  getUserFavorites(userId: string): Promise<Deal[]>;
  addFavorite(favorite: InsertFavorite): Promise<boolean>;
  removeFavorite(userId: string, dealId: string): Promise<boolean>;
  isFavorite(userId: string, dealId: string): Promise<boolean>;
  
  // Notification operations
  getUserNotifications(userId: string): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationRead(id: string): Promise<boolean>;

  // Business payment operations
  createBusinessPayment(payment: InsertBusinessPayment): Promise<BusinessPayment>;
  updateBusinessPaymentStatus(id: string, status: string): Promise<boolean>;
  getBusinessPayments(businessId: string): Promise<BusinessPayment[]>;
  
  // Business user operations
  getBusinessOwners(businessId: string): Promise<string[]>;
  notifyBusinessOwners(businessId: string, notification: InsertNotification): Promise<void>;
  createBusinessUser(user: InsertBusinessUser): Promise<BusinessUser>;
  getBusinessUser(email: string): Promise<BusinessUser | undefined>;
  authenticateBusinessUser(email: string, password: string): Promise<BusinessUser | null>;
}

export class DatabaseStorage implements IStorage {
  // User operations (IMPORTANT: mandatory for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Category operations
  async getCategories(): Promise<Category[]> {
    return await db.select().from(categories).orderBy(asc(categories.name));
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const [newCategory] = await db
      .insert(categories)
      .values({ ...category, id: randomUUID() })
      .returning();
    return newCategory;
  }

  // Business operations
  async getBusinesses(): Promise<Business[]> {
    return await db.select().from(businesses).orderBy(desc(businesses.rating));
  }

  async getBusiness(id: string): Promise<Business | undefined> {
    const [business] = await db.select().from(businesses).where(eq(businesses.id, id));
    return business;
  }

  async createBusiness(business: InsertBusiness): Promise<Business> {
    const [newBusiness] = await db
      .insert(businesses)
      .values({ ...business, id: randomUUID() })
      .returning();
    return newBusiness;
  }

  // Deal operations
  async getDeals(categoryId?: string, search?: string, featured?: boolean): Promise<Deal[]> {
    let query = db
      .select({
        id: deals.id,
        businessId: deals.businessId,
        categoryId: deals.categoryId,
        title: deals.title,
        description: deals.description,
        originalPrice: deals.originalPrice,
        discountedPrice: deals.discountedPrice,
        discountPercentage: deals.discountPercentage,
        imageUrl: deals.imageUrl,
        imageUrls: deals.imageUrls,
        isActive: deals.isActive,
        isFeatured: deals.isFeatured,
        availableCount: deals.availableCount,
        expiresAt: deals.expiresAt,
        createdAt: deals.createdAt,
        business: {
          id: businesses.id,
          name: businesses.name,
          address: businesses.address,
          city: businesses.city,
          latitude: businesses.latitude,
          longitude: businesses.longitude,
          rating: businesses.rating,
          reviewCount: businesses.reviewCount,
        },
        category: {
          id: categories.id,
          name: categories.name,
          nameNl: categories.nameNl,
          icon: categories.icon,
        }
      })
      .from(deals)
      .leftJoin(businesses, eq(deals.businessId, businesses.id))
      .leftJoin(categories, eq(deals.categoryId, categories.id));

    // Build WHERE conditions
    const conditions: any[] = [eq(deals.isActive, true)];
    
    if (categoryId) {
      conditions.push(eq(deals.categoryId, categoryId));
    }
    
    if (search) {
      conditions.push(
        or(
          ilike(deals.title, `%${search}%`),
          ilike(deals.description, `%${search}%`),
          ilike(businesses.name, `%${search}%`)
        )
      );
    }

    if (featured) {
      conditions.push(eq(deals.isFeatured, true));
    }
    
    query = query.where(and(...conditions));

    return await query.orderBy(desc(deals.createdAt));
  }

  async getDeal(id: string): Promise<Deal | undefined> {
    const [deal] = await db
      .select({
        id: deals.id,
        businessId: deals.businessId,
        categoryId: deals.categoryId,
        title: deals.title,
        description: deals.description,
        originalPrice: deals.originalPrice,
        discountedPrice: deals.discountedPrice,
        discountPercentage: deals.discountPercentage,
        imageUrl: deals.imageUrl,
        imageUrls: deals.imageUrls,
        isActive: deals.isActive,
        isFeatured: deals.isFeatured,
        availableCount: deals.availableCount,
        expiresAt: deals.expiresAt,
        createdAt: deals.createdAt,
        business: {
          id: businesses.id,
          name: businesses.name,
          description: businesses.description,
          address: businesses.address,
          city: businesses.city,
          phone: businesses.phone,
          website: businesses.website,
          rating: businesses.rating,
          reviewCount: businesses.reviewCount,
        },
        category: {
          id: categories.id,
          name: categories.name,
          nameNl: categories.nameNl,
          icon: categories.icon,
        }
      })
      .from(deals)
      .leftJoin(businesses, eq(deals.businessId, businesses.id))
      .leftJoin(categories, eq(deals.categoryId, categories.id))
      .where(eq(deals.id, id));
    
    return deal;
  }

  async getFeaturedDeals(): Promise<Deal[]> {
    return await this.getDeals(undefined, undefined, true);
  }

  async createDeal(deal: InsertDeal): Promise<Deal> {
    const [newDeal] = await db
      .insert(deals)
      .values({ ...deal, id: randomUUID() })
      .returning();
    return newDeal;
  }

  // Voucher operations
  async getUserVouchers(userId: string): Promise<Voucher[]> {
    return await db
      .select({
        id: vouchers.id,
        userId: vouchers.userId,
        dealId: vouchers.dealId,
        code: vouchers.code,
        status: vouchers.status,
        purchasedAt: vouchers.purchasedAt,
        usedAt: vouchers.usedAt,
        expiresAt: vouchers.expiresAt,
        deal: {
          id: deals.id,
          title: deals.title,
          discountedPrice: deals.discountedPrice,
        },
        business: {
          id: businesses.id,
          name: businesses.name,
        }
      })
      .from(vouchers)
      .leftJoin(deals, eq(vouchers.dealId, deals.id))
      .leftJoin(businesses, eq(deals.businessId, businesses.id))
      .where(eq(vouchers.userId, userId))
      .orderBy(desc(vouchers.purchasedAt));
  }

  async getVoucher(id: string): Promise<Voucher | undefined> {
    const [voucher] = await db.select().from(vouchers).where(eq(vouchers.id, id));
    return voucher;
  }

  async createVoucher(voucher: InsertVoucher): Promise<Voucher> {
    const code = `DS-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    const [newVoucher] = await db
      .insert(vouchers)
      .values({ 
        ...voucher, 
        id: randomUUID(), 
        code,
        expiresAt: voucher.expiresAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days default
      })
      .returning();
    return newVoucher;
  }

  async useVoucher(voucherId: string): Promise<boolean> {
    const result = await db
      .update(vouchers)
      .set({ status: "used", usedAt: new Date() })
      .where(and(eq(vouchers.id, voucherId), eq(vouchers.status, "active")))
      .returning();
    return result.length > 0;
  }

  async verifyVoucherByCode(code: string): Promise<any> {
    const [voucher] = await db
      .select({
        id: vouchers.id,
        code: vouchers.code,
        status: vouchers.status,
        purchasedAt: vouchers.purchasedAt,
        usedAt: vouchers.usedAt,
        expiresAt: vouchers.expiresAt,
        deal: {
          id: deals.id,
          title: deals.title,
          description: deals.description,
          originalPrice: deals.originalPrice,
          discountedPrice: deals.discountedPrice,
          discountPercentage: deals.discountPercentage,
        },
        business: {
          id: businesses.id,
          name: businesses.name,
          address: businesses.address,
          city: businesses.city,
        },
        user: {
          id: users.id,
          email: users.email,
        }
      })
      .from(vouchers)
      .leftJoin(deals, eq(vouchers.dealId, deals.id))
      .leftJoin(businesses, eq(deals.businessId, businesses.id))
      .leftJoin(users, eq(vouchers.userId, users.id))
      .where(eq(vouchers.code, code));
    
    return voucher;
  }

  async getBusinessVouchers(businessId: string): Promise<any[]> {
    return await db
      .select({
        id: vouchers.id,
        code: vouchers.code,
        status: vouchers.status,
        purchasedAt: vouchers.purchasedAt,
        usedAt: vouchers.usedAt,
        expiresAt: vouchers.expiresAt,
        deal: {
          id: deals.id,
          title: deals.title,
          discountedPrice: deals.discountedPrice,
        },
        user: {
          email: users.email,
        }
      })
      .from(vouchers)
      .leftJoin(deals, eq(vouchers.dealId, deals.id))
      .leftJoin(users, eq(vouchers.userId, users.id))
      .where(eq(deals.businessId, businessId))
      .orderBy(desc(vouchers.purchasedAt));
  }

  // Reservation operations
  async getUserReservations(userId: string): Promise<Reservation[]> {
    return await db
      .select({
        id: reservations.id,
        userId: reservations.userId,
        dealId: reservations.dealId,
        businessId: reservations.businessId,
        reservationDate: reservations.reservationDate,
        partySize: reservations.partySize,
        specialRequests: reservations.specialRequests,
        status: reservations.status,
        createdAt: reservations.createdAt,
        deal: {
          id: deals.id,
          title: deals.title,
        },
        business: {
          id: businesses.id,
          name: businesses.name,
          address: businesses.address,
          phone: businesses.phone,
        }
      })
      .from(reservations)
      .leftJoin(deals, eq(reservations.dealId, deals.id))
      .leftJoin(businesses, eq(reservations.businessId, businesses.id))
      .where(eq(reservations.userId, userId))
      .orderBy(desc(reservations.reservationDate));
  }

  async createReservation(reservation: InsertReservation): Promise<Reservation> {
    const [newReservation] = await db
      .insert(reservations)
      .values({ ...reservation, id: randomUUID() })
      .returning();
    return newReservation;
  }

  async updateReservationStatus(id: string, status: string): Promise<boolean> {
    const result = await db
      .update(reservations)
      .set({ status })
      .where(eq(reservations.id, id))
      .returning();
    return result.length > 0;
  }

  // Review operations
  async getBusinessReviews(businessId: string): Promise<Review[]> {
    return await db
      .select({
        id: reviews.id,
        userId: reviews.userId,
        businessId: reviews.businessId,
        dealId: reviews.dealId,
        rating: reviews.rating,
        comment: reviews.comment,
        createdAt: reviews.createdAt,
        user: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl,
        }
      })
      .from(reviews)
      .leftJoin(users, eq(reviews.userId, users.id))
      .where(eq(reviews.businessId, businessId))
      .orderBy(desc(reviews.createdAt));
  }

  async getDealReviews(dealId: string): Promise<Review[]> {
    return await db
      .select({
        id: reviews.id,
        userId: reviews.userId,
        businessId: reviews.businessId,
        dealId: reviews.dealId,
        rating: reviews.rating,
        comment: reviews.comment,
        createdAt: reviews.createdAt,
        user: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl,
        }
      })
      .from(reviews)
      .leftJoin(users, eq(reviews.userId, users.id))
      .where(eq(reviews.dealId, dealId))
      .orderBy(desc(reviews.createdAt));
  }

  async createReview(review: InsertReview): Promise<Review> {
    const [newReview] = await db
      .insert(reviews)
      .values({ ...review, id: randomUUID() })
      .returning();
    
    // Update business rating
    const businessReviews = await db
      .select({ rating: reviews.rating })
      .from(reviews)
      .where(eq(reviews.businessId, review.businessId));
    
    const totalRating = businessReviews.reduce((sum, r) => sum + r.rating, 0);
    const avgRating = (totalRating / businessReviews.length).toFixed(1);
    
    await db
      .update(businesses)
      .set({ 
        rating: avgRating,
        reviewCount: businessReviews.length 
      })
      .where(eq(businesses.id, review.businessId));
    
    return newReview;
  }

  // Favorite operations
  async getUserFavorites(userId: string): Promise<Deal[]> {
    return await db
      .select({
        id: deals.id,
        businessId: deals.businessId,
        categoryId: deals.categoryId,
        title: deals.title,
        description: deals.description,
        originalPrice: deals.originalPrice,
        discountedPrice: deals.discountedPrice,
        discountPercentage: deals.discountPercentage,
        imageUrl: deals.imageUrl,
        isActive: deals.isActive,
        isFeatured: deals.isFeatured,
        availableCount: deals.availableCount,
        expiresAt: deals.expiresAt,
        createdAt: deals.createdAt,
        business: {
          id: businesses.id,
          name: businesses.name,
          address: businesses.address,
          city: businesses.city,
          rating: businesses.rating,
          reviewCount: businesses.reviewCount,
        }
      })
      .from(favorites)
      .leftJoin(deals, eq(favorites.dealId, deals.id))
      .leftJoin(businesses, eq(deals.businessId, businesses.id))
      .where(eq(favorites.userId, userId))
      .orderBy(desc(favorites.createdAt));
  }

  async addFavorite(favorite: InsertFavorite): Promise<boolean> {
    try {
      await db
        .insert(favorites)
        .values({ ...favorite, id: randomUUID() });
      return true;
    } catch {
      return false;
    }
  }

  async removeFavorite(userId: string, dealId: string): Promise<boolean> {
    const result = await db
      .delete(favorites)
      .where(and(eq(favorites.userId, userId), eq(favorites.dealId, dealId)))
      .returning();
    return result.length > 0;
  }

  async isFavorite(userId: string, dealId: string): Promise<boolean> {
    const [favorite] = await db
      .select()
      .from(favorites)
      .where(and(eq(favorites.userId, userId), eq(favorites.dealId, dealId)));
    return !!favorite;
  }

  // Notification operations
  async getUserNotifications(userId: string): Promise<Notification[]> {
    return await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt));
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [newNotification] = await db
      .insert(notifications)
      .values({ ...notification, id: randomUUID() })
      .returning();
    return newNotification;
  }

  async markNotificationRead(id: string): Promise<boolean> {
    const result = await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, id))
      .returning();
    return result.length > 0;
  }

  // Business user operations
  async getBusinessOwners(businessId: string): Promise<string[]> {
    const owners = await db
      .select({ email: businessUsers.email })
      .from(businessUsers)
      .where(and(
        eq(businessUsers.businessId, businessId),
        or(eq(businessUsers.role, "owner"), eq(businessUsers.role, "manager")),
        eq(businessUsers.isActive, true)
      ));
    
    return owners.map(owner => owner.email);
  }

  async notifyBusinessOwners(businessId: string, notificationData: InsertNotification): Promise<void> {
    const ownerEmails = await this.getBusinessOwners(businessId);
    
    // Voor nu sturen we notificaties naar de eerste eigenaar
    // Later kunnen we dit uitbreiden naar alle eigenaren
    if (ownerEmails.length > 0) {
      // Zoek de user ID voor het eerste email adres
      const [user] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, ownerEmails[0]));
      
      if (user) {
        await this.createNotification({
          ...notificationData,
          userId: user.id
        });
      }
    }
  }

  // Business user authentication methods
  private hashPassword(password: string): string {
    const salt = randomBytes(32).toString('hex');
    const hash = pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
    return `${salt}:${hash}`;
  }

  private verifyPassword(password: string, hashedPassword: string): boolean {
    const [salt, hash] = hashedPassword.split(':');
    const verifyHash = pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
    return hash === verifyHash;
  }

  async createBusinessUser(user: InsertBusinessUser): Promise<BusinessUser> {
    const hashedPassword = this.hashPassword(user.password);
    const [newUser] = await db
      .insert(businessUsers)
      .values({
        ...user,
        password: hashedPassword,
        id: randomUUID()
      })
      .returning();
    return newUser;
  }

  async getBusinessUser(email: string): Promise<BusinessUser | undefined> {
    const [user] = await db
      .select()
      .from(businessUsers)
      .where(eq(businessUsers.email, email));
    return user;
  }

  async authenticateBusinessUser(email: string, password: string): Promise<BusinessUser | null> {
    const user = await this.getBusinessUser(email);
    if (!user || !user.isActive) {
      return null;
    }
    
    if (this.verifyPassword(password, user.password)) {
      return user;
    }
    
    return null;
  }

  // Business payment operations
  async createBusinessPayment(payment: InsertBusinessPayment): Promise<BusinessPayment> {
    const [newPayment] = await db.insert(business_payments).values({
      ...payment,
      id: randomUUID(),
      createdAt: new Date(),
    }).returning();
    return newPayment;
  }

  async updateBusinessPaymentStatus(id: string, status: string): Promise<boolean> {
    const result = await db.update(business_payments)
      .set({ status })
      .where(eq(business_payments.id, id));
    return result.rowCount > 0;
  }

  async getBusinessPayments(businessId: string): Promise<BusinessPayment[]> {
    return db.select().from(business_payments)
      .where(eq(business_payments.businessId, businessId))
      .orderBy(desc(business_payments.createdAt));
  }
}

export const storage = new DatabaseStorage();
