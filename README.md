# PANEL. — Comic Store

Đồ án môn **Lập trình Web** — Học viện Công nghệ Bưu chính Viễn thông (PTIT) cơ sở TP.HCM

## Thành viên nhóm

| Họ tên | MSSV |
|---|---|
| Nguyễn Quang Chí | N23DCAT009 |
| Tô Long Đức | N23DCAT013 |
| Phạm Thái Dương | N23DCAT016 |

## Mô tả dự án

**PANEL.** là một cửa hàng truyện tranh trực tuyến với đầy đủ tính năng e-commerce, hệ thống quản lý nội dung với quy trình phê duyệt, và tích hợp thanh toán VNPay.

### Tính năng chính

- **Mua sắm truyện tranh** — Duyệt, tìm kiếm, lọc theo nhân vật
- **Giỏ hàng** — Thêm, sửa số lượng, xóa sản phẩm
- **Thanh toán** — COD hoặc VNPay sandbox
- **Xác nhận đơn hàng** — Gửi email qua Gmail SMTP
- **Đăng nhập/Đăng ký** — Email + mật khẩu hoặc Google OAuth
- **Quên/Đổi mật khẩu** — Xác thực qua OTP gửi email
- **Đăng truyện** — Publisher đăng truyện -> Manager duyệt -> Công bố
- **Dashboard quản lý** — Thống kê, quản lý đơn hàng, duyệt truyện
- **Quản lý người dùng** — CRUD tài khoản, phân quyền

### Hệ thống phân quyền (4 vai trò)

| Vai trò | Quyền hạn |
|---|---|
| **System Admin** | Quản lý toàn bộ hệ thống, người dùng, phân quyền |
| **Manager** | Duyệt truyện, quản lý đơn hàng, xem thống kê |
| **Publisher** | Đăng truyện mới, quản lý kho, sửa/xóa truyện của mình |
| **Buyer** | Mua truyện, quản lý giỏ hàng, xem đơn hàng |

## Tech Stack

### Frontend
- **React 19** + TypeScript
- **Vite 8** (build tool)
- **Tailwind CSS v4** (styling)
- **React Router v7** (routing)

### Backend
- **Node.js** + Express 5
- **PostgreSQL 18** (database)
- **JWT** (authentication)
- **bcryptjs** (password hashing)
- **Nodemailer** (email service)

### Tích hợp
- **Google OAuth** (đăng nhập bằng Google)
- **VNPay Sandbox** (thanh toán trực tuyến)
- **Gmail SMTP** (gửi OTP, xác nhận đơn hàng)

## Cài đặt & Chạy

### Yêu cầu
- Node.js >= 18
- PostgreSQL >= 14

### 1. Clone repository

```bash
git clone https://github.com/rap1p1/laptrinhweb-comicstore.git
cd laptrinhweb-comicstore
```

### 2. Cài đặt Frontend

```bash
npm install
```

### 3. Cài đặt Backend

```bash
cd server
npm install
```

### 4. Cấu hình môi trường

Tạo file `server/.env`:

```env
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/comicstore
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d
GOOGLE_CLIENT_ID=your_google_client_id
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
VNP_TMN_CODE=your_vnpay_tmn_code
VNP_HASH_SECRET=your_vnpay_hash_secret
VNP_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
VNP_RETURN_URL=http://localhost:5173/payment/return
PORT=3001
CLIENT_URL=http://localhost:5173
```

### 5. Khởi tạo Database

```bash
# Tạo database
psql -U postgres -c "CREATE DATABASE comicstore;"

# Chạy seed data
cd server
npm run seed
```

### 6. Chạy ứng dụng

```bash
# Terminal 1 — Backend
cd server
npm run dev

# Terminal 2 — Frontend
npm run dev
```

Truy cập: **http://localhost:5173**

### Tài khoản test

| Vai trò | Email | Mật khẩu |
|---|---|---|
| System Admin | admin@comicstore.vn | admin123 |
| Manager | manager@comicstore.vn | manager123 |
| Publisher | publisher@comicstore.vn | publisher123 |
| Buyer | buyer@comicstore.vn | buyer123 |

## Cấu trúc dự án

```
laptrinhweb-comicstore/
├── src/                    # Frontend React
│   ├── components/         # Layout, shared components
│   ├── pages/              # Page components
│   ├── api.ts              # API client
│   ├── App.tsx             # Root component + routing
│   ├── main.tsx            # Entry point
│   └── index.css           # Global styles
├── server/                 # Backend Express
│   ├── routes/             # API route handlers
│   │   ├── auth.js         # Authentication
│   │   ├── comics.js       # Comic CRUD + approval
│   │   ├── cart.js         # Shopping cart
│   │   ├── orders.js       # Order management
│   │   ├── payment.js      # VNPay integration
│   │   └── users.js        # User management
│   ├── middleware/         # Auth middleware
│   ├── utils/              # Email service
│   ├── db.js               # Database connection
│   ├── schema.js           # Database schema
│   ├── seed.js             # Sample data
│   └── server.js           # Server entry
├── index.html
├── vite.config.ts
├── package.json
└── README.md
```

## API Endpoints

### Authentication
| Method | Endpoint | Mô tả |
|---|---|---|
| POST | `/api/auth/register` | Đăng ký tài khoản |
| POST | `/api/auth/login` | Đăng nhập |
| POST | `/api/auth/google` | Đăng nhập Google OAuth |
| POST | `/api/auth/forgot-password` | Gửi OTP quên mật khẩu |
| POST | `/api/auth/reset-password` | Đặt lại mật khẩu |
| POST | `/api/auth/change-password` | Đổi mật khẩu |
| POST | `/api/auth/verify-email` | Xác nhận email |
| GET | `/api/auth/me` | Thông tin người dùng |

### Comics
| Method | Endpoint | Mô tả |
|---|---|---|
| GET | `/api/comics` | Danh sách truyện (public) |
| GET | `/api/comics/:id` | Chi tiết truyện |
| POST | `/api/comics` | Đăng truyện mới (Publisher) |
| PUT | `/api/comics/:id` | Cập nhật truyện |
| PATCH | `/api/comics/:id/review` | Duyệt/Từ chối (Manager) |
| PATCH | `/api/comics/:id/stock` | Cập nhật kho |

### Cart & Orders
| Method | Endpoint | Mô tả |
|---|---|---|
| GET | `/api/cart` | Xem giỏ hàng |
| POST | `/api/cart` | Thêm vào giỏ |
| POST | `/api/orders` | Tạo đơn hàng |
| POST | `/api/payment/create` | Tạo thanh toán VNPay |

---

(c) 2025 PANEL. Comic Store — Đồ án Lập trình Web, PTIT HCM
