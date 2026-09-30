# BÁO CÁO TỔNG KẾT DỰ ÁN VDAGENT FRONTEND
**Nhiệm vụ:** Hoàn thiện Luồng Hội Thoại (`Conversation`) & Tách Độc Lập Kết Quả Phân Tích (`Analysis Results`)
**Người thực hiện:** Quốc (Frontend Developer)
**Nhánh Git:** `feature/quoc-conversation-analysis`
**Commit ID:** `304315d`
**Trạng thái bàn giao:** Sẵn sàng Review & Mở Pull Request vào `develop`

---

## 1. Phạm Vi Sở Hữu & Ranh Giới Kiến Trúc (Ownership Compliance)

- **Phạm vi sở hữu**:
  - `components/conversation/**`
  - `components/results/analysis/**`
- **Ranh giới tuân thủ 100%**:
  - Tuyệt đối **không chỉnh sửa** bất kỳ tệp nào nằm ngoài quyền sở hữu: `components/chat-workspace.tsx`, `types/**`, `repositories/**`, `components/shared/**`, `components/results/data/**`, `components/report/**`, `app/**`, `components/layout/**`.
  - Không gọi trực tiếp `fetch`/`axios`/`SSE` trong component; dữ liệu được quản lý hoàn toàn thông qua selector thuần từ fixture và mock repository.
  - Sử dụng toàn bộ hệ thống biến CSS tokens từ Figma (`--vd-*`) lồng fallback token cũ, không hardcode màu sắc hay kích thước.

---

## 2. Danh Mục Các Component Đã Xây Dựng & Nâng Cấp (19 Files)

### A. Phân hệ Conversation (`components/conversation/**`)
1. **`conversation-stream.tsx`**:
   - Quản lý cuộn thông minh: tự động cuộn khi có tin nhắn mới nếu đang ở cuối trang, **giữ nguyên góc nhìn (không kéo người dùng xuống)** nếu họ đang đọc tin nhắn cũ bên trên.
   - Hiển thị nút floating *"Tin nhắn mới bên dưới"* khi người dùng đang đọc ở lưng chừng.
   - Thuật toán `useLayoutEffect` tính toán độ chênh lệch chiều cao khi tải thêm lịch sử ở đầu trang (prepending history), giữ nguyên vị trí trực quan của màn hình.
   - Tự động tích hợp và render `CompareResult` và `InsightResult` khi nhận được artifact tương ứng.
2. **`prompt-composer.tsx`**:
   - Chuyển đổi khung soạn thảo sang `textarea` tự động co giãn độ cao theo nội dung.
   - **Khóa submit đồng bộ** thông qua `isLockedRef` và cửa sổ debounce 600ms (`lastSubmitTimeRef`): Chặn triệt để hiện tượng click đúp nút gửi hoặc vừa nhấn `Enter` vừa click chuột.
   - Hiển thị toast cảnh báo nhẹ `role="alert"`: *"Yêu cầu vừa được gửi, vui lòng chờ trong giây lát..."*.
   - **Hỗ trợ bộ gõ tiếng Việt (IME)**: Sử dụng `isComposing` và `keyCode === 229` để không gửi nhầm khi đang gõ dấu tiếng Việt (Telex/VNI).
   - Hỗ trợ `Shift + Enter` để xuống dòng đa dòng; chỉ gửi khi nhấn `Enter` đơn lẻ.
   - Tích hợp input proxy ẩn giúp tương thích hoàn toàn với mã tìm kiếm DOM cũ của `chat-workspace.tsx`.
3. **`history-panel.tsx`**:
   - Đầy đủ 5 trạng thái: Đang tải ban đầu (skeleton shimmer), Hoạt động gần đây (short-term history), Lượt chạy đã lưu (saved runs), Đang tải thêm (load more pagination), và Lỗi tải thêm có nút *"Thử lại"*.
   - Hỗ trợ phím `Escape` để đóng panel, điều hướng danh sách bằng phím mũi tên `ArrowDown`/`ArrowUp`.
   - Responsive Mobile: Tự động chuyển thành **Drawer trượt từ cạnh phải** (`slideInRight`) kèm lớp phủ làm mờ nền `historyBackdrop`, không gây tràn ngang giao diện.
4. **`message-item.tsx`**:
   - Phân biệt rõ avatar người dùng ("BN") và AgentMark.
   - Hỗ trợ tin nhắn lạc quan (*optimistic pending message*) với badge "Đang gửi..." và hiệu ứng mờ nhẹ.
   - Hỗ trợ tin nhắn gửi thất bại (*failed message*) với viền đỏ cảnh báo và nút *"Thử lại"* (`onRetry`) giúp gửi lại mà không sinh bản ghi trùng.
