import Link from "next/link";
import Image from "next/image";
import { Cinzel, Manrope } from "next/font/google";
import type { SVGProps } from "react";
import { Mail, ShieldCheck, Truck, PackageCheck, Headphones } from "lucide-react";

// lucide-react bản mới đã bỏ icon thương hiệu, nên tự vẽ bằng SVG (cùng kiểu nét mảnh)
const svgBase: SVGProps<SVGSVGElement> = {
  xmlns: "http://www.w3.org/2000/svg",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
};

function Facebook(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...svgBase} {...props}>
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

function Instagram(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...svgBase} {...props}>
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

function Youtube(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...svgBase} {...props}>
      <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" />
      <path d="m10 15 5-3-5-3z" />
    </svg>
  );
}

const cinzel = Cinzel({ subsets: ["latin", "latin-ext"], weight: ["700"], display: "swap" });
const manrope = Manrope({ subsets: ["latin", "vietnamese"], display: "swap" });

// Nội dung đặt tạm, sửa theo shop của bạn
const trust = [
  { icon: ShieldCheck, title: "Hàng chính hãng", text: "Kiểm tra kỹ từng lá bài" },
  { icon: PackageCheck, title: "Đóng gói bảo vệ", text: "Sleeve và hộp cứng chống cong" },
  { icon: Truck, title: "Giao hàng toàn quốc", text: "Miễn phí từ 500.000đ" },
  { icon: Headphones, title: "Hỗ trợ nhanh", text: "Phản hồi trong ngày" },
];

const columns = [
  {
    title: "Cửa hàng",
    links: [
      { name: "Singles", href: "/singles" },
      { name: "Collector", href: "/collector" },
      { name: "Decks", href: "/decks" },
      { name: "Stack của bạn", href: "/stack" },
    ],
  },
  {
    title: "Hỗ trợ",
    links: [
      { name: "Hướng dẫn mua hàng", href: "/help/buying" },
      { name: "Vận chuyển", href: "/help/shipping" },
      { name: "Đổi trả và hoàn tiền", href: "/help/returns" },
      { name: "Câu hỏi thường gặp", href: "/faq" },
    ],
  },
  {
    title: "TF1SHOP",
    links: [
      { name: "Về chúng tôi", href: "/about" },
      { name: "Liên hệ", href: "/contact" },
      { name: "Tài khoản", href: "/account" },
    ],
  },
];

const socials = [
  { name: "Facebook", href: "https://facebook.com", icon: Facebook },
  { name: "Instagram", href: "https://instagram.com", icon: Instagram },
  { name: "YouTube", href: "https://youtube.com", icon: Youtube },
];

export default function Footer() {
  return (
    <footer className={`${manrope.className} relative bg-[#050607] text-zinc-400`}>
      {/* Đường vàng mảnh, cùng ngôn ngữ với header */}
      <div className="h-px w-full bg-gradient-to-r from-transparent via-[#d4a537]/50 to-transparent" />

      {/* Cam kết */}
      <div className="border-b border-white/[0.06]">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 py-8 sm:grid-cols-2 lg:grid-cols-4 lg:px-6">
          {trust.map(({ icon: Icon, title, text }) => (
            <div key={title} className="flex items-center gap-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#d4a537]/30 bg-[#d4a537]/[0.07] text-[#e2bb52]">
                <Icon className="h-5 w-5" strokeWidth={1.6} />
              </span>
              <div>
                <p className="text-sm font-semibold text-zinc-100">{title}</p>
                <p className="text-sm text-zinc-500">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Thân footer */}
      <div className="mx-auto grid max-w-7xl gap-12 px-4 py-14 lg:grid-cols-[1.4fr_2fr] lg:gap-16 lg:px-6">
        {/* Thương hiệu + đăng ký */}
        <div className="max-w-md">
          <Link href="/" className="group inline-flex items-center gap-3.5" aria-label="TF1SHOP - Trang chủ">
            <div className="relative h-11 w-11 overflow-hidden rounded-xl ring-1 ring-[#d4a537]/50 ring-offset-2 ring-offset-[#050607] transition-all duration-300 group-hover:ring-[#62c7d9]/70 group-hover:shadow-[0_0_22px_rgba(98,199,217,0.35)]">
              <Image src="/images/tf1logo.jpg" alt="" fill sizes="44px" className="object-cover" />
            </div>
            <span
              className={`${cinzel.className} bg-gradient-to-b from-[#fcefbd] via-[#e2bb52] to-[#b3841f] bg-clip-text text-[1.6rem] font-bold leading-none tracking-[0.14em] text-transparent`}
            >
              TF1SHOP
            </span>
          </Link>

          <p className="mt-5 text-sm leading-relaxed text-zinc-500">
            Nơi sưu tầm và giao dịch thẻ bài uy tín. Mỗi lá bài đều được kiểm tra
            tình trạng và đóng gói cẩn thận trước khi đến tay bạn.
          </p>

          <form action="/subscribe" method="post" className="mt-7">
            <label htmlFor="footer-email" className="text-sm font-semibold text-zinc-100">
              Nhận thông báo khi có bài mới
            </label>
            <div className="group relative mt-3">
              <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500 transition-colors group-focus-within:text-[#62c7d9]" />
              <input
                id="footer-email"
                type="email"
                name="email"
                required
                placeholder="Email của bạn"
                className="h-11 w-full rounded-full border border-white/[0.08] bg-white/[0.04] pl-10 pr-32 text-sm text-white placeholder:text-zinc-500 transition focus:border-[#62c7d9]/50 focus:bg-white/[0.06] focus:outline-none focus:ring-4 focus:ring-[#62c7d9]/10"
              />
              <button
                type="submit"
                className="absolute right-1 top-1 h-9 rounded-full bg-gradient-to-b from-[#ecd07a] to-[#c9972a] px-5 text-sm font-semibold text-[#1a1205] shadow-[0_0_0_1px_rgba(255,236,170,0.35)_inset] transition hover:brightness-110 active:scale-[0.98]"
              >
                Đăng ký
              </button>
            </div>
          </form>

          <div className="mt-7 flex items-center gap-1.5">
            {socials.map(({ name, href, icon: Icon }) => (
              <a
                key={name}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={name}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/[0.08] text-zinc-400 transition-colors hover:border-[#d4a537]/50 hover:bg-[#d4a537]/10 hover:text-[#f0d68f]"
              >
                <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
              </a>
            ))}
          </div>
        </div>

        {/* Các cột liên kết */}
        <nav aria-label="Chân trang" className="grid grid-cols-2 gap-10 sm:grid-cols-3">
          {columns.map((col) => (
            <div key={col.title}>
              <h3 className="text-sm font-semibold text-zinc-100">{col.title}</h3>
              <ul className="mt-5 space-y-3">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-zinc-500 transition-colors hover:text-[#f0d68f]"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </div>

      {/* Thanh dưới cùng */}
      <div className="border-t border-white/[0.06]">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-6 text-xs text-zinc-600 sm:flex-row lg:px-6">
          <p>© {new Date().getFullYear()} TF1SHOP. Bảo lưu mọi quyền.</p>
          <div className="flex items-center gap-6">
            <Link href="/terms" className="transition-colors hover:text-[#f0d68f]">
              Điều khoản sử dụng
            </Link>
            <Link href="/privacy" className="transition-colors hover:text-[#f0d68f]">
              Chính sách bảo mật
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}