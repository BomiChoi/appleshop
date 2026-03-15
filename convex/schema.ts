import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  products: defineTable({
    name: v.string(),
    description: v.string(),
    price: v.number(),
    image: v.string(),
    category: v.string(),
    stock: v.number(),
  }),

  carts: defineTable({
    sessionId: v.string(),
    productId: v.id("products"),
    quantity: v.number(),
  }).index("by_session", ["sessionId"]),

  orders: defineTable({
    sessionId: v.string(),
    items: v.array(
      v.object({
        productId: v.id("products"),
        name: v.string(),
        price: v.number(),
        quantity: v.number(),
      })
    ),
    totalAmount: v.number(),
    status: v.string(), // "pending" | "completed" | "failed"
    paymentKey: v.optional(v.string()),
    orderId: v.string(),
    customerName: v.string(),
    customerEmail: v.string(),
  }).index("by_order_id", ["orderId"]),
});
