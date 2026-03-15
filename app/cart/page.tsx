"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getOrCreateSessionId } from "@/lib/session";

export default function CartPage() {
  const [sessionId, setSessionId] = useState("");
  const router = useRouter();

  useEffect(() => {
    setSessionId(getOrCreateSessionId());
  }, []);

  const cartItems = useQuery(
    api.cart.getCart,
    sessionId ? { sessionId } : "skip"
  );
  const updateQuantity = useMutation(api.cart.updateQuantity);
  const removeItem = useMutation(api.cart.removeItem);

  const totalAmount =
    cartItems?.reduce(
      (sum, item) => sum + (item.product?.price ?? 0) * item.quantity,
      0
    ) ?? 0;

  if (!sessionId || cartItems === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-gray-400 text-lg">로딩 중...</div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <main className="max-w-2xl mx-auto px-4 py-24 text-center">
        <div className="text-6xl mb-6">🛒</div>
        <h1 className="text-2xl font-semibold text-gray-800 mb-3">
          장바구니가 비어 있습니다
        </h1>
        <p className="text-gray-500 mb-8">
          마음에 드는 제품을 장바구니에 담아보세요.
        </p>
        <Link
          href="/"
          className="inline-block bg-gray-900 text-white px-8 py-3 rounded-full font-semibold hover:bg-gray-700 transition-colors"
        >
          쇼핑 계속하기
        </Link>
      </main>
    );
  }

  return (
    <main className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">장바구니</h1>

      <div className="space-y-4 mb-8">
        {cartItems.map((item) => (
          <div
            key={item._id}
            className="flex items-center gap-4 bg-white rounded-2xl border border-gray-100 p-4 shadow-sm"
          >
            <div className="relative w-20 h-20 flex-shrink-0 bg-gray-50 rounded-xl overflow-hidden">
              {item.product && (
                <Image
                  src={item.product.image}
                  alt={item.product.name}
                  fill
                  className="object-cover"
                />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <Link
                href={`/products/${item.productId}`}
                className="font-semibold text-gray-900 hover:text-blue-600 transition-colors truncate block"
              >
                {item.product?.name}
              </Link>
              <div className="text-gray-500 text-sm mt-0.5">
                {item.product?.category}
              </div>
              <div className="font-bold text-gray-900 mt-1">
                ₩{((item.product?.price ?? 0) * item.quantity).toLocaleString()}
              </div>
            </div>

            <div className="flex items-center border border-gray-200 rounded-full overflow-hidden">
              <button
                onClick={() =>
                  updateQuantity({
                    cartItemId: item._id as Id<"carts">,
                    quantity: item.quantity - 1,
                  })
                }
                className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors text-sm"
              >
                −
              </button>
              <span className="w-8 text-center font-medium text-sm">
                {item.quantity}
              </span>
              <button
                onClick={() =>
                  updateQuantity({
                    cartItemId: item._id as Id<"carts">,
                    quantity: item.quantity + 1,
                  })
                }
                className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors text-sm"
              >
                +
              </button>
            </div>

            <button
              onClick={() =>
                removeItem({ cartItemId: item._id as Id<"carts"> })
              }
              className="text-gray-400 hover:text-red-500 transition-colors p-2"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <span className="text-gray-600">
            총 {cartItems.reduce((s, i) => s + i.quantity, 0)}개 상품
          </span>
          <span className="text-xl font-bold text-gray-900">
            ₩{totalAmount.toLocaleString()}
          </span>
        </div>
        <button
          onClick={() => router.push("/checkout")}
          className="w-full bg-gray-900 text-white py-4 rounded-full font-semibold hover:bg-gray-700 transition-colors"
        >
          주문하기
        </button>
      </div>
    </main>
  );
}