5. **`empty-conversation.tsx`**:
   - Màn hình khởi tạo hội thoại trống khi chưa có tin nhắn, hiển thị lời chào và 4 chip câu hỏi gợi ý nhanh theo đặc tả Figma.
6. **`artifact-skeleton.tsx`**:
   - Skeleton dự trữ chiều cao (`min-height: 280px`) hiển thị trong giai đoạn agent đang suy nghĩ, triệt tiêu hoàn toàn hiện tượng giật nhảy layout (CLS).
7. **`use-conversation.ts`**:
   - Custom hook quản lý state độc lập theo mô hình reducer chuẩn: quản lý tin nhắn, trạng thái gửi, phân trang lịch sử và cơ chế retry an toàn.
8. **`fixtures.ts`**:
   - Fixture dữ liệu giả lập cho 3 kịch bản kiểm thử: hội thoại rỗng, lịch sử dài 220 tin nhắn và kịch bản lỗi mạng.
9. **`conversation.module.css`**:
   - CSS Module độc lập cho toàn bộ phân hệ conversation.

---

### B. Phân hệ Analysis Results (`components/results/analysis/**`)
1. **`compare-result.tsx`**:
   - Thẻ số chuẩn `MetricCard` hiển thị: DOM dự án, Trung vị peer, Tỷ lệ hấp thụ, Chênh lệch giá chào.
   - Slot biểu đồ DOM & Donut hấp thụ (thiết kế sẵn interface dành cho Sơn ghép chart).
   - Bảng đối chiếu peer group bọc trong container `.tableWrap` có `overflow-x: auto`, bảo đảm an toàn trên thiết bị di động.
   - Nhận định đối chuẩn (benchmark callout), cảnh báo mức tương đồng và nút mở rộng chi tiết giới hạn.
   - **Xử lý 6 trạng thái nghiệp vụ**: Bình thường, **Không đủ peer** ($N < 5$, khóa benchmark và biểu đồ), Đang tải, Rỗng, Thất bại và Dữ liệu từng phần (Partial).
2. **`insight-result.tsx`**:
   - 4 thẻ số tổng quan: Trên ngưỡng giá (71%), View nội khu (54%), Thiếu metadata (8%), Số lượng insight có căn cứ (2).
   - Danh sách nhận định chi tiết với **nhãn chữ mức độ tin cậy rõ ràng** (*"Insight · Độ tin cậy cao / vừa / thấp"*), không phụ thuộc vào màu sắc đơn thuần.
   - Nút tham chiếu bằng chứng EVD bấm được (gọi callback `onOpenEvidence` qua props, không tự ý chuyển trang).
   - **Phần "Giới hạn kết luận" luôn luôn hiển thị** kèm nút xem chi tiết phạm vi phân tích.
   - Xử lý các trạng thái: Bình thường, Cảnh báo (dữ liệu partial / độ tin cậy thấp), Rỗng, Thất bại, Đang tải.
3. **`selectors.ts`**:
   - Cung cấp hai pure selector `selectCompareData` và `selectInsightData` độc lập.
   - Hỗ trợ 2 chế độ:
     - `mode: "derived"`: Tính toán động 100% từ dữ liệu căn hộ thô của fixture `mock-real-estate.ts` $\rightarrow$ **Khớp chính xác từng con số với những gì DataResult nhận**.
     - `mode: "figma_poc"`: Trả về chuẩn số liệu minh họa của dự án River Gate theo bản vẽ thiết kế Figma (124, 90, 34, 2.1%, 3.4%, 71%, 54%, 8%).
   - Xử lý biên an toàn: Khi dự án không có căn bán chậm nào (như `ocean-park`), tỷ lệ vượt ngưỡng giá và view nội khu tự động trả về đúng $0\%$ thay vì fallback về số liệu mẫu.
4. **`analysis.module.css`**:
   - Đầy đủ media queries responsive cho màn hình 1440px (Desktop), 768px (Tablet - grid 2 cột), và 375px (Mobile).

---

## 3. Bảng Đối Chiếu 8 Trạng Thái Bắt Buộc

