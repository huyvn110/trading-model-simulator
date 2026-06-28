# Trading Model Simulator (Trade Tracker)

Trading Model Simulator, hay Trade Tracker, là một ứng dụng giúp trader mô phỏng, ghi lại và phân tích các giao dịch của mình. Ứng dụng hỗ trợ cả chế độ backtest, live trading, ghi chú quy tắc giao dịch và lưu lại bài học sau mỗi phiên.

Dự án được xây dựng bằng **Next.js** và có thể chạy như web app hoặc desktop app thông qua **Electron**.

## Tính Năng Chính

### 1. Test Mode

- **Quản lý session**: tạo và quản lý các phiên giao dịch mô phỏng.
- **Ghi log trade**: lưu chi tiết từng lệnh cùng các factor ảnh hưởng đến quyết định vào lệnh.
- **Thống kê và biểu đồ**: trực quan hóa kết quả bằng chart và bảng thống kê.
- **Lịch sử trades**: xem lại, phân tích và đánh giá các lệnh đã ghi.

### 2. Live Mode

- **Quản lý model**: tạo và theo dõi các mô hình hoặc chiến lược giao dịch khác nhau.
- **Trade panel**: ghi lệnh thực chiến theo model đã chọn.
- **Phân tích thực chiến**: xem biểu đồ, thống kê và hiệu suất theo model.
- **Session history**: lưu trữ và đánh giá hiệu suất theo từng phiên live.

### 3. Notes

- Soạn thảo và lưu trữ quy tắc giao dịch.
- Hỗ trợ trình soạn thảo dạng Notion-like và simple note editor.
- Lưu bài học, nhật ký tâm lý giao dịch và kinh nghiệm cá nhân.

## Công Nghệ Sử Dụng

- **Framework**: Next.js 14, React 18
- **UI**: Material UI v5, Emotion
- **Desktop app**: Electron
- **State management**: Zustand
- **Charts**: Chart.js, react-chartjs-2
- **Drag and drop**: @dnd-kit
- **Lưu trữ và đồng bộ**: local storage, IndexedDB, Supabase, Google Drive upload
- **Ngôn ngữ**: TypeScript

## Cài Đặt Và Chạy Dự Án

### Yêu Cầu

- Node.js 18 trở lên
- npm hoặc yarn

### Cài Dependencies

```bash
npm install
```

### Chạy Web App

```bash
npm run dev
```

Sau đó mở:

```text
http://localhost:3000
```

### Chạy Desktop App Với Electron

```bash
npm run electron:dev
```

### Build Web App

```bash
npm run build
```

### Build File Cài Đặt Windows

```bash
npm run dist:win
```

## Cấu Hình Môi Trường

Dự án có file `.env.example` để tham khảo các biến môi trường cần thiết. Khi chạy các tính năng đăng nhập, đồng bộ cloud hoặc upload ảnh, cần cấu hình các dịch vụ liên quan như Google OAuth, Supabase và NextAuth.

Tạo file `.env.local` từ `.env.example` rồi điền giá trị phù hợp:

```bash
cp .env.example .env.local
```

## Cấu Trúc Chính

```text
src/app                 Next.js app routes và API routes
src/components          Giao diện Test Mode, Live Mode, Notes và shared UI
src/store               Zustand stores cho session, model, factor, notes
src/lib                 Auth, Supabase, upload ảnh, image store
src/utils               Export Excel và backup/restore
app-electron            Electron wrapper
src-tauri               Cấu hình Tauri thử nghiệm
public                  Asset public
```

## Workflow Gợi Ý

Trước khi làm tính năng mới:

- Xác định rõ tính năng cần làm.
- Xác định phạm vi ảnh hưởng tới component, store hoặc API route nào.
- Kiểm tra trạng thái Git hiện tại.

Trong khi làm:

- Thay đổi theo từng bước nhỏ.
- Chạy thử thường xuyên trên trình duyệt.
- Tránh sửa lan sang phần không liên quan.

Sau khi hoàn thành:

```bash
git status
git add .
git commit -m "Mô tả thay đổi"
```

## Ghi Chú

- README này mô tả trạng thái hiện tại của dự án Trade Tracker.
- Một số dữ liệu được lưu local bằng Zustand persist.
- Live session có cơ chế đồng bộ cloud qua Supabase khi người dùng đăng nhập.
- Ảnh trong trade có thể lưu local bằng IndexedDB hoặc upload lên Google Drive tùy luồng sử dụng.
