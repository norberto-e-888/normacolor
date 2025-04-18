/**
 * Migration script to transition users to the tiered loyalty system
 *
 * This script:
 * 1. Adds the new tier fields to all users
 * 2. Sets tier based on their current spending
 * 3. Initializes the qualification period
 *
 * Run with: node scripts/migrate-to-loyalty-tiers.js
 */

/* eslint-disable @typescript-eslint/no-require-imports */
const mongoose = require("mongoose");
const { exit } = require("process");

require("dotenv").config({
  path: ".env.local",
});

// Loyalty tier constants (should match those in database/user.ts)
const UserLoyaltyTier = {
  Bronze: "bronze",
  Silver: "silver",
  Gold: "gold",
};

// Tier configuration with spending requirements and points multipliers
const LOYALTY_TIER_CONFIG = {
  [UserLoyaltyTier.Bronze]: {
    pointsMultiplier: 1,
    spendingRequirement: 0, // Default tier, no requirement
  },
  [UserLoyaltyTier.Silver]: {
    pointsMultiplier: 2,
    spendingRequirement: 1000000, // $10,000 in cents
  },
  [UserLoyaltyTier.Gold]: {
    pointsMultiplier: 4,
    spendingRequirement: 5000000, // $50,000 in cents
  },
};

// Time window for qualifying spend (in months)
const TIER_QUALIFICATION_PERIOD_MONTHS = 6;

// Helper function to determine tier based on spending
function determineUserTier(spendingCents) {
  if (
    spendingCents >=
    LOYALTY_TIER_CONFIG[UserLoyaltyTier.Gold].spendingRequirement
  ) {
    return UserLoyaltyTier.Gold;
  } else if (
    spendingCents >=
    LOYALTY_TIER_CONFIG[UserLoyaltyTier.Silver].spendingRequirement
  ) {
    return UserLoyaltyTier.Silver;
  } else {
    return UserLoyaltyTier.Bronze;
  }
}

async function migrateLoyaltySystem() {
  try {
    console.log("Connecting to MongoDB...");
    const { connection } = await mongoose.connect(process.env.MONGODB_URI);

    if (!connection.db) {
      console.error("Connection DB not found");
      return;
    }
    console.log("Connected to MongoDB");

    const users = connection.db.collection("users");

    // Count all users
    const totalUsers = await users.countDocuments();
    console.log(`Found ${totalUsers} users to migrate`);

    // Calculate the initial qualification end date (6 months from now)
    const qualificationEndDate = new Date();
    qualificationEndDate.setMonth(
      qualificationEndDate.getMonth() + TIER_QUALIFICATION_PERIOD_MONTHS
    );

    // Process users in batches to avoid memory issues
    const batchSize = 100;
    let processedUsers = 0;
    let updatedUsers = 0;

    // Track tier distribution
    const tierCounts = {
      [UserLoyaltyTier.Bronze]: 0,
      [UserLoyaltyTier.Silver]: 0,
      [UserLoyaltyTier.Gold]: 0,
    };

    while (processedUsers < totalUsers) {
      const userBatch = await users
        .find({})
        .sort({ _id: 1 })
        .skip(processedUsers)
        .limit(batchSize)
        .toArray();

      for (const user of userBatch) {
        // Determine user tier based on total spend
        const userTier = determineUserTier(user.totalSpentCents || 0);

        // Update user with new tier information
        await users.updateOne(
          { _id: user._id },
          {
            $set: {
              loyaltyTier: userTier,
              tierQualificationEndDate: qualificationEndDate,
              tierQualificationSpendCents: user.totalSpentCents || 0,
            },
          }
        );

        // Track tier distribution
        tierCounts[userTier]++;
        updatedUsers++;
      }

      processedUsers += userBatch.length;
      console.log(`Processed ${processedUsers}/${totalUsers} users`);
    }

    console.log("\nMigration completed successfully!");
    console.log(`Updated ${updatedUsers} users`);
    console.log("\nTier Distribution:");
    console.log(`- Bronze: ${tierCounts[UserLoyaltyTier.Bronze]}`);
    console.log(`- Silver: ${tierCounts[UserLoyaltyTier.Silver]}`);
    console.log(`- Gold: ${tierCounts[UserLoyaltyTier.Gold]}`);
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
}

// Run the migration
migrateLoyaltySystem()
  .then(() => {
    console.log("Migration script completed");
    exit(0);
  })
  .catch((err) => {
    console.error(`Error running migration script: ${JSON.stringify(err)}`);
    exit(1);
  });
