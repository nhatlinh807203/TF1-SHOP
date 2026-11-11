"use client";

import { useState } from "react";
import { ShoppingCart } from "lucide-react";
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
  accent?: "holovault";
}

export default function ProductPurchaseActions({
  product,
  compact = false,
  accent,
}: ProductPurchaseActionsProps) {
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

  return (
    <div className="space-y-2">
      <div className={`grid grid-cols-1 gap-2 ${compact ? "" : "sm:max-w-md"}`}>
        <button
          type="button"
          onClick={addToCart}
          disabled={product.stock < 1}
          aria-label="Thêm vào giỏ hàng"
          title="Thêm vào giỏ hàng"
          className={`inline-flex min-h-10 items-center justify-center rounded-lg border py-2 font-medium transition disabled:cursor-not-allowed disabled:border-white/[0.08] disabled:text-zinc-600 ${accent === "holovault" ? "border-cyan-100/25 text-cyan-100 hover:bg-cyan-100/[0.08]" : "border-[#d4a537]/40 text-[#efd486] hover:bg-[#d4a537]/10"} ${compact ? "gap-1 px-2 text-xs sm:gap-1 sm:px-1 sm:text-[10px]" : "gap-2 px-3 text-sm"}`}
        >
          <ShoppingCart className={compact ? "h-3.5 w-3.5 shrink-0 sm:h-3 sm:w-3" : "h-4 w-4 shrink-0"} />
          <span className={`whitespace-nowrap ${compact ? "sm:hidden" : ""}`}>Thêm vào giỏ hàng</span>
          {compact && <span className="hidden whitespace-nowrap sm:inline">Giỏ hàng</span>}
        </button>
      </div>
      <p aria-live="polite" className={`min-h-4 text-xs ${accent === "holovault" ? "text-cyan-200" : "text-emerald-300"}`}>
        {message}
      </p>
    </div>
  );
}
