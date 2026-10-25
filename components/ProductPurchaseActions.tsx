"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShoppingCart, Zap } from "lucide-react";
import { useCart } from "@/components/CartProvider";

interface ProductPurchaseActionsProps {
  product: {
    id: string;
    name: string;
    imageUrl: string;
    price: number;
    stock: number;
  };
  compact?: boolean;
}

export default function ProductPurchaseActions({
  product,
  compact = false,
}: ProductPurchaseActionsProps) {
  const router = useRouter();
  const { addItem } = useCart();
  const [message, setMessage] = useState("");

  const cartItem = {
    productId: product.id,
    name: product.name,
    imageUrl: product.imageUrl,
    price: product.price,
    stock: product.stock,
  };

  function addToCart() {
    if (!addItem(cartItem)) {
      setMessage("Đã đạt số lượng tồn kho.");
      return;
    }
    setMessage("Đã thêm sản phẩm vào giỏ.");
  }

  function buyNow() {
    if (product.stock < 1) {
      return;
    }
    addItem(cartItem);
    router.push("/stack");
  }

  return (
    <div className="space-y-2">
      <div className={`grid gap-2 ${compact ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-2 sm:max-w-md"}`}>
        <button
          type="button"
          onClick={addToCart}
          disabled={product.stock < 1}
          aria-label="Thêm vào giỏ hàng"
          title="Thêm vào giỏ hàng"
          className={`inline-flex min-h-10 items-center justify-center rounded-lg border border-[#d4a537]/40 py-2 font-medium text-[#efd486] transition hover:bg-[#d4a537]/10 disabled:cursor-not-allowed disabled:border-white/[0.08] disabled:text-zinc-600 ${compact ? "gap-1 px-2 text-xs sm:gap-1 sm:px-1 sm:text-[10px]" : "gap-2 px-3 text-sm"}`}
        >
          <ShoppingCart className={compact ? "h-3.5 w-3.5 shrink-0 sm:h-3 sm:w-3" : "h-4 w-4 shrink-0"} />
          <span className={`whitespace-nowrap ${compact ? "sm:hidden" : ""}`}>Thêm vào giỏ hàng</span>
          {compact && <span className="hidden whitespace-nowrap sm:inline">Giỏ hàng</span>}
        </button>
        <button
          type="button"
          onClick={buyNow}
          disabled={product.stock < 1}
          aria-label="Mua ngay"
          title="Mua ngay"
          className={`inline-flex min-h-10 items-center justify-center rounded-lg bg-gradient-to-b from-[#f0d783] to-[#c79732] py-2 font-semibold text-[#211805] transition hover:brightness-110 disabled:cursor-not-allowed disabled:from-zinc-700 disabled:to-zinc-800 disabled:text-zinc-500 ${compact ? "gap-1 px-2 text-xs sm:gap-1 sm:px-1 sm:text-[10px]" : "gap-2 px-3 text-sm"}`}
        >
          <Zap className={compact ? "h-3.5 w-3.5 shrink-0 sm:h-3 sm:w-3" : "h-4 w-4 shrink-0"} />
          <span className="whitespace-nowrap">Mua ngay</span>
        </button>
      </div>
      <p aria-live="polite" className="min-h-4 text-xs text-emerald-300">
        {message}
      </p>
    </div>
  );
}