| STT | Trạng thái bắt buộc | Trạng thái | Nằm ở file nào | Hành vi hiển thị & Xử lý kỹ thuật |
| :---: | :--- | :---: | :--- | :--- |
| **1** | **Conversation rỗng** | **ĐÃ CÓ** | `empty-conversation.tsx`<br>`conversation-stream.tsx#L182` | Hiển thị khi `messages.length === 0`. Icon agent, tiêu đề gợi ý câu hỏi, 4 chip câu hỏi nhanh click để nạp vào composer. |
| **2** | **Đang gửi** | **ĐÃ CÓ** | `prompt-composer.tsx#L162`<br>`message-item.tsx#L76`<br>`conversation-stream.tsx#L214` | Khóa composer, nút gửi chuyển trạng thái `Đang gửi...` kèm `BouncingDots`. Tin nhắn người dùng hiện ngay với badge pending, hiển thị `ThinkingIndicator` và `ArtifactSkeleton` giữ chỗ. |
| **3** | **Gửi trùng** | **ĐÃ CÓ** | `prompt-composer.tsx#L123` | Khóa đồng bộ ngay lập tức qua `isLockedRef` và debounce 600ms. Hiển thị thông báo nhẹ viền vàng `role="alert"`: *"Yêu cầu vừa được gửi, vui lòng chờ trong giây lát..."*, không gửi request lặp. |
| **4** | **Không có lịch sử** | **ĐÃ CÓ** | `history-panel.tsx#L221` | Hiển thị thẻ rỗng khi `savedRuns.length === 0`: icon `FileText`, tiêu đề *"Chưa có run nào được lưu"* và thông báo lưu tự động. |
| **5** | **Đang tải thêm** | **ĐÃ CÓ** | `history-panel.tsx#L280`<br>`conversation-stream.tsx#L159` | `HistoryPanel`: nút "Tải thêm" hiển thị `BouncingDots` và `aria-busy="true"`. `ConversationStream`: nút "Đang tải tin nhắn cũ…" ở đầu luồng kết hợp thuật toán giữ nguyên vị trí scroll. |
| **6** | **Không đủ peer** | **ĐÃ CÓ** | `compare-result.tsx#L143`<br>`compare-result.tsx#L174` | Khi số lượng peer $< 5$: cảnh báo *"Mẫu đối sánh không đủ điều kiện thống kê (N/5 peers)"*. Khóa benchmark, hấp thụ, giá chào và biểu đồ, **tuyệt đối không hiển thị số giả như thể đủ dữ liệu**. |
| **7** | **Insight cảnh báo** | **ĐÃ CÓ** | `insight-result.tsx#L131`<br>`insight-result.tsx#L291` | Thẻ cảnh báo dữ liệu partial, nhãn chữ mức tin cậy rõ ràng (*"Insight · Cảnh báo / Độ tin cậy thấp"*), mã bằng chứng EVD, và phần **"Giới hạn kết luận" luôn luôn hiển thị**. |
| **8** | **Kết quả thất bại** | **ĐÃ CÓ** | `compare-result.tsx#L101`<br>`insight-result.tsx#L75`<br>`message-item.tsx#L86` | Thẻ báo lỗi viền đỏ, nêu rõ nguyên nhân thất bại và cung cấp nút *"Thử lại"* (`onRetry`), tin nhắn người dùng chuyển trạng thái failed cho phép gửi lại mà không sinh bản ghi trùng lặp. |

---

## 4. Báo Cáo Kiểm Tra Tính Nhất Quán Dữ Liệu (Consistency Check)

Bộ test tự động `components/results/analysis/consistency.test.ts` đã kiểm tra toàn diện dữ liệu giữa **DataResult** (trong `chat-workspace.tsx`), **CompareResult** và **InsightResult**:

### A. Đối chiếu với cùng một fixture (`Green Avenue` - Mode Derived):
- **Phân khu Focus (chậm nhất)**: Cả 3 màn hình đều xác định là `Riverside` với DOM trung bình = `103 ngày`.
- **DOM Benchmark Peer**: Cả 3 màn hình đều tính trung bình 2 phân khu còn lại (`Garden` 60 ngày + `Parkside` 46 ngày $\rightarrow$ `53 ngày`).
- **Chênh lệch DOM ($\Delta$)**: $103 - 53 = +50\text{ ngày}$. Cả thẻ số và câu kết luận đều khớp chính xác tuyệt đối.
- **Tỷ lệ hấp thụ**: Phân khu Riverside đạt $55.0\%$, benchmark đạt $69.5\%$, chênh lệch $14.5$ điểm %.
- **Tỷ lệ dữ liệu PARTIAL**: 16/1.248 bản ghi ($1.28\% \approx 1\%$).
$\rightarrow$ **Kết luận**: Ở chế độ `derived`, số liệu hiển thị ở CompareResult và InsightResult **khớp 100% với những gì DataResult nhận**.

