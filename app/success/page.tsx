"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getOrCreateSessionId } from "@/lib/session";
import { Suspense } from "react";

function SuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );
  const [errorMsg, setErrorMsg] = useState("");
  const confirmedRef = useRef(false);

  const confirmOrder = useMutation(api.orders.confirm);
  const clearCart = useMutation(api.cart.clearCart);

  useEffect(() => {
    if (confirmedRef.current) return;
    confirmedRef.current = true;

    const paymentKey = searchParams.get("paymentKey");
    const orderId = searchParams.get("orderId");
    const amount = searchParams.get("amount");

    if (!paymentKey || !orderId || !amount) {
      setStatus("error");
      setErrorMsg("결제 정보가 올바르지 않습니다.");
      return;
    }

    (async () => {
      try {
        // TossPayments 결제 승인 API 호출
        const res = await fetch("/api/confirm-payment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paymentKey, orderId, amount: Number(amount) }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.message ?? "결제 승인에 실패했습니다.");
        }

        // Convex 주문 상태 업데이트
        await confirmOrder({ orderId, paymentKey });

        // 장바구니 비우기
        const sessionId = getOrCreateSessionId();
        await clearCart({ sessionId });

        setStatus("success");
      } catch (err: unknown) {
        setStatus("error");
        setErrorMsg(
          err instanceof Error ? err.message : "결제 처리 중 오류가 발생했습니다."
        );
      }
    })();
  }, [searchParams, confirmOrder, clearCart]);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">결제를 처리하고 있습니다...</p>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center max-w-sm">
          <div className="text-5xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            결제 처리 실패
          </h1>
          <p className="text-gray-500 mb-8">{errorMsg}</p>
          <Link
            href="/cart"
            className="inline-block bg-gray-900 text-white px-8 py-3 rounded-full font-semibold hover:bg-gray-700 transition-colors"
          >
            장바구니로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center max-w-sm">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg
            className="w-10 h-10 text-green-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          결제가 완료되었습니다!
        </h1>
        <p className="text-gray-500 mb-2">
          주문번호: <span className="font-mono text-sm">{searchParams.get("orderId")}</span>
        </p>
        <p className="text-gray-500 mb-8">
          결제금액:{" "}
          <span className="font-bold text-gray-900">
            ₩{Number(searchParams.get("amount")).toLocaleString()}
          </span>
        </p>
        <Link
          href="/"
          className="inline-block bg-gray-900 text-white px-8 py-3 rounded-full font-semibold hover:bg-gray-700 transition-colors"
        >
          쇼핑 계속하기
        </Link>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense>
      <SuccessContent />
    </Suspense>
  );
}
