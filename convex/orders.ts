import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const create = mutation({
  args: {
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
    orderId: v.string(),
    customerName: v.string(),
    customerEmail: v.string(),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("orders", {
      sessionId: args.sessionId,
      items: args.items,
      totalAmount: args.totalAmount,
      status: "pending",
      orderId: args.orderId,
      customerName: args.customerName,
      customerEmail: args.customerEmail,
    });
    return id;
  },
});

export const confirm = mutation({
  args: {
    orderId: v.string(),
    paymentKey: v.string(),
  },
  handler: async (ctx, args) => {
    const order = await ctx.db
      .query("orders")
      .withIndex("by_order_id", (q) => q.eq("orderId", args.orderId))
      .first();

    if (!order) throw new Error("주문을 찾을 수 없습니다.");

    await ctx.db.patch(order._id, {
      status: "completed",
      paymentKey: args.paymentKey,
    });
  },
});

export const fail = mutation({
  args: { orderId: v.string() },
  handler: async (ctx, args) => {
    const order = await ctx.db
      .query("orders")
      .withIndex("by_order_id", (q) => q.eq("orderId", args.orderId))
      .first();

    if (!order) return;

    await ctx.db.patch(order._id, { status: "failed" });
  },
});

export const getByOrderId = query({
  args: { orderId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("orders")
      .withIndex("by_order_id", (q) => q.eq("orderId", args.orderId))
      .first();
  },
});
