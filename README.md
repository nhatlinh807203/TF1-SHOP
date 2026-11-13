# Holovault

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

Để gửi email bằng Gmail, bật xác minh 2 bước cho tài khoản gửi và tạo Google App Password mới. Ứng dụng đọc `EMAIL_SERVICE`, `EMAIL_USER`, `EMAIL_PASS`; hai tên cũ `GMAIL_USER` và `GMAIL_APP_PASSWORD` vẫn được hỗ trợ nếu hai biến `EMAIL_*` chưa đặt. Thông báo thông tin đơn hàng được gửi tới `holovault.hcmc@gmail.com` theo mặc định; có thể đổi người nhận bằng `ORDER_NOTIFICATION_EMAIL`. Biến môi trường trên hosting sẽ ghi đè giá trị mặc định trong mã. Sau khi sửa `.env.local` hoặc biến môi trường hosting, khởi động lại ứng dụng/triển khai lại. Không ghi mật khẩu vào mã nguồn hoặc Git. Nếu thông tin xác thực từng được gửi trong chat hoặc nơi công khai, hãy thu hồi/thay mới chúng. MongoDB cần hỗ trợ transactions (ví dụ MongoDB Atlas replica set) để đặt hàng và cập nhật tồn kho nguyên tử.

## Quản lý sản phẩm

Đăng nhập bằng tài khoản admin và mở `/admin/products` để quản lý sản phẩm. Form quản trị không còn hiển thị các trường năng lượng, độ hiếm hoặc role; dữ liệu phân loại cũ trong MongoDB được giữ nguyên. Với sản phẩm thẻ bài, chọn game/TCG: Riftbound, Pokémon, Digimon hoặc One Piece. Trang chủ chỉ hiển thị ảnh, tên và giá tham khảo của thẻ; không hiển thị nội dung luật/mô tả, set hoặc số thẻ. Khách có thể thêm thẻ vào giỏ, sau đó gửi yêu cầu trao đổi từ giỏ với tên, phương thức và thông tin liên hệ, cách nhận card, địa chỉ nếu chọn gửi hàng, và ghi chú (nếu có). Yêu cầu có mức tổng giá tham khảo tối thiểu 50.000 đ; máy chủ tự tính ngưỡng này từ giá sản phẩm hiện tại trong MongoDB. Giá chỉ mang tính tham khảo; yêu cầu không tạo đơn hàng hoặc thanh toán tự động. Email cửa hàng dùng `ORDER_NOTIFICATION_EMAIL` (mặc định hộp thư cửa hàng); cần cấu hình `EMAIL_USER` và `EMAIL_PASS` để gửi email. Trang chủ tự tạo một khu vực riêng cho từng game khi có sản phẩm thuộc game đó đang bán và còn hàng; nhóm game chưa có sản phẩm không hiển thị. Thẻ cũ chưa phân loại vẫn nằm trong khu vực Sản phẩm khác. Có thể nhập hashtag (phân tách bằng dấu phẩy), giá, tồn kho, mô tả và chọn ảnh sản phẩm từ thiết bị (JPG, PNG, WebP hoặc GIF, tối đa 5 MB). Ảnh sản phẩm là bắt buộc nếu bật hiển thị nổi bật. Dữ liệu được lưu trong MongoDB.

### Đồng bộ catalog Riftbound

Trang `/admin/products` có mục **Catalog Riftbound Singles**. Catalog và giá thị trường TCGplayer được lấy từ API miễn phí của [OpenRift](https://openrift.app/developers), không cần API key. Ứng dụng lọc bản in tiếng Anh thường (không foil, alt art, signed hoặc overnumbered), một phiên bản cho mỗi thẻ trong 5 set chính: Origins (Set 1), Spiritforged (Set 2), Unleashed (Set 3), Vendetta (Set 4) và Radiance (Set 5). Catalog lớn được bỏ qua Next.js Data Cache (giới hạn mỗi mục cache 2 MB) và lưu trong bộ nhớ ứng dụng 1 giờ; giá OpenRift được cache 1 giờ. Các request OpenRift gửi User-Agent nhận diện Holovault.

Admin chỉ cần nhập tồn kho; giá tham khảo trên storefront hiển thị theo giá market thực tế trên TCGplayer bằng USD. Giá quy đổi VNĐ nội bộ dùng cho kiểm tra ngưỡng gửi yêu cầu được tính bằng giá USD × 23.000 VNĐ/USD (làm tròn đến đồng); có thể đặt `TCGPLAYER_USD_VND_RATE` để ghi đè tỷ giá. Giá USD và giá quy đổi được tính trực tiếp từ giá USD đã lưu, không cần nhập lại sản phẩm. Nếu thiếu giá thị trường cho thẻ mới, ứng dụng báo lỗi thay vì tạo sản phẩm thiếu giá; sản phẩm đã nhập trước đó vẫn có thể cập nhật tồn kho. ID printing được dùng để tránh tạo trùng; chỉ sản phẩm card đang kinh doanh có tồn kho lớn hơn 0 mới hiện trên trang chủ.

Ảnh được tải tự động từ [PokéWallet Riftbound API](https://pokewallet.io/api-docs/riftbound); catalog đối chiếu thẻ theo set, số thẻ và tên, còn ảnh được proxy phía server và cache 24 giờ. Tạo API key trong [dashboard PokéWallet](https://pokewallet.io/dashboard) và đặt `POKEWALLET_API_KEY` trong `.env.local` hoặc biến môi trường hosting; không đưa key vào client hoặc commit. API miễn phí hiện giới hạn 100 yêu cầu mỗi giờ và 1.000 mỗi ngày. Khi chưa cấu hình key, catalog vẫn hiển thị nhưng ảnh PokéWallet chưa tải được. Quản trị viên vẫn có thể tải ảnh mình có quyền sử dụng để thay ảnh API trên sản phẩm.

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