### B. Giải trình các điểm lệch so với Figma Mockup (River Gate):
- **Khác biệt dự án**: Bản thiết kế Figma mô phỏng case study của dự án "River Gate" (TP.HCM), trong khi fixture của repo sinh dữ liệu cho 3 dự án khác (`green-avenue`, `ocean-park`, `grand-marina`).
- **Khác biệt thang đo hấp thụ**: Figma POC tính tỷ lệ hấp thụ định kỳ theo tháng ($2.1\%/\text{tháng}$ so với $3.4\%$), trong khi fixture repo gán trường `absorption` từ 38% đến 91% đại diện cho tỷ lệ hấp thụ lũy kế của rổ hàng.
- **Khác biệt phân bổ thuộc tính**: Generator của repo gán view xoay vòng đều qua 4 loại view (tỷ lệ view nội khu ~25%), trong khi Figma POC phản ánh thực tế phân khu có view nội khu chiếm đa số (54%).
- **Giải pháp**: Nhờ kiến trúc phân tách 2 mode (`derived` vs `figma_poc`) trong `selectors.ts`, hệ thống vừa bảo đảm tính toàn vẹn dữ liệu từ backend/fixture, vừa sẵn sàng cho demo giao diện chuẩn mockup Figma khi cần thiết.

---

## 5. Kết Quả Kiểm Tra Kỹ Thuật (Quality Gates)

| Hạng mục kiểm tra | Lệnh thực thi | Kết quả | Ghi chú |
| :--- | :--- | :---: | :--- |
| **Automated Tests** | `node --loader ./test-loader.mjs --test *.test.ts` | **PASS 15/15** | 9 tests luồng conversation + 6 tests đối chiếu dữ liệu consistency. |
| **ESLint** | `npm run lint` | **PASS (0 lỗi)** | 0 errors, 0 warnings. |
| **Next.js Production Build** | `npm run build` | **PASS** | Turbopack compile thành công, kiểm tra TypeScript không có lỗi. |
| **Git Diff Boundary** | `git diff --name-only origin/develop` | **PASS** | 100% tệp thay đổi nằm trong 2 thư mục sở hữu của Quốc. |

---

## 6. Hướng Dẫn Tích Hợp Dành Cho Tech Lead (Hiển)

1. **Kết nối `ConversationStream`**:
   Luồng đã tự động nhận diện `message.artifact === "compare"` hoặc `"insight"` để render component mới. Hiển chỉ cần truyền thêm các callback tùy chọn nếu muốn:
   ```tsx
   <ConversationStream
     // Các props cũ giữ nguyên 100%
     activeAgent={activeAgent}
     agents={agents}
     project={activeProject}
     messages={messages}
     sending={sending}
     workPhase={workPhase}
     guide={<AgentGuide agent={activeAgent} onPrompt={pickPrompt} />}
     collaboration={activeGroup ? <CollaborationGroup group={activeGroup} onAgent={chooseAgent} /> : undefined}
     endRef={endRef}
     renderArtifact={(message) => ...}

     // Props mới (tuỳ chọn)
     onSelectPrompt={(prompt) => pickPrompt(prompt)} // Click câu hỏi gợi ý ở màn hình rỗng
     onOpenEvidence={(code) => handleOpenEvidence(code)} // Click nút bằng chứng trong insight
     onRetryMessage={(msgId) => handleRetry(msgId)} // Click nút gửi lại tin nhắn lỗi
   />
   ```
2. **Khung soạn thảo `PromptComposer`**:
   Giữ nguyên toàn bộ props gọi hiện tại. Component đã tự động quản lý khóa submit đồng bộ chống click lặp và bộ gõ IME tiếng Việt ở bên trong.
3. **Gọi Selector Độc Lập**:
   ```tsx
   import { selectCompareData, selectInsightData } from "@/components/results/analysis";

   // Mode derived (mặc định): Khớp 100% số liệu DataResult từ fixture
   const compareData = selectCompareData(projectId, { mode: "derived" });
   const insightData = selectInsightData(projectId, { mode: "derived" });

   // Mode figma_poc: Chuẩn số liệu Figma River Gate (124, 90, 34, 2.1%, 71%, 54%, 8%)
   const pocData = selectCompareData("river-gate", { mode: "figma_poc" });
   ```
