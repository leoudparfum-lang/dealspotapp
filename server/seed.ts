import { db } from "./db";
import { 
  adminUsers, 
  categories, 
  businesses, 
  deals, 
  reviews,
  users,
  vouchers
} from "@shared/schema";
import { randomUUID } from "crypto";

export async function seedDatabase() {
  try {
    console.log("🌱 Starting database seeding...");

    // Create admin user (mohcine with password 123456)
    await db.insert(adminUsers).values({
      username: "mohcine",
      password: "123456", // In real app, this would be hashed
      name: "Mohcine Admin",
      role: "admin",
    }).onConflictDoNothing();

    // Create categories
    const categoriesData = [
      { name: "Restaurants", nameNl: "Restaurants", icon: "utensils" },
      { name: "Wellness", nameNl: "Wellness", icon: "spa" },
      { name: "Hotels", nameNl: "Hotels", icon: "bed" },
      { name: "Activities", nameNl: "Activiteiten", icon: "camera" },
      { name: "Fitness", nameNl: "Fitness", icon: "dumbbell" },
      { name: "Shopping", nameNl: "Winkelen", icon: "shopping" },
    ];

    const insertedCategories = await db.insert(categories).values(categoriesData).returning();
    console.log(`✅ Created ${insertedCategories.length} categories`);

    // Create businesses
    const businessesData = [
      {
        name: "Restaurant De Gouden Eeuw",
        description: "Authentiek Nederlands restaurant met moderne twist",
        address: "Prinsengracht 123",
        city: "Amsterdam",
        phone: "020-1234567",
        website: "https://degoudeneuw.nl",
        rating: "4.5",
        reviewCount: 127,
      },
      {
        name: "Zen Wellness Spa",
        description: "Ontspanning en welzijn in het hart van de stad",
        address: "Vondelpark 45",
        city: "Amsterdam",
        phone: "020-2345678",
        website: "https://zenwellness.nl",
        rating: "4.8",
        reviewCount: 89,
      },
      {
        name: "Hotel Boutique Amsterdam",
        description: "Luxe boutique hotel met uitzicht op de grachten",
        address: "Herengracht 78",
        city: "Amsterdam",
        phone: "020-3456789",
        website: "https://boutiqueamsterdam.nl",
        rating: "4.6",
        reviewCount: 203,
      },
      {
        name: "Fitness First Central",
        description: "Moderne sportschool met alle faciliteiten",
        address: "Leidseplein 12",
        city: "Amsterdam",
        phone: "020-4567890",
        website: "https://fitnessfirst.nl",
        rating: "4.3",
        reviewCount: 156,
      },
      {
        name: "Café Restaurant Loetje",
        description: "Beroemd om de beste biefstuk van Amsterdam",
        address: "Johannes Vermeerstraat 52",
        city: "Amsterdam",
        phone: "020-5678901",
        website: "https://loetje.nl",
        rating: "4.7",
        reviewCount: 342,
      },
      {
        name: "Thai Massage Center",
        description: "Authentieke Thaise massage en behandelingen",
        address: "Nieuwmarkt 23",
        city: "Amsterdam",
        phone: "020-6789012",
        rating: "4.4",
        reviewCount: 95,
      },
    ];

    const insertedBusinesses = await db.insert(businesses).values(businessesData).returning();
    console.log(`✅ Created ${insertedBusinesses.length} businesses`);

    // Create deals
    const dealsData = [
      {
        businessId: insertedBusinesses[0].id,
        categoryId: insertedCategories[0].id,
        title: "3-gangen diner met wijn",
        description: "Geniet van een heerlijk 3-gangen diner inclusief een glas wijn per persoon. Ervaar de smaak van Nederland met moderne interpretaties van klassieke gerechten.",
        originalPrice: "65.00",
        discountedPrice: "39.00",
        discountPercentage: 40,
        isFeatured: true,
        availableCount: 50,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
      {
        businessId: insertedBusinesses[1].id,
        categoryId: insertedCategories[1].id,
        title: "90 minuten ontspanningspakket",
        description: "Complete wellness ervaring met aromatherapie massage, gezichtsbehandeling en toegang tot sauna. Perfect voor een dagje ontspanning.",
        originalPrice: "120.00",
        discountedPrice: "75.00",
        discountPercentage: 38,
        isFeatured: true,
        availableCount: 25,
        expiresAt: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), // 45 days
      },
      {
        businessId: insertedBusinesses[2].id,
        categoryId: insertedCategories[2].id,
        title: "Romantisch weekend arrangement",
        description: "2 nachten inclusief ontbijt, champagne op de kamer en late check-out. Perfect voor een romantisch uitje in Amsterdam.",
        originalPrice: "350.00",
        discountedPrice: "249.00",
        discountPercentage: 29,
        isFeatured: true,
        availableCount: 15,
        expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days
      },
      {
        businessId: insertedBusinesses[3].id,
        categoryId: insertedCategories[4].id,
        title: "3 maanden sportschool lidmaatschap",
        description: "Volledige toegang tot alle faciliteiten inclusief groepslessen en personal training intake. Start je fitness journey vandaag!",
        originalPrice: "180.00",
        discountedPrice: "99.00",
        discountPercentage: 45,
        isFeatured: false,
        availableCount: 100,
        expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
      },
      {
        businessId: insertedBusinesses[4].id,
        categoryId: insertedCategories[0].id,
        title: "Loetje biefstuk menu voor 2",
        description: "De beroemde Loetje biefstuk voor 2 personen inclusief bijgerechten en saus. Een echte Amsterdamse klassieker!",
        originalPrice: "85.00",
        discountedPrice: "59.00",
        discountPercentage: 31,
        isFeatured: true,
        availableCount: 75,
        expiresAt: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000), // 21 days
      },
      {
        businessId: insertedBusinesses[5].id,
        categoryId: insertedCategories[1].id,
        title: "Thaise massage 60 minuten",
        description: "Traditionele Thaise massage uitgevoerd door ervaren therapeuten. Ontspan en laat alle spanning wegvloeien.",
        originalPrice: "80.00",
        discountedPrice: "55.00",
        discountPercentage: 31,
        isFeatured: false,
        availableCount: 40,
        expiresAt: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000), // 35 days
      },
    ];

    const insertedDeals = await db.insert(deals).values(dealsData).returning();
    console.log(`✅ Created ${insertedDeals.length} deals`);

    // Create demo user for testing (if not exists)
    const demoUser = await db.insert(users).values({
      id: "demo-user-123",
      email: "demo@dealspot.nl",
      firstName: "Demo",
      lastName: "Gebruiker",
      loyaltyPoints: 150,
    }).onConflictDoNothing().returning();

    // Create some sample reviews
    if (demoUser.length > 0) {
      const reviewsData = [
        {
          userId: demoUser[0].id,
          businessId: insertedBusinesses[0].id,
          dealId: insertedDeals[0].id,
          rating: 5,
          comment: "Fantastisch eten en geweldige service! Het 3-gangen menu was perfect en de wijn paste er uitstekend bij.",
        },
        {
          userId: demoUser[0].id,
          businessId: insertedBusinesses[1].id,
          dealId: insertedDeals[1].id,
          rating: 5,
          comment: "Zeer ontspannende ervaring. De massage was professioneel en het personeel was vriendelijk.",
        },
        {
          userId: demoUser[0].id,
          businessId: insertedBusinesses[4].id,
          dealId: insertedDeals[4].id,
          rating: 4,
          comment: "De biefstuk was zoals altijd perfect! Loetje blijft de beste van Amsterdam.",
        },
      ];

      await db.insert(reviews).values(reviewsData);
      console.log(`✅ Created ${reviewsData.length} sample reviews`);

      // Create a sample voucher
      const voucherData = {
        userId: demoUser[0].id,
        dealId: insertedDeals[0].id,
        code: `DS-${Date.now()}-DEMO123`,
        status: "active",
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      };

      await db.insert(vouchers).values(voucherData);
      console.log("✅ Created sample voucher for demo user");
    }

    console.log("🎉 Database seeding completed successfully!");
    console.log("🔑 Admin login: username 'mohcine', password '123456'");
    
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    throw error;
  }
}

// Run seeding if this file is executed directly
if (import.meta.main) {
  await seedDatabase();
  process.exit(0);
}