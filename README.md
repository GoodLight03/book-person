# Self Talk Book 📖

Ứng dụng React viết **sách tự nói chuyện với bản thân** với hiệu ứng lật trang thực tế, hỗ trợ nhiều cuốn sách, ghi chú không giới hạn, chỉnh font/size/color, chèn ảnh, và lưu realtime bằng Firebase.

## ✨ Tính năng chính

- **Giao diện đăng nhập độc đáo**: Bóng đèn đen treo, kéo dây để bật đèn & hiện form (kéo lại để tắt/ẩn).
- **Tài khoản mặc định**: `admin` / `2003` (tự tạo lần đầu, lần sau chỉ đăng nhập).
- **Nhiều cuốn sách**: Tạo/xóa sách, chọn màu bìa.
- **Hiệu ứng mở/đóng sách + lật trang** như thật (react-pageflip).
- **Mỗi sách có ghi chú/trang không giới hạn**.
- **Chỉnh sửa đầy đủ**: font-size, màu chữ, màu nền trang, chèn ảnh (base64).
- **Realtime Firebase**: Mọi dữ liệu đồng bộ ngay.
- **Bảo mật**: Security Rules chỉ cho user đọc/ghi data của chính mình.

## 🚀 Cài đặt & Chạy

### 1. Clone / mở project

```bash
cd self-talk-book
npm install
```

### 2. Cấu hình Firebase

1. Vào [Firebase Console](https://console.firebase.google.com) → tạo project mới.
2. **Authentication** → Sign-in method → bật **Email/Password**.
3. **Realtime Database** → Create Database (chọn region gần, ví dụ `asia-southeast1`) → bắt đầu ở chế độ **locked**.
4. Vào **Rules** tab, dán nội dung file `database.rules.json` rồi **Publish**.
5. (Tùy chọn) **Storage** nếu sau này muốn upload ảnh riêng.
6. Project Settings → Your apps → Add web app → copy config object.

7. Mở `src/firebase.ts` và thay:

```ts
const firebaseConfig = {
  apiKey: "...",
  authDomain: "...",
  databaseURL: "https://....firebasedatabase.app",
  projectId: "...",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "..."
};
```

### 3. Chạy dev

```bash
npm run dev
```

Mở trình duyệt theo link Vite hiện ra (thường `http://localhost:5173`).

### 4. Build production

```bash
npm run build
npm run preview
```

## 🔐 Bảo mật

- Rules chỉ cho phép `auth.uid === $uid` đọc/ghi dưới `users/$uid/...`.
- Không có dữ liệu public.
- Tài khoản admin chỉ được tạo 1 lần (logic trong AuthContext kiểm tra user-not-found rồi mới create).
- Ảnh được lưu base64 trong note (giới hạn ~1.5MB/ảnh để tránh payload quá lớn). Có thể mở rộng dùng Firebase Storage sau.

## 📁 Cấu trúc thư mục

```
src/
  components/
    Login.tsx + Login.css          # Bóng đèn + form
    BookShelf.tsx + .css           # Kệ sách
    BookViewer.tsx + .css          # Lật trang + editor
  context/
    AuthContext.tsx                # Auth + default admin
  types/
    index.ts
  firebase.ts
  App.tsx
  main.tsx
  index.css
database.rules.json
```

## 🎮 Cách dùng

1. Kéo **dây đèn** để bật sáng → form hiện.
2. Đăng nhập `admin` / `2003`.
3. Tạo sách mới → chọn màu bìa.
4. Click vào sách → lật trang.
5. Double-click hoặc nút **Sửa** để chỉnh nội dung, font, màu, chèn ảnh.
6. **+ Thêm trang** để viết thêm.

## 🛠 Công nghệ

- React 19 + TypeScript + Vite
- Firebase Auth + Realtime Database
- react-pageflip (StPageFlip)
- date-fns
- uuid

## ⚠️ Lưu ý

- Email mặc định dùng domain `.local` (`admin@selftalk.local`). Firebase chấp nhận.
- Nếu muốn đổi mật khẩu mặc định, sửa trong `AuthContext.tsx`.
- Trên mobile: hỗ trợ swipe để lật trang.

---

Made with ❤️ for self-reflection.
