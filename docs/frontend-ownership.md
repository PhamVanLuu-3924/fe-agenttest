# Frontend ownership sau PR nền

Tài liệu này là hợp đồng làm việc cho bốn nhánh frontend. Ứng dụng dùng mock data qua `WorkspaceRepository`; không gọi backend trực tiếp trong component.

## Ranh giới đã có

- `app/`: route và page composition.
- `components/layout/`: shell, sidebar, topbar và responsive layout.
- `components/conversation/`: message stream, composer và history panel.
- `components/shared/`: component nhỏ dùng chung, không chứa nghiệp vụ.
- `components/run/`: trạng thái và giao diện một lượt phối hợp agent.
- `components/results/`: bảng dữ liệu, compare và insight.
- `components/report/`: chart, report preview và export UI.
- `types/`: kiểu dữ liệu dùng xuyên feature.
- `repositories/`: interface để UI đọc dữ liệu.
- `mocks/`: implementation giả lập của repository và fixture phục vụ UI.
- `styles/tokens.css`: design tokens; `styles/base.css`: reset/font nền; `app/globals.css`: CSS hiện hữu của màn hình.

`components/chat-workspace.tsx` là composition root. Trong các PR tính năng, chỉ nhóm trưởng sửa file này để nối component mới; thành viên gửi component qua đúng thư mục ownership của mình.

## Chia việc cân bằng

### Thành viên 1 — Shell, auth và responsive

- Hoàn thiện login/error/empty/loading states.
- Hoàn thiện sidebar, topbar, project selector và responsive/mobile behavior.
- Kiểm tra keyboard navigation, focus, aria label và breakpoint.
- Phạm vi chính: `app/`, `components/auth-screen.tsx`, `components/layout/`.

### Thành viên 2 — Conversation và run lifecycle

- Hoàn thiện message item, composer, prompt suggestions và history drawer.
- Tạo UI state idle/receiving/thinking/collaborating/complete/error.
- Tách group/run card khỏi composition root và dùng mock timer/repository.
- Phạm vi chính: `components/conversation/`, `components/run/`.

### Thành viên 3 — Data, compare và insight

- Tách các artifact Data/Compare/Insight thành component độc lập.
- Hoàn thiện table, metric cards, filter/empty/partial-data states.
- Viết selector thuần từ fixture; không nhúng fetch vào component.
- Phạm vi chính: `components/results/`, selector liên quan trong `mocks/`.

### Thành viên 4 — Chart, report và evidence

- Tách artifact Chart/Report thành component độc lập.
- Hoàn thiện chart states, executive summary, claim/evidence review và nút export giả lập.
- Bảo đảm report dùng cùng selector và type với các màn hình khác.
- Phạm vi chính: `components/report/`, phần style riêng của report/chart.

Mỗi người chịu trách nhiệm cả desktop, mobile, loading, empty/error state và kiểm tra lint/build trong phạm vi của mình. Nhóm trưởng giữ quyền sửa `chat-workspace.tsx`, shared types, repository interface và global tokens để tránh bốn PR cùng chạm file nóng.

## Quy trình branch và PR

Sau khi PR nền được merge vào `develop`, mỗi người chạy:

```bash
git fetch origin
git switch develop
git pull --ff-only origin develop
git switch -c feature/<ten-ngan-gon>
```

Nếu branch đã tồn tại:

```bash
git fetch origin
git switch feature/<ten-ngan-gon>
git rebase origin/develop
```

Trước khi mở hoặc cập nhật PR:

```bash
npm run lint
npm run build
git fetch origin
git rebase origin/develop
```

PR phải nhắm vào `develop`, chỉ chứa một ownership area, kèm ảnh desktop/mobile và danh sách trạng thái UI đã kiểm tra. Không commit `.env`, `.next` hoặc đổi interface trong `types/`/`repositories/` khi chưa báo nhóm trưởng.

## Quy tắc mock-first

- Component chỉ nhận props hoặc gọi adapter đã được truyền vào; không phụ thuộc API thật.
- Fixture mới đặt trong `mocks/`, type dùng chung đặt trong `types/`.
- Khi backend sẵn sàng, tạo implementation mới của `WorkspaceRepository`; không viết lại component.
- Loading, empty, partial và error phải mô phỏng được mà không cần backend.
- Nếu cần đổi contract, mở một PR nhỏ cho type/interface trước, merge rồi các branch cùng rebase.
