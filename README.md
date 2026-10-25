# TF1SHOP

## Cấu hình đăng ký và đăng nhập

1. Sao chép `.env.example` thành `.env.local`.
2. Điền `MONGODB_URI` bằng URI MongoDB Atlas của bạn và đặt `MONGODB_DB=TF1SHOP`.
3. Đặt `SESSION_SECRET` thành chuỗi bí mật ngẫu nhiên ít nhất 32 byte. Có thể tạo bằng `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`.
4. Đặt `ADMIN_EMAIL` thành email muốn dùng cho tài khoản quản trị, sau đó đăng ký tài khoản bằng email đó. Không thể chọn vai trò từ biểu mẫu đăng ký; các tài khoản khác mặc định là `user`.
5. Chạy `npm run dev`.

Đăng ký yêu cầu họ tên, số điện thoại, email, địa chỉ và mật khẩu. Mật khẩu được băm trước khi lưu; phiên đăng nhập dùng cookie `HttpOnly`. Trang `/account` yêu cầu đăng nhập và `/admin` chỉ dành cho tài khoản có vai trò admin. Không đưa `.env.local` hoặc thông tin xác thực vào Git.

### Đăng nhập Google

1. Trong Google Cloud Console, tạo OAuth client loại **Web application**.
2. Thêm `http://localhost:3000/api/auth/google/callback` vào **Authorized redirect URIs**.
3. Điền `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET` và `AUTH_GOOGLE_CALLBACK_URL` trong `.env.local`. Khi deploy, đặt callback URL thành `https://<tên-miền>/api/auth/google/callback` và thêm cùng URL vào danh sách redirect URI trong Google Cloud Console.
4. Khởi động lại ứng dụng. Nút Google trên trang đăng nhập và đăng ký sẽ đưa người dùng qua Google; tài khoản mới được lưu trong MongoDB và đăng nhập ngay. Tài khoản Google dùng email đã xác minh; số điện thoại và địa chỉ có thể bổ sung sau.

Nếu Node.js báo `querySrv ECONNREFUSED` khi kết nối MongoDB Atlas, cấu hình `MONGODB_DNS_SERVERS` trong `.env.local` thành các địa chỉ DNS có thể phân giải bản ghi SRV trên mạng của bạn, phân tách bằng dấu phẩy, rồi khởi động lại máy chủ. Ví dụ: `MONGODB_DNS_SERVERS=1.1.1.1,8.8.8.8`. Đây là cấu hình tùy chọn; mặc định ứng dụng dùng DNS của Node.js.

Nếu thông tin đăng nhập MongoDB đã được chia sẻ công khai, hãy đổi mật khẩu database trong MongoDB Atlas rồi cập nhật URI trong `.env.local`.

## Giỏ hàng, đặt hàng và email

Giỏ hàng được lưu trong trình duyệt và số lượng được hiển thị trên nút giỏ hàng ở header. Trang `/stack` ban đầu chỉ hiển thị các sản phẩm và số lượng. Khi khách nhấn **Tiếp tục thanh toán**, server kiểm tra giá và tồn kho, tạo đơn và trừ kho trong MongoDB transaction; sau đó hiển thị thông tin nhận hàng, QR VietQR và liên kết Zalo hỗ trợ. Sản phẩm có trang chi tiết tại `/products/<product-id>`.

Chỉ khi khách nhấn **Tôi đã chuyển khoản - xác nhận thanh toán**, hệ thống mới gửi email tiêu đề **CÓ ĐƠN ĐẶT HÀNG MỚI** kèm thông tin đơn đến hộp thư admin và gửi xác nhận cho khách hàng. Trạng thái chuyển khoản lúc này là khách đã báo, chưa phải xác nhận giao dịch ngân hàng. Trang quản trị `/admin/orders` cho admin kiểm tra giao dịch rồi xác nhận đã thanh toán; thao tác này gửi email xác nhận thanh toán thành công cho khách, đồng thời thông báo đơn đang chờ xử lý và giao hàng. Hệ thống không tự kiểm tra giao dịch ngân hàng.

Để gửi email bằng Gmail, bật xác minh 2 bước cho tài khoản gửi và tạo Google App Password mới. Ứng dụng đọc `EMAIL_SERVICE`, `EMAIL_USER`, `EMAIL_PASS`; hai tên cũ `GMAIL_USER` và `GMAIL_APP_PASSWORD` vẫn được hỗ trợ nếu hai biến `EMAIL_*` chưa đặt. Hộp thư nhận đơn đặt bằng `ORDER_NOTIFICATION_EMAIL` (mặc định hộp thư cửa hàng trong `.env.example`). Sau khi sửa `.env.local`, khởi động lại máy chủ. Không ghi mật khẩu vào mã nguồn hoặc Git. Nếu thông tin xác thực từng được gửi trong chat hoặc nơi công khai, hãy thu hồi/thay mới chúng. MongoDB cần hỗ trợ transactions (ví dụ MongoDB Atlas replica set) để đặt hàng và cập nhật tồn kho nguyên tử.

## Quản lý sản phẩm

Đăng nhập bằng tài khoản admin. Các trang quản trị được chia riêng: `/admin/energies` để thêm/sửa/xóa năng lượng (tên và ảnh), `/admin/rarities` để quản lý các mức độ hiếm, `/admin/roles` để quản lý role (tên và ảnh), và `/admin/products` để quản lý sản phẩm. Khi tạo sản phẩm, chọn tối thiểu một và tối đa hai năng lượng đã tạo, đồng thời chọn một role; riêng thẻ bài cần chọn thêm một độ hiếm. Có thể nhập hashtag (phân tách bằng dấu phẩy), giá, tồn kho, mô tả và chọn ảnh sản phẩm từ thiết bị (JPG, PNG, WebP hoặc GIF, tối đa 5 MB). Ảnh sản phẩm là bắt buộc nếu bật hiển thị nổi bật. Năng lượng, role và độ hiếm không thể xóa khi đang được dùng bởi sản phẩm. Dữ liệu được lưu trong MongoDB. Bật **Hiển thị nổi bật trên banner trang chủ** và **Đang kinh doanh** để sản phẩm xuất hiện trong banner; tối đa bảy sản phẩm mới cập nhật có ảnh được hiển thị.

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
