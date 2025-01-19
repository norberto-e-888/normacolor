/* eslint-disable @typescript-eslint/no-require-imports */
const mongoose = require("mongoose");
const { exit } = require("process");

require("dotenv").config({
  path: ".env.local",
});

const updateClientAggregations = async () => {
  const { connection } = await mongoose.connect(process.env.MONGODB_URI);

  if (!connection.db) {
    console.error("Connection DB not found");
    return;
  }

  const users = connection.db.collection("users");
  const orders = connection.db.collection("orders");

  // Get all client users
  const clientUsers = await users.find({ role: "client" }).toArray();
  console.log(`Found ${clientUsers.length} client users to update`);

  let updatedCount = 0;

  for (const user of clientUsers) {
    // Get all orders for this user
    const userOrders = await orders
      .find({ customerId: user._id })
      .sort({ createdAt: -1 })
      .toArray();

    if (userOrders.length === 0) {
      // Set default values for users with no orders
      await users.updateOne(
        { _id: user._id },
        {
          $set: {
            aggregations: {
              averageOrderValue: 0,
              totalOrderItems: 0,
              totalOrders: 0,
              orderStatusCounts: {},
              productOrderCounts: {},
            },
          },
        }
      );
      updatedCount++;
      continue;
    }

    // Calculate aggregations
    const totalOrders = userOrders.length;
    const totalSpent = userOrders.reduce((sum, order) => sum + order.total, 0);
    const averageOrderValue = Math.round(totalSpent / totalOrders);
    const lastOrderDate = userOrders[0].createdAt;

    // Count orders by status
    const orderStatusCounts = userOrders.reduce((counts, order) => {
      counts[order.status] = (counts[order.status] || 0) + 1;
      return counts;
    }, {});

    // Count total items and product frequencies
    let totalOrderItems = 0;
    const productCounts = {};

    userOrders.forEach((order) => {
      order.cart.forEach((item) => {
        totalOrderItems += item.quantity;
        productCounts[item.productId] =
          (productCounts[item.productId] || 0) + 1;
      });
    });

    // Find most ordered product
    const mostOrderedProduct = Object.entries(productCounts).reduce(
      (max, [id, count]) => {
        return count > (max.count || 0) ? { id, count } : max;
      },
      {}
    );

    // Update user aggregations
    await users.updateOne(
      { _id: user._id },
      {
        $set: {
          aggregations: {
            lastOrderDate,
            averageOrderValue,
            mostOrderedProduct: mostOrderedProduct.id,
            orderStatusCounts,
            totalOrderItems,
            productOrderCounts: productCounts,
            totalOrders,
          },
        },
      }
    );

    updatedCount++;
    if (updatedCount % 100 === 0) {
      console.log(`Updated ${updatedCount} users...`);
    }
  }

  console.log(`Successfully updated ${updatedCount} users`);
};

updateClientAggregations()
  .then(() => {
    console.log("Successfully updated client aggregations");
    exit(0);
  })
  .catch((err) => {
    console.error(
      `Error running client aggregations script: ${JSON.stringify(err)}`
    );
    exit(1);
  });
