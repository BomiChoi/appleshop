"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { loadTossPayments, ANONYMOUS } from "@tosspayments/tosspayments-sdk";
import { useRouter } from "next/navigation";
import { getOrCreateSessionId } from "@/lib/session";

export default function CheckoutPage() {
  const [sessionId, setSessionId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setSessionId(getOrCreateSessionId());
  }, []);

  const cartItems = useQuery(
    api.cart.getCart,
    sessionId ? { sessionId } : "skip"
  );
  const createOrder = useMutation(api.orders.create);

  const totalAmount =
    cartItems?.reduce(
      (sum, item) => sum + (item.product?.price ?? 0) * item.quantity,
      0
    ) ?? 0;

  const handlePayment = async () => {
    if (!customerName.trim() || !customerEmail.trim()) {
      alert("이름과 이메일을 입력해주세요.");
      return;
    }
    if (!cartItems || cartItems.length === 0) {
      alert("장바구니가 비어있습니다.");
      return;
    }

    setLoading(true);
    try {
      // 고유 주문 ID 생성 (TossPayments 요구사항: 영문+숫자, 6~64자)
      const orderId =
        "ORDER-" +
        Date.now().toString(36).toUpperCase() +
        Math.random().toString(36).substring(2, 6).toUpperCase();

      // Convex에 주문 생성
      await createOrder({
        sessionId,
        items: cartItems.map((item) => ({
          productId: item.productId,
          name: item.product?.name ?? "",
          price: item.product?.price ?? 0,
          quantity: item.quantity,
        })),
        totalAmount,
        orderId,
        customerName,
        customerEmail,
      });

      // TossPayments 결제 요청
      const tossPayments = await loadTossPayments(
        process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY!
      );
      const payment = tossPayments.payment({ customerKey: ANONYMOUS });

      const orderName =
        cartItems.length === 1
          ? cartItems[0].product?.name ?? "상품"
          : `${cartItems[0].product?.name} 외 ${cartItems.length - 1}건`;

      await payment.requestPayment({
        method: "CARD",
        amount: { currency: "KRW", value: totalAmount },
        orderId,
        orderName,
        customerName,
        customerEmail,
        successUrl: `${window.location.origin}/success`,
        failUrl: `${window.location.origin}/fail`,
      });
    } catch (error) {
      console.error("결제 오류:", error);
      setLoading(false);
    }
  };

  if (!sessionId || cartItems === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-gray-400 text-lg">로딩 중...</div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    router.replace("/cart");
    return null;
  }

  return (
    <main className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">주문 / 결제</h1>

      {/* 주문 요약 */}
      <section className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm mb-6">
        <h2 className="font-semibold text-gray-700 mb-4">주문 상품</h2>
        <div className="space-y-3">
          {cartItems.map((item) => (
            <div key={item._id} className="flex justify-between text-sm">
              <span className="text-gray-700">
                {item.product?.name}{" "}
                <span className="text-gray-400">× {item.quantity}</span>
              </span>
              <span className="font-medium text-gray-900">
                ₩
                {((item.product?.price ?? 0) * item.quantity).toLocaleString()}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between">
          <span className="font-semibold text-gray-900">합계</span>
          <span className="font-bold text-lg text-gray-900">
            ₩{totalAmount.toLocaleString()}
          </span>
        </div>
      </section>

      {/* 주문자 정보 */}
      <section className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm mb-6">
        <h2 className="font-semibold text-gray-700 mb-4">주문자 정보</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">이름</label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="홍길동"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-400 transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">이메일</label>
            <input
              type="email"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              placeholder="example@email.com"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-400 transition-colors"
            />
          </div>
        </div>
      </section>

      <button
        onClick={handlePayment}
        disabled={loading}
        className="w-full bg-blue-600 text-white py-4 rounded-full font-semibold hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "결제창 열는 중..." : `₩${totalAmount.toLocaleString()} 결제하기`}
      </button>
    </main>
  );
}
