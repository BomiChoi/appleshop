"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { loadTossPayments, ANONYMOUS } from "@tosspayments/tosspayments-sdk";
import type { TossPaymentsWidgets } from "@tosspayments/tosspayments-sdk";
import { useRouter } from "next/navigation";
import { getOrCreateSessionId } from "@/lib/session";

export default function CheckoutPage() {
  const [sessionId, setSessionId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [shippingName, setShippingName] = useState("");
  const [shippingPhone, setShippingPhone] = useState("");
  const [shippingZipCode, setShippingZipCode] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");
  const [shippingAddressDetail, setShippingAddressDetail] = useState("");
  const [widgetReady, setWidgetReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const widgetsRef = useRef<TossPaymentsWidgets | null>(null);
  const widgetInitialized = useRef(false);
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

  // 위젯 초기화: 장바구니 금액이 확정된 후 한 번만 실행
  useEffect(() => {
    if (!totalAmount || !cartItems?.length) return;
    if (widgetInitialized.current) return;
    widgetInitialized.current = true;

    (async () => {
      const tossPayments = await loadTossPayments(
        process.env.NEXT_PUBLIC_TOSS_WIDGET_KEY!
      );
      const widgets = tossPayments.widgets({ customerKey: ANONYMOUS });

      await widgets.setAmount({ currency: "KRW", value: totalAmount });
      await Promise.all([
        widgets.renderPaymentMethods({
          selector: "#toss-payment-method",
          variantKey: "DEFAULT",
        }),
        widgets.renderAgreement({
          selector: "#toss-agreement",
          variantKey: "AGREEMENT",
        }),
      ]);

      widgetsRef.current = widgets;
      setWidgetReady(true);
    })();
  }, [totalAmount, cartItems?.length]);

  const handlePayment = async () => {
    if (!customerName.trim() || !customerEmail.trim()) {
      alert("주문자 이름과 이메일을 입력해주세요.");
      return;
    }
    if (
      !shippingName.trim() ||
      !shippingPhone.trim() ||
      !shippingZipCode.trim() ||
      !shippingAddress.trim()
    ) {
      alert("배송 정보를 모두 입력해주세요.");
      return;
    }
    if (!cartItems || cartItems.length === 0) {
      alert("장바구니가 비어있습니다.");
      return;
    }
    if (!widgetsRef.current) {
      alert("결제 위젯이 아직 준비되지 않았습니다. 잠시 후 다시 시도해주세요.");
      return;
    }

    setLoading(true);
    try {
      const orderId =
        "ORDER-" +
        Date.now().toString(36).toUpperCase() +
        Math.random().toString(36).substring(2, 6).toUpperCase();

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
        shippingName,
        shippingPhone,
        shippingZipCode,
        shippingAddress,
        shippingAddressDetail,
      });

      const orderName =
        cartItems.length === 1
          ? cartItems[0].product?.name ?? "상품"
          : `${cartItems[0].product?.name} 외 ${cartItems.length - 1}건`;

      await widgetsRef.current.requestPayment({
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
                ₩{((item.product?.price ?? 0) * item.quantity).toLocaleString()}
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

      {/* 배송 정보 */}
      <section className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm mb-6">
        <h2 className="font-semibold text-gray-700 mb-4">배송 정보</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">수령인</label>
            <input
              type="text"
              value={shippingName}
              onChange={(e) => setShippingName(e.target.value)}
              placeholder="홍길동"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-400 transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">연락처</label>
            <input
              type="tel"
              value={shippingPhone}
              onChange={(e) => setShippingPhone(e.target.value)}
              placeholder="010-0000-0000"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-400 transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">우편번호</label>
            <input
              type="text"
              value={shippingZipCode}
              onChange={(e) => setShippingZipCode(e.target.value)}
              placeholder="12345"
              maxLength={5}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-400 transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">주소</label>
            <input
              type="text"
              value={shippingAddress}
              onChange={(e) => setShippingAddress(e.target.value)}
              placeholder="서울특별시 강남구 테헤란로 123"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-400 transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">상세 주소</label>
            <input
              type="text"
              value={shippingAddressDetail}
              onChange={(e) => setShippingAddressDetail(e.target.value)}
              placeholder="101동 202호"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-400 transition-colors"
            />
          </div>
        </div>
      </section>

      {/* TossPayments 위젯 */}
      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm mb-6 overflow-hidden">
        <div id="toss-payment-method" />
        <div id="toss-agreement" />
        {!widgetReady && (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mr-3" />
            <span className="text-sm text-gray-400">결제 수단 불러오는 중...</span>
          </div>
        )}
      </section>

      <button
        onClick={handlePayment}
        disabled={loading || !widgetReady}
        className="w-full bg-blue-600 text-white py-4 rounded-full font-semibold hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "결제 처리 중..." : `₩${totalAmount.toLocaleString()} 결제하기`}
      </button>
    </main>
  );
}
