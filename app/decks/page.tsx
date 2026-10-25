import Link from "next/link";
import { ArrowLeft, Boxes } from "lucide-react";

export default function DecksPage() {
  return (
    <main className="flex min-h-[60vh] items-center bg-[#090b0c] px-5 py-16 text-white sm:px-8">
      <div className="mx-auto w-full max-w-3xl text-center">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-violet-300/20 bg-violet-300/[0.06] text-violet-200">
          <Boxes className="h-7 w-7" strokeWidth={1.5} />
        </span>
        <p className="mt-6 text-xs font-semibold tracking-[0.22em] text-[#d9b754]">
          READY TO PLAY
        </p>
        <h1 className="mt-3 font-serif text-3xl text-[#f2eee4] sm:text-4xl">
          Bộ bài
        </h1>
        <p className="mx-auto mt-4 max-w-lg text-sm leading-7 text-zinc-400">
          Hiện chưa có sản phẩm trong danh mục bộ bài. Các lá bài đơn đang có
          sẵn để bạn lựa chọn và tự xây dựng deck của mình.
        </p>
        <Link
          href="/#danh-muc"
          className="mt-8 inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-gradient-to-b from-[#f0d783] to-[#c79732] px-6 py-3 text-sm font-semibold text-[#211805] transition hover:brightness-110"
        >
          <ArrowLeft className="h-4 w-4" />
          Khám phá các lá bài
        </Link>
      </div>
    </main>
  );
}
