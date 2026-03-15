"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useEffect, useState } from "react";
import { getOrCreateSessionId } from "@/lib/session";

export default function Header() {
  const [sessionId, setSessionId] = useState("");

  useEffect(() => {
    setSessionId(getOrCreateSessionId());
  }, []);

  const cartCount = useQuery(
    api.cart.getCartCount,
    sessionId ? { sessionId } : "skip"
  );

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link
          href="/"
          className="text-lg font-bold text-gray-900 hover:text-blue-600 transition-colors"
        >
          🍎 Apple Shop
        </Link>

        <nav className="flex items-center gap-6">
          <Link
            href="/"
            className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            제품
          </Link>
          <Link href="/cart" className="relative">
            <span className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
              장바구니
            </span>
            {cartCount != null && cartCount > 0 && (
              <span className="absolute -top-2 -right-4 bg-blue-600 text-white text-xs w-4 h-4 flex items-center justify-center rounded-full font-bold">
                {cartCount > 9 ? "9+" : cartCount}
              </span>
            )}
          </Link>
        </nav>
      </div>
    </header>
  );
}
