# TF1SHOP

## Cấu hình đăng ký và đăng nhập

1. Sao chép `.env.example` thành `.env.local`.
2. Điền `MONGODB_URI` bằng URI MongoDB Atlas của bạn và đặt `MONGODB_DB=TF1SHOP`.
3. Đặt `SESSION_SECRET` thành chuỗi bí mật ngẫu nhiên ít nhất 32 byte. Có thể tạo bằng `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`.
4. Đặt `ADMIN_EMAIL` thành email muốn dùng cho tài khoản quản trị, sau đó đăng ký tài khoản bằng email đó. Không thể chọn vai trò từ biểu mẫu đăng ký; các tài khoản khác mặc định là `user`.
5. Chạy `npm run dev`.

Đăng ký yêu cầu họ tên, số điện thoại, email, địa chỉ và mật khẩu. Mật khẩu được băm trước khi lưu; phiên đăng nhập dùng cookie `HttpOnly`. Trang `/account` yêu cầu đăng nhập và `/admin` chỉ dành cho tài khoản có vai trò admin. Không đưa `.env.local` hoặc thông tin xác thực vào Git.

Nếu Node.js báo `querySrv ECONNREFUSED` khi kết nối MongoDB Atlas, cấu hình `MONGODB_DNS_SERVERS` trong `.env.local` thành các địa chỉ DNS có thể phân giải bản ghi SRV trên mạng của bạn, phân tách bằng dấu phẩy, rồi khởi động lại máy chủ. Ví dụ: `MONGODB_DNS_SERVERS=1.1.1.1,8.8.8.8`. Đây là cấu hình tùy chọn; mặc định ứng dụng dùng DNS của Node.js.

Nếu thông tin đăng nhập MongoDB đã được chia sẻ công khai, hãy đổi mật khẩu database trong MongoDB Atlas rồi cập nhật URI trong `.env.local`.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
