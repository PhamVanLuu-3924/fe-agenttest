# Chart report và evidence

Phần việc của Sơn theo phân công frontend v3. Các component nhận dữ liệu qua props hoặc adapter, không gọi API thật và không tạo PDF thật. Việc nối vào `components/chat-workspace.tsx`, thay đổi shared types và repository interface thuộc nhóm trưởng.

## Component

- `ChartResult`: ba chế độ DOM, hấp thụ và giá/m² kết hợp DOM; hỗ trợ loading, empty, partial và error.
- `ReportDraft` và `ReportSection`: báo cáo sáu phần, executive summary một trang và completeness check.
- `EvidenceDrawer`: claim–evidence, phép tính, mẫu/phạm vi, chuỗi truy vết, focus trap và trả focus.
- `ReportActions`: draft, pending review, changes requested, approved và export mô phỏng.
- `ReportAdapter`: mock state cho review, claim và export; chống export trùng, retry và hết hạn.

## QA

Trang QA độc lập dùng fixture từ mock repository và không được import vào production:

```sh
node components/report/qa/preview.mjs
```

Các scenario gồm `ready`, `loading`, `empty`, `partial`, `error`, `no-2pn`, `missing`, `missing-section`, `pending`, `changes`, `approved`, `exporting`, `export-error` và `expired`.

Kiểm tra logic và chất lượng:

```sh
node --experimental-strip-types --import ./components/report/qa/ts-resolve.mjs --test components/report/report-checks.test.mjs
npm run lint
npm run build
```

Smoke test dùng Playwright được cung cấp ngoài `package.json`:

```sh
PLAYWRIGHT_MODULE_PATH=/absolute/path/to/node_modules/playwright \
CHROME_PATH='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' \
node components/report/qa/smoke.mjs
```

Lần kiểm tra cuối ngày 30/09/2026: 18/18 unit test đạt; lint và production build đạt; smoke test đạt trên ba dự án, ba chart và các breakpoint 375/768/1440 px; executive summary xuất đúng một trang A4.
