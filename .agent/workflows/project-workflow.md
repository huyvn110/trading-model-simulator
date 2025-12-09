---
description: Quy trình làm việc chuẩn cho dự án Trading Model Simulator
---

# 🔁 QUY TRÌNH LÀM VIỆC CHUẨN

## 📋 TRƯỚC KHI BẮT ĐẦU TÍNH NĂNG MỚI:

1. **Mô tả rõ ràng** tính năng muốn làm
2. **Xác nhận scope** - Tính năng này ảnh hưởng những file/component nào?
3. **Backup hiện trạng** - Commit code hiện tại trước khi thay đổi

## 🛠️ TRONG KHI LÀM:

1. **Làm từng bước nhỏ** - Không làm quá nhiều thứ cùng lúc
2. **Test thường xuyên** - Kiểm tra trên browser sau mỗi thay đổi
3. **Hỏi nếu không rõ** - Đừng đoán, hỏi lại để chắc chắn

## ✅ SAU KHI HOÀN THÀNH TÍNH NĂNG:

// turbo
1. Chạy: `& "C:\Program Files\Git\bin\git.exe" status` để xem file thay đổi

// turbo  
2. Chạy: `& "C:\Program Files\Git\bin\git.exe" add .` để thêm tất cả

// turbo
3. Chạy: `& "C:\Program Files\Git\bin\git.exe" commit -m "[mô tả tính năng]"` để lưu

## 🚨 KHI GẶP LỖI:

1. **Không panic** - Code đã được backup
2. Chạy: `& "C:\Program Files\Git\bin\git.exe" log --oneline -5` xem các commit
3. Chạy: `& "C:\Program Files\Git\bin\git.exe" checkout .` để quay về commit cuối
4. Hoặc: `& "C:\Program Files\Git\bin\git.exe" checkout [commit-hash] -- [file]` để khôi phục file cụ thể

---

## 💡 LƯU Ý QUAN TRỌNG:

- **LUÔN COMMIT** sau mỗi tính năng hoàn thành
- **KHÔNG SỬA NHIỀU FILE** cùng lúc nếu không cần thiết
- **TEST TRƯỚC KHI COMMIT** - Đảm bảo code hoạt động
