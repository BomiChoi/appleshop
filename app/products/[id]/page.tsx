"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { getOrCreateSessionId } from "@/lib/session";

export default function ProductPage() {
  const params = useParams();
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const product = useQuery(api.products.get, {
    id: params.id as Id<"products">,
  });
  const addItem = useMutation(api.cart.addItem);

  if (!product) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-gray-400 text-lg">로딩 중...</div>
      </div>
    );
  }

  const handleAddToCart = async () => {
    const sessionId = getOrCreateSessionId();
    await addItem({ sessionId, productId: product._id, quantity });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <main className="max-w-5xl mx-auto px-4 py-12">
      <button
        onClick={() => router.back()}
        className="text-blue-500 hover:text-blue-700 text-sm mb-8 flex items-center gap-1"
      >
        ← 목록으로
      </button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        <div className="relative aspect-square bg-gray-50 rounded-2xl overflow-hidden">
          <Image
            src={product.image}
            alt={product.name}
            fill
            className="object-cover"
          />
        </div>

        <div className="flex flex-col justify-center">
          <span className="text-sm font-medium text-blue-500 uppercase tracking-wider">
            {product.category}
          </span>
          <h1 className="mt-2 text-3xl font-bold text-gray-900">
            {product.name}
          </h1>
          <p className="mt-4 text-gray-600 leading-relaxed">
            {product.description}
          </p>

          <div className="mt-6 text-2xl font-bold text-gray-900">
            ₩{product.price.toLocaleString()}
          </div>

          <div className="mt-2 text-sm text-gray-400">
            재고: {product.stock}개
          </div>

          <div className="mt-6 flex items-center gap-4">
            <div className="flex items-center border border-gray-200 rounded-full overflow-hidden">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-10 h-10 flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors"
              >
                −
              </button>
              <span className="w-10 text-center font-medium">{quantity}</span>
              <button
                onClick={() =>
                  setQuantity(Math.min(product.stock, quantity + 1))
                }
                className="w-10 h-10 flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors"
              >
                +
              </button>
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <button
              onClick={handleAddToCart}
              className={`flex-1 py-3 rounded-full font-semibold transition-all ${
                added
                  ? "bg-green-500 text-white"
                  : "bg-gray-900 text-white hover:bg-gray-700"
              }`}
            >
              {added ? "장바구니에 추가됨 ✓" : "장바구니에 추가"}
            </button>
            <button
              onClick={async () => {
                await handleAddToCart();
                router.push("/cart");
              }}
              className="flex-1 py-3 rounded-full font-semibold border border-gray-900 text-gray-900 hover:bg-gray-100 transition-colors"
            >
              바로 구매
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
