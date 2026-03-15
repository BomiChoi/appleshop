"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import Image from "next/image";

export default function Home() {
  const products = useQuery(api.products.list);

  if (!products) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-gray-400 text-lg">로딩 중...</div>
      </div>
    );
  }

  return (
    <main className="max-w-6xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-semibold text-gray-900 mb-2">Apple 제품</h1>
      <p className="text-gray-500 mb-10">혁신적인 Apple 제품을 만나보세요.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <Link
            key={product._id}
            href={`/products/${product._id}`}
            className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden"
          >
            <div className="relative aspect-square bg-gray-50">
              <Image
                src={product.image}
                alt={product.name}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>
            <div className="p-5">
              <span className="text-xs font-medium text-blue-500 uppercase tracking-wider">
                {product.category}
              </span>
              <h2 className="mt-1 text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                {product.name}
              </h2>
              <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                {product.description}
              </p>
              <p className="mt-3 text-lg font-bold text-gray-900">
                ₩{product.price.toLocaleString()}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
