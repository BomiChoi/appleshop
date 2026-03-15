"use client";

import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useEffect, useRef, Suspense } from "react";

function FailContent() {
  const searchParams = useSearchParams();
  const failedRef = useRef(false);
  const failOrder = useMutation(api.orders.fail);

  const orderId = searchParams.get("orderId") ?? "";
  const message = searchParams.get("message") ?? "결제가 취소되었습니다.";
  const code = searchParams.get("code") ?? "";

  useEffect(() => {
    if (failedRef.current || !orderId) return;
    failedRef.current = true;
    failOrder({ orderId });
  }, [orderId, failOrder]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center max-w-sm">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg
            className="w-10 h-10 text-red-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          결제에 실패했습니다
        </h1>
        <p className="text-gray-500 mb-2">{message}</p>
        {code && (
          <p className="text-xs text-gray-400 mb-8 font-mono">오류 코드: {code}</p>
        )}
        <div className="flex gap-3 justify-center">
          <Link
            href="/cart"
            className="inline-block bg-gray-900 text-white px-6 py-3 rounded-full font-semibold hover:bg-gray-700 transition-colors"
          >
            장바구니로 돌아가기
          </Link>
          <Link
            href="/"
            className="inline-block border border-gray-300 text-gray-700 px-6 py-3 rounded-full font-semibold hover:bg-gray-100 transition-colors"
          >
            홈으로
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function FailPage() {
  return (
    <Suspense>
      <FailContent />
    </Suspense>
  );
}
