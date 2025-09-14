import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { 
  insertDealSchema, 
  insertVoucherSchema, 
  insertReservationSchema, 
  insertReviewSchema,
  insertFavoriteSchema,
  insertNotificationSchema,
  adminUsers 
} from "@shared/schema";
import { eq } from "drizzle-orm";
import { db } from "./db";
import {
  ObjectStorageService,
  ObjectNotFoundError,
} from "./objectStorage";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Admin login route
  app.post('/api/admin/login', async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
      }

      // Find admin user
      const [admin] = await db
        .select()
        .from(adminUsers)
        .where(eq(adminUsers.username, username));

      if (!admin || admin.password !== password || !admin.isActive) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // In a real app, you'd create a JWT token here
      // For demo purposes, we'll just return success
      res.json({
        success: true,
        admin: {
          id: admin.id,
          username: admin.username,
          name: admin.name,
          role: admin.role,
        }
      });
    } catch (error) {
      console.error("Error during admin login:", error);
      res.status(500).json({ message: "Failed to login" });
    }
  });

  // Demo route for testing without authentication
  app.get('/api/demo/user', async (req, res) => {
    try {
      // Return a demo user for testing purposes
      res.json({
        id: "demo-user-123",
        email: "demo@dealspot.nl",
        firstName: "Demo",
        lastName: "Gebruiker",
        loyaltyPoints: 150,
      });
    } catch (error) {
      console.error("Error fetching demo user:", error);
      res.status(500).json({ message: "Failed to fetch demo user" });
    }
  });

  // Category routes
  app.get('/api/categories', async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  // Business routes
  app.get('/api/businesses', async (req, res) => {
    try {
      const businesses = await storage.getBusinesses();
      res.json(businesses);
    } catch (error) {
      console.error("Error fetching businesses:", error);
      res.status(500).json({ message: "Failed to fetch businesses" });
    }
  });

  app.get('/api/businesses/:id', async (req, res) => {
    try {
      const business = await storage.getBusiness(req.params.id);
      if (!business) {
        return res.status(404).json({ message: "Business not found" });
      }
      res.json(business);
    } catch (error) {
      console.error("Error fetching business:", error);
      res.status(500).json({ message: "Failed to fetch business" });
    }
  });

  // Deal routes
  app.get('/api/deals', async (req, res) => {
    try {
      const { category, search, featured } = req.query;
      const deals = await storage.getDeals(
        category as string, 
        search as string, 
        featured === 'true'
      );
      res.json(deals);
    } catch (error) {
      console.error("Error fetching deals:", error);
      res.status(500).json({ message: "Failed to fetch deals" });
    }
  });

  app.get('/api/deals/featured', async (req, res) => {
    try {
      const deals = await storage.getFeaturedDeals();
      res.json(deals);
    } catch (error) {
      console.error("Error fetching featured deals:", error);
      res.status(500).json({ message: "Failed to fetch featured deals" });
    }
  });

  app.get('/api/deals/:id', async (req, res) => {
    try {
      const deal = await storage.getDeal(req.params.id);
      if (!deal) {
        return res.status(404).json({ message: "Deal not found" });
      }
      res.json(deal);
    } catch (error) {
      console.error("Error fetching deal:", error);
      res.status(500).json({ message: "Failed to fetch deal" });
    }
  });

  // Voucher routes
  app.get('/api/vouchers', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const vouchers = await storage.getUserVouchers(userId);
      res.json(vouchers);
    } catch (error) {
      console.error("Error fetching vouchers:", error);
      res.status(500).json({ message: "Failed to fetch vouchers" });
    }
  });

  app.post('/api/vouchers', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const voucherData = insertVoucherSchema.parse({
        ...req.body,
        userId
      });
      
      const voucher = await storage.createVoucher(voucherData);
      
      // Create notification
      await storage.createNotification({
        userId,
        title: "Nieuwe voucher",
        message: `Uw voucher voor ${req.body.dealTitle} is aangekocht!`,
        type: "new_voucher"
      });
      
      res.json(voucher);
    } catch (error) {
      console.error("Error creating voucher:", error);
      res.status(500).json({ message: "Failed to create voucher" });
    }
  });

  app.patch('/api/vouchers/:id/use', isAuthenticated, async (req, res) => {
    try {
      const success = await storage.useVoucher(req.params.id);
      if (!success) {
        return res.status(400).json({ message: "Voucher could not be used" });
      }
      res.json({ message: "Voucher used successfully" });
    } catch (error) {
      console.error("Error using voucher:", error);
      res.status(500).json({ message: "Failed to use voucher" });
    }
  });

  // Business voucher verification routes
  app.post('/api/business/vouchers/verify', async (req, res) => {
    try {
      const { code } = req.body;
      
      if (!code) {
        return res.status(400).json({ message: "Voucher code is required" });
      }

      const voucher = await storage.verifyVoucherByCode(code);
      
      if (!voucher) {
        return res.status(404).json({ message: "Voucher not found" });
      }

      // Check if voucher is expired
      const now = new Date();
      const expiresAt = new Date(voucher.expiresAt);
      
      if (expiresAt < now) {
        return res.json({
          valid: false,
          voucher,
          message: "Voucher is expired"
        });
      }

      // Check if voucher is already used
      if (voucher.status === "used") {
        return res.json({
          valid: false,
          voucher,
          message: "Voucher has already been used"
        });
      }

      // Check if voucher is active
      if (voucher.status !== "active") {
        return res.json({
          valid: false,
          voucher,
          message: "Voucher is not active"
        });
      }

      res.json({
        valid: true,
        voucher,
        message: "Voucher is valid and ready to use"
      });
      
    } catch (error) {
      console.error("Error verifying voucher:", error);
      res.status(500).json({ message: "Failed to verify voucher" });
    }
  });

  app.post('/api/business/vouchers/redeem', async (req, res) => {
    try {
      const { code, businessId } = req.body;
      
      if (!code || !businessId) {
        return res.status(400).json({ message: "Voucher code and business ID are required" });
      }

      const voucher = await storage.verifyVoucherByCode(code);
      
      if (!voucher) {
        return res.status(404).json({ message: "Voucher not found" });
      }

      // Verify voucher belongs to this business
      if (voucher.business.id !== businessId) {
        return res.status(403).json({ 
          message: "This voucher is not valid for your business",
          validFor: voucher.business.name
        });
      }

      // Check if voucher is valid and active
      const now = new Date();
      const expiresAt = new Date(voucher.expiresAt);
      
      if (expiresAt < now) {
        return res.status(400).json({ message: "Voucher has expired" });
      }

      if (voucher.status !== "active") {
        return res.status(400).json({ message: "Voucher is not active" });
      }

      // Mark voucher as used
      const success = await storage.useVoucher(voucher.id);
      
      if (!success) {
        return res.status(400).json({ message: "Failed to redeem voucher" });
      }

      res.json({
        success: true,
        message: "Voucher redeemed successfully",
        voucher: {
          ...voucher,
          status: "used",
          usedAt: new Date()
        }
      });
      
    } catch (error) {
      console.error("Error redeeming voucher:", error);
      res.status(500).json({ message: "Failed to redeem voucher" });
    }
  });

  app.get('/api/business/:businessId/vouchers', async (req, res) => {
    try {
      const { businessId } = req.params;
      const vouchers = await storage.getBusinessVouchers(businessId);
      res.json(vouchers);
    } catch (error) {
      console.error("Error fetching business vouchers:", error);
      res.status(500).json({ message: "Failed to fetch vouchers" });
    }
  });

  // Reservation routes
  app.get('/api/reservations', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const reservations = await storage.getUserReservations(userId);
      res.json(reservations);
    } catch (error) {
      console.error("Error fetching reservations:", error);
      res.status(500).json({ message: "Failed to fetch reservations" });
    }
  });

  app.post('/api/reservations', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      console.log("Reservation request body:", req.body);
      
      const reservationData = insertReservationSchema.parse({
        ...req.body,
        userId
      });
      
      console.log("Parsed reservation data:", reservationData);
      
      const reservation = await storage.createReservation(reservationData);
      
      // Create notification for customer
      await storage.createNotification({
        userId,
        title: "Reservering bevestigd",
        message: "Uw reservering is succesvol bevestigd!",
        type: "reservation_confirmed"
      });

      // Notify business owners about new reservation
      // Note: Business notifications would be handled differently in production
      
      res.json(reservation);
    } catch (error) {
      console.error("Error creating reservation:", error);
      console.error("Error details:", error instanceof Error ? error.message : String(error));
      res.status(500).json({ message: error.message || "Failed to create reservation" });
    }
  });

  // Review routes
  app.get('/api/businesses/:id/reviews', async (req, res) => {
    try {
      const reviews = await storage.getBusinessReviews(req.params.id);
      res.json(reviews);
    } catch (error) {
      console.error("Error fetching reviews:", error);
      res.status(500).json({ message: "Failed to fetch reviews" });
    }
  });

  app.get('/api/deals/:id/reviews', async (req, res) => {
    try {
      const reviews = await storage.getDealReviews(req.params.id);
      res.json(reviews);
    } catch (error) {
      console.error("Error fetching deal reviews:", error);
      res.status(500).json({ message: "Failed to fetch deal reviews" });
    }
  });

  app.post('/api/reviews', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const reviewData = insertReviewSchema.parse({
        ...req.body,
        userId
      });
      
      const review = await storage.createReview(reviewData);
      res.json(review);
    } catch (error) {
      console.error("Error creating review:", error);
      res.status(500).json({ message: "Failed to create review" });
    }
  });

  // Favorite routes
  app.get('/api/favorites', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const favorites = await storage.getUserFavorites(userId);
      res.json(favorites);
    } catch (error) {
      console.error("Error fetching favorites:", error);
      res.status(500).json({ message: "Failed to fetch favorites" });
    }
  });

  app.post('/api/favorites', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const favoriteData = insertFavoriteSchema.parse({
        ...req.body,
        userId
      });
      
      const success = await storage.addFavorite(favoriteData);
      if (!success) {
        return res.status(400).json({ message: "Failed to add favorite" });
      }
      res.json({ message: "Added to favorites" });
    } catch (error) {
      console.error("Error adding favorite:", error);
      res.status(500).json({ message: "Failed to add favorite" });
    }
  });

  app.delete('/api/favorites/:dealId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const success = await storage.removeFavorite(userId, req.params.dealId);
      if (!success) {
        return res.status(400).json({ message: "Failed to remove favorite" });
      }
      res.json({ message: "Removed from favorites" });
    } catch (error) {
      console.error("Error removing favorite:", error);
      res.status(500).json({ message: "Failed to remove favorite" });
    }
  });

  app.get('/api/favorites/:dealId/check', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const isFavorite = await storage.isFavorite(userId, req.params.dealId);
      res.json({ isFavorite });
    } catch (error) {
      console.error("Error checking favorite:", error);
      res.status(500).json({ message: "Failed to check favorite" });
    }
  });

  // Enhanced notifications route
  app.get('/api/notifications', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Mock notifications for demo - in real app get from database
      const notifications = [
        {
          id: '1',
          userId,
          title: 'Nieuwe deal in je buurt! 🎉',
          message: 'FitZone Gym heeft een nieuwe deal: 50% korting op jaarabonnement',
          type: 'new_deal',
          isRead: false,
          createdAt: new Date().toISOString()
        },
        {
          id: '2', 
          userId,
          title: 'Je voorstel heeft reactie! 💬',
          message: 'Restaurant De Smaak heeft gereageerd op je deal voorstel',
          type: 'nomination_response',
          isRead: false,
          createdAt: new Date(Date.now() - 3600000).toISOString()
        },
        {
          id: '3',
          userId,
          title: 'Deal bijna verlopen ⏰',
          message: 'Je 30% korting bij Café Central verloopt morgen!',
          type: 'deal_expiring',
          isRead: true,
          createdAt: new Date(Date.now() - 7200000).toISOString()
        }
      ];
      
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.patch('/api/notifications/:id/read', isAuthenticated, async (req, res) => {
    try {
      const success = await storage.markNotificationRead(req.params.id);
      if (!success) {
        return res.status(400).json({ message: "Failed to mark notification as read" });
      }
      res.json({ message: "Notification marked as read" });
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  // Loyalty routes
  app.get('/api/loyalty/points', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      // Mock transactions for demo purposes
      const transactions: any[] = [];
      
      res.json({
        totalPoints: user?.loyaltyPoints || 0,
        transactions: transactions.slice(0, 10) // Latest 10 transactions
      });
    } catch (error) {
      console.error("Error fetching loyalty points:", error);
      res.status(500).json({ message: "Failed to fetch loyalty points" });
    }
  });

  app.post('/api/loyalty/redeem', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { points, dealId } = req.body;
      
      if (!points || points <= 0) {
        return res.status(400).json({ message: "Invalid points amount" });
      }

      const user = await storage.getUser(userId);
      if (!user || (user.loyaltyPoints || 0) < points) {
        return res.status(400).json({ message: "Insufficient loyalty points" });
      }

      // Mock redemption for demo purposes
      const success = true;
      if (!success) {
        return res.status(400).json({ message: "Failed to redeem points" });
      }

      res.json({ 
        success: true, 
        pointsRedeemed: points,
        remainingPoints: (user.loyaltyPoints || 0) - points
      });
    } catch (error) {
      console.error("Error redeeming loyalty points:", error);
      res.status(500).json({ message: "Failed to redeem loyalty points" });
    }
  });

  // Payment routes (mock implementation)
  app.post('/api/payments/process', isAuthenticated, async (req: any, res) => {
    try {
      const { dealId, paymentMethod, amount } = req.body;
      
      // Mock payment processing
      const isSuccessful = Math.random() > 0.1; // 90% success rate
      
      if (!isSuccessful) {
        return res.status(400).json({ 
          message: "Payment failed", 
          error: "Insufficient funds or payment method declined" 
        });
      }

      // Create voucher after successful payment
      const userId = req.user.claims.sub;
      const voucher = await storage.createVoucher({
        code: `V${Date.now()}`,
        userId,
        dealId,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
      });

      // Get deal info to notify business owner
      const deal = await storage.getDeal(dealId);
      if (deal) {
        // Business purchase notifications would be handled in production
      }

      res.json({ 
        success: true, 
        transactionId: `tx_${Date.now()}`,
        voucher 
      });
    } catch (error) {
      console.error("Error processing payment:", error);
      res.status(500).json({ message: "Failed to process payment" });
    }
  });

  // Business Authentication routes
  app.post('/api/business/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
      }
      
      const businessUser = await storage.authenticateBusinessUser(email, password);
      
      if (businessUser) {
        // Get the associated business details
        const business = await storage.getBusiness(businessUser.businessId);
        
        const businessSession = {
          user: {
            id: businessUser.id,
            email: businessUser.email,
            name: businessUser.name,
            role: businessUser.role
          },
          business: business,
          token: `business-${businessUser.id}-${Date.now()}`
        };
        
        res.json(businessSession);
      } else {
        res.status(401).json({ message: 'Invalid email or password' });
      }
    } catch (error) {
      console.error('Business login error:', error);
      res.status(500).json({ message: 'Login failed' });
    }
  });

  app.post('/api/business/register', async (req, res) => {
    try {
      const {
        businessName,
        description,
        category,
        phone,
        website,
        address,
        city,
        postalCode,
        contactName,
        contactEmail,
        contactPassword
      } = req.body;
      
      // Validate required fields
      if (!businessName || !contactEmail || !contactPassword) {
        return res.status(400).json({ 
          message: 'Business name, contact email, and password are required' 
        });
      }
      
      // Check if business user already exists
      const existingUser = await storage.getBusinessUser(contactEmail);
      if (existingUser) {
        return res.status(409).json({ 
          message: 'A business account with this email already exists' 
        });
      }
      
      // Create business first
      const business = await storage.createBusiness({
        name: businessName,
        description: description || '',
        categoryId: category || null, // category should be string ID
        phone: phone || null,
        website: website || null,
        address: address || '',
        city: city || '',
        postalCode: postalCode || null,
        latitude: null, // We'll add geocoding later if needed
        longitude: null,
        rating: 0,
        reviewCount: 0,
      });
      
      // Create business user account
      const businessUser = await storage.createBusinessUser({
        businessId: business.id,
        email: contactEmail,
        password: contactPassword,
        name: contactName,
        role: 'owner'
      });
      
      // Return success without password
      const { password, ...safeUser } = businessUser;
      
      res.json({ 
        success: true, 
        business,
        user: safeUser
      });
      
    } catch (error) {
      console.error('Business registration error:', error);
      res.status(500).json({ message: 'Registration failed' });
    }
  });

  // In-memory storage for business submissions and limits (in real app use database)
  let businessSubmissions = [
    {
      id: '1',
      title: '3-gangen menu voor €25',
      description: 'Volledig 3-gangen menu inclusief voorgerecht, hoofdgerecht en dessert',
      originalPrice: '45.00',
      discountedPrice: '25.00',
      status: 'approved',
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      business: {
        name: 'Restaurant De Smaak',
        city: 'Amsterdam',
        address: 'Prinsengracht 123',
        latitude: '52.3676',
        longitude: '4.9041'
      },
      adminNotes: 'Goedgekeurd - mooie deal'
    },
    {
      id: '2',
      title: '20% korting op alle hoofdgerechten',
      description: 'Geldig van maandag t/m donderdag',
      originalPrice: '22.50',
      discountedPrice: '18.00',
      status: 'pending',
      createdAt: new Date().toISOString(),
      business: {
        name: 'Bistro Central',
        city: 'Utrecht',
        address: 'Oudegracht 45',
        latitude: '52.0907',
        longitude: '5.1214'
      }
    }
  ];

  // Business account limits (tracks free deals used)
  let businessLimits = {
    'demo-business-1': { 
      freeDealsUsed: 0, 
      totalDeals: 0,
      subscriptionStatus: 'free' // 'free', 'paid'
    }
  };

  // Business Dashboard routes (protected)
  app.get('/api/business/submissions', async (req, res) => {
    try {
      res.json(businessSubmissions);
    } catch (error) {
      console.error('Error fetching submissions:', error);
      res.status(500).json({ message: 'Failed to fetch submissions' });
    }
  });

  app.post('/api/business/deals/submit', async (req, res) => {
    try {
      const businessId = 'demo-business-1'; // In real app get from auth
      const businessAccount = businessLimits[businessId] || { freeDealsUsed: 0, totalDeals: 0, subscriptionStatus: 'free' };
      
      // Check if business exceeded free limit (2 deals)
      if (businessAccount.freeDealsUsed >= 2 && businessAccount.subscriptionStatus === 'free') {
        return res.status(402).json({ 
          message: 'Free limit reached', 
          requiresPayment: true,
          freeDealsUsed: businessAccount.freeDealsUsed,
          maxFreeDeals: 2,
          pricePerDeal: 5.00
        });
      }
      
      const submission = {
        id: Math.random().toString(36).substring(2, 8),
        ...req.body,
        status: 'pending',
        businessId: businessId,
        createdAt: new Date().toISOString(),
        business: {
          name: req.body.businessName || 'Demo Restaurant',
          city: req.body.businessCity || 'Amsterdam', 
          address: req.body.businessAddress || 'Prinsengracht 123',
          latitude: req.body.businessLatitude || null,
          longitude: req.body.businessLongitude || null
        }
      };
      
      // Add to submissions list
      businessSubmissions.unshift(submission);
      
      // Update business limits
      businessLimits[businessId] = {
        freeDealsUsed: businessAccount.freeDealsUsed + 1,
        totalDeals: businessAccount.totalDeals + 1,
        subscriptionStatus: businessAccount.subscriptionStatus
      };
      
      res.json({
        success: true,
        submission,
        limits: businessLimits[businessId]
      });
    } catch (error) {
      console.error('Error submitting deal:', error);
      res.status(500).json({ message: 'Failed to submit deal' });
    }
  });

  // Get business limits
  app.get('/api/business/limits', async (req, res) => {
    try {
      const businessId = 'demo-business-1'; // In real app get from auth
      const limits = businessLimits[businessId] || { freeDealsUsed: 0, totalDeals: 0, subscriptionStatus: 'free' };
      
      res.json({
        ...limits,
        maxFreeDeals: 2,
        pricePerDeal: 5.00,
        remainingFreeDeals: Math.max(0, 2 - limits.freeDealsUsed)
      });
    } catch (error) {
      console.error('Error fetching business limits:', error);
      res.status(500).json({ message: 'Failed to fetch limits' });
    }
  });

  // Mock payment for extra deals
  app.post('/api/business/purchase-deal-credits', async (req, res) => {
    try {
      const { creditCount = 1 } = req.body;
      const businessId = 'demo-business-1';
      
      // Mock payment success (in real app use Stripe)
      const totalCost = creditCount * 5.00;
      
      // Update business to paid status (allows unlimited deals)
      businessLimits[businessId] = {
        ...businessLimits[businessId],
        subscriptionStatus: 'paid'
      };
      
      res.json({
        success: true,
        message: `Payment successful! Purchased ${creditCount} deal credits for €${totalCost.toFixed(2)}`,
        transactionId: 'mock_' + Date.now(),
        newStatus: 'paid'
      });
    } catch (error) {
      console.error('Error processing payment:', error);
      res.status(500).json({ message: 'Payment failed' });
    }
  });

  // Community routes
  app.get('/api/community/nominations', async (req, res) => {
    try {
      const nominations = [
        {
          id: '1',
          title: '50% korting op fitness abonnement',
          description: 'Voorstel voor korting op jaarabonnement bij FitZone',
          suggestedDiscount: '50% korting',
          reason: 'Veel leden zouden profiteren van een betaalbaar fitness abonnement',
          upvotes: 24,
          status: 'active',
          business: {
            id: 'b1',
            name: 'FitZone Gym',
            address: 'Hoofdstraat 123',
            city: 'Amsterdam'
          },
          createdAt: new Date().toISOString(),
          hasUserVoted: false
        },
        {
          id: '2', 
          title: 'Gratis dessert bij 3-gangen menu',
          description: 'Voorstel voor gratis dessert bij het bestellen van een volledig menu',
          suggestedDiscount: 'Gratis dessert (€8 waarde)',
          reason: 'Zou meer mensen naar het restaurant lokken voor de complete ervaring',
          upvotes: 18,
          status: 'responded',
          businessResponse: 'Geweldig idee! We gaan dit implementeren vanaf volgende maand. Bedankt voor het voorstel!',
          business: {
            id: 'b2',
            name: 'Restaurant De Smaak', 
            address: 'Kerkstraat 45',
            city: 'Utrecht'
          },
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          hasUserVoted: true
        }
      ];
      res.json(nominations);
    } catch (error) {
      console.error('Error fetching nominations:', error);
      res.status(500).json({ message: 'Failed to fetch nominations' });
    }
  });

  app.post('/api/community/nominations', isAuthenticated, async (req, res) => {
    try {
      const nomination = {
        id: Math.random().toString(36),
        ...req.body,
        userId: req.user?.claims?.sub,
        upvotes: 0,
        status: 'active',
        createdAt: new Date().toISOString()
      };
      res.json(nomination);
    } catch (error) {
      console.error('Error creating nomination:', error);
      res.status(500).json({ message: 'Failed to create nomination' });
    }
  });

  app.post('/api/community/nominations/:id/vote', isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const { voteType } = req.body;
      res.json({ success: true });
    } catch (error) {
      console.error('Error voting:', error);
      res.status(500).json({ message: 'Failed to vote' });
    }
  });

  // Admin endpoints for deal approval
  // Get all business submissions for admin (not just pending)
  app.get('/api/admin/pending-deals', async (req, res) => {
    try {
      // Return all submissions so admin can see approved/rejected too
      res.json(businessSubmissions);
    } catch (error) {
      console.error('Error fetching pending deals:', error);
      res.status(500).json({ message: 'Failed to fetch pending deals' });
    }
  });

  // Get business submissions
  app.get('/api/business/submissions', async (req, res) => {
    try {
      res.json(businessSubmissions);
    } catch (error) {
      console.error('Error fetching business submissions:', error);
      res.status(500).json({ message: 'Failed to fetch submissions' });
    }
  });

  app.patch('/api/admin/deals/:dealId', async (req, res) => {
    try {
      const { dealId } = req.params;
      const { status, adminNotes } = req.body;
      
      const dealIndex = businessSubmissions.findIndex(deal => deal.id === dealId);
      if (dealIndex === -1) {
        return res.status(404).json({ message: 'Deal not found' });
      }
      
      businessSubmissions[dealIndex].status = status;
      if (adminNotes) {
        businessSubmissions[dealIndex].adminNotes = adminNotes;
      }
      
      // When deal is approved, add it to the main deals database
      if (status === 'approved') {
        const approvedSubmission = businessSubmissions[dealIndex];
        
        try {
          // Create business for the deal
          const business = await storage.createBusiness({
            name: approvedSubmission.business.name,
            address: approvedSubmission.business.address || "",
            city: approvedSubmission.business.city,
            phone: "",
            email: "",
            description: `Business voor deal: ${approvedSubmission.title}`,
            website: "",
            rating: "4.5",
            reviewCount: 0,
            isActive: true
          });
          
          // Find a category (default to restaurant)
          const categories = await storage.getCategories();
          const defaultCategory = categories.find(c => c.nameNl === "Restaurant") || categories[0];
          
          // Create the deal in database
          const newDeal = await storage.createDeal({
            businessId: business.id,
            categoryId: defaultCategory.id,
            title: approvedSubmission.title,
            description: approvedSubmission.description,
            originalPrice: approvedSubmission.originalPrice,
            discountedPrice: approvedSubmission.discountedPrice,
            discountPercentage: Math.round(((parseFloat(approvedSubmission.originalPrice) - parseFloat(approvedSubmission.discountedPrice)) / parseFloat(approvedSubmission.originalPrice)) * 100),
            imageUrls: approvedSubmission.imageUrls || [],
            isActive: true,
            isFeatured: true, // Make it featured so it shows on homepage
            availableCount: 100,
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
          });
          
          console.log(`✅ Deal "${newDeal.title}" approved and added to database with ID: ${newDeal.id}`);
        } catch (error) {
          console.error('Error creating deal in database:', error);
        }
      }
      
      res.json({ success: true, deal: businessSubmissions[dealIndex] });
    } catch (error) {
      console.error('Error updating deal status:', error);
      res.status(500).json({ message: 'Failed to update deal status' });
    }
  });

  // Object Storage endpoints
  
  // Get upload URL for object storage
  app.post("/api/objects/upload", async (req, res) => {
    try {
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      res.json({ 
        method: "PUT" as const,
        url: uploadURL 
      });
    } catch (error) {
      console.error("Error getting upload URL:", error);
      res.status(500).json({ error: "Failed to get upload URL" });
    }
  });

  // Convert Google Cloud Storage URL to frontend object URL
  app.post("/api/objects/convert-url", async (req, res) => {
    try {
      const { rawUrl } = req.body;
      if (!rawUrl) {
        return res.status(400).json({ error: "rawUrl is required" });
      }
      
      const objectStorageService = new ObjectStorageService();
      const objectPath = objectStorageService.normalizeObjectEntityPath(rawUrl);
      res.json({ objectPath });
    } catch (error) {
      console.error("Error converting URL:", error);
      res.status(500).json({ error: "Failed to convert URL" });
    }
  });

  // Serve uploaded objects
  app.get("/objects/:objectPath(*)", async (req, res) => {
    const objectStorageService = new ObjectStorageService();
    try {
      const objectFile = await objectStorageService.getObjectEntityFile(
        req.path,
      );
      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error getting object:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });

  // Public object serving
  app.get("/public-objects/:filePath(*)", async (req, res) => {
    const filePath = req.params.filePath;
    const objectStorageService = new ObjectStorageService();
    try {
      const file = await objectStorageService.searchPublicObject(filePath);
      if (!file) {
        return res.status(404).json({ error: "File not found" });
      }
      objectStorageService.downloadObject(file, res);
    } catch (error) {
      console.error("Error searching for public object:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // Notification routes
  app.post('/api/notifications', async (req, res) => {
    try {
      const { userId, title, message, type } = req.body;

      const notification = await storage.createNotification({
        userId,
        title,
        message,
        type,
        read: false
      });

      res.json({ success: true, notification });
    } catch (error) {
      console.error('Error creating notification:', error);
      res.status(500).json({ message: 'Failed to create notification' });
    }
  });

  app.get('/api/notifications/:userId', async (req, res) => {
    try {
      const { userId } = req.params;
      const notifications = await storage.getUserNotifications(userId);
      res.json(notifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      res.status(500).json({ message: 'Failed to fetch notifications' });
    }
  });

  // Business payment processing
  app.post('/api/business/payments/process', async (req, res) => {
    try {
      const { businessId, voucherId, amount, description } = req.body;

      // Create payment record
      const payment = await storage.createBusinessPayment({
        businessId,
        voucherId,
        amount: amount.toString(),
        description,
        status: 'pending'
      });

      // Demo Stripe Transfer Simulation
      // In production, use real Stripe Connect API
      const dummyTransfer = {
        id: `dummy_transfer_${Date.now()}`,
        amount: Math.round(parseFloat(amount) * 100), // Convert to cents
        currency: 'eur',
        destination: `acct_dummy_${businessId.slice(-8)}`,
        status: 'completed'
      };

      console.log(`💳 [DEMO] Stripe Transfer Simulated:`, dummyTransfer);
      
      // Mark payment as completed
      await storage.updateBusinessPaymentStatus(payment.id, 'completed');

      res.json({ 
        success: true, 
        payment: { ...payment, status: 'completed', stripeTransferId: dummyTransfer.id },
        message: `€${amount} uitbetaald via dummy Stripe transfer`,
        demoMode: true,
        transferDetails: dummyTransfer
      });
    } catch (error) {
      console.error('Error processing business payment:', error);
      res.status(500).json({ message: 'Failed to process payment' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
