# Báo cáo phần việc của Lưu

**Nhánh:** `feature/luu-shell-data`  
**Nhánh đích của PR:** `develop`  
**Phạm vi:** Shell, auth, responsive và kết quả dữ liệu mock. API A00–A03 và phần dữ liệu A10 chỉ được dùng làm định hướng adapter tương lai; chưa kết nối backend.

## Đã hoàn thành

### Đăng nhập và phiên làm việc

- Dựng giao diện đăng nhập và đăng ký theo Figma, gồm nền, form, trạng thái lỗi và responsive.
- Thêm adapter phiên mock dùng `localStorage`, có kiểm tra profile, phiên hết hạn và dọn dữ liệu không hợp lệ.
- Bổ sung `SessionGate` cho trạng thái đang tải, chưa đăng nhập, hết phiên, không có quyền và tài khoản không hoạt động.
- Luồng đăng xuất xóa thông tin phiên mock. Nút Microsoft là luồng demo, chưa dùng SSO thật.

### Workspace shell

- Hoàn thiện sidebar, topbar, project selector, trạng thái project rỗng và điều hướng agent.
- Bổ sung breakpoint mobile, trạng thái focus nhìn thấy được, nhãn truy cập và thuộc tính trạng thái cho các nút điều hướng.

### DataResult

- Tách `DataResult`, `DataTable`, metric card, filter và nút sắp xếp thành các component riêng.
- Nhận project, rows, metrics, status và metadata qua props; component không gọi `fetch`.
- Hỗ trợ loading, empty, PARTIAL, lỗi mock repository, lọc, sorting, biểu đồ chất lượng và giới hạn dữ liệu hiển thị.
- Thêm `/data-preview` để xem các trạng thái bằng fixture của mock data.

## File trong phạm vi

- `app/layout.tsx`, `app/login/page.tsx`, `app/page.tsx`
- `app/session-adapter.ts`, `app/session-gate.tsx`, `app/data-preview/`
- `components/auth-screen.tsx`, `components/auth-screen.module.css`
- `components/layout/workspace-sidebar.tsx`, `components/layout/workspace-topbar.tsx`
- `components/results/data-result.tsx`, `components/results/data-result.module.css`
- `styles/luu-shell.css`, `public/assets/figma/auth/`

Không sửa `components/chat-workspace.tsx`, conversation/analysis, report/evidence, shared types hoặc repository.

## Kiểm tra

- `npm run lint` — đạt.
- `npm run build` — đạt.
- `git diff --check` — đạt.
- Đã kiểm tra ở viewport 390px: login, đăng ký, DataResult preview và workspace giữ chiều rộng trang trong viewport.
- Đã đối chiếu form đăng nhập với node Figma `203:133`.

## Ghi chú tích hợp

- Dữ liệu, đăng nhập và nút Microsoft hiện chạy bằng mock/fixture; không gọi API thật.
- Trước khi merge, cập nhật nhánh theo `origin/develop` và đính kèm ảnh desktop/mobile vào PR nếu nhóm yêu cầu.
