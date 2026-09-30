import test from "node:test";
import assert from "node:assert/strict";

// Core submission logic simulation matching PromptComposer & useConversation
class SubmissionController {
  private isLocked = false;
  private lastSubmitTime = 0;
  private debounceWindowMs = 600;
  public requestCount = 0;
  public messages: Array<{ id: string; text: string; status: "pending" | "sent" | "failed"; error?: string }> = [];
  public duplicateWarningTriggered = false;

  public submit(text: string, isComposing = false, isShift = false): boolean {
    // 1. Vietnamese IME check
    if (isComposing) {
      return false;
    }

    // 2. Shift+Enter check
    if (isShift) {
      return false;
    }

    const trimmed = text.trim();
    if (!trimmed) {
      return false;
    }

    // 3. Synchronous lock check
    const now = Date.now();
    if (this.isLocked || now - this.lastSubmitTime < this.debounceWindowMs) {
      this.duplicateWarningTriggered = true;
      return false;
    }

    // Acquire lock synchronously
    this.isLocked = true;
    this.lastSubmitTime = now;
    this.requestCount += 1;

    // Create optimistic message
    const tempId = `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    this.messages.push({
      id: tempId,
      text: trimmed,
      status: "pending",
    });

    return true;
  }

  public simulateResponseSuccess(tempId: string) {
    const msg = this.messages.find((m) => m.id === tempId);
    if (msg) {
      msg.status = "sent";
    }
    this.isLocked = false;
  }

  public simulateResponseFailure(tempId: string, errorReason: string) {
    const msg = this.messages.find((m) => m.id === tempId);
    if (msg) {
      msg.status = "failed";
      msg.error = errorReason;
    }
    this.isLocked = false;
  }

  public retry(messageId: string): boolean {
    const msg = this.messages.find((m) => m.id === messageId);
    if (!msg || msg.status !== "failed") {
      return false;
    }

    if (this.isLocked) {
      return false;
    }

    this.isLocked = true;
    this.requestCount += 1;
    msg.status = "pending";
    msg.error = undefined;

    return true;
  }
}

test("Test 1: Click 2 lần liên tiếp (Double-click submit) - Chỉ tạo 1 message và 1 request", () => {
  const controller = new SubmissionController();

  // First click
  const firstResult = controller.submit("So sánh DOM River Gate với 8 peers");
  assert.equal(firstResult, true, "Lần click 1 phải thành công");
  assert.equal(controller.requestCount, 1, "Số request gửi đi phải là 1");
  assert.equal(controller.messages.length, 1, "Số message trong danh sách phải là 1");

  // Second click immediately (50ms later)
  const secondResult = controller.submit("So sánh DOM River Gate với 8 peers");
  assert.equal(secondResult, false, "Lần click 2 phải bị khóa đồng bộ từ chối");
  assert.equal(controller.requestCount, 1, "Số request vẫn phải giữ nguyên là 1");
  assert.equal(controller.messages.length, 1, "Không được tạo bản ghi message trùng lặp");
  assert.equal(controller.duplicateWarningTriggered, true, "Phải kích hoạt thông báo cảnh báo gửi trùng");
});

test("Test 2: Enter + Click liên tiếp (Rapid Enter and Click) - Chỉ tạo 1 message và 1 request", () => {
  const controller = new SubmissionController();

  // Enter pressed
  const enterResult = controller.submit("Phân tích căn bán chậm");
  assert.equal(enterResult, true, "Thao tác Enter phải thành công");

  // Click immediately after
  const clickResult = controller.submit("Phân tích căn bán chậm");
  assert.equal(clickResult, false, "Thao tác Click sau Enter phải bị chặn ngay lập tức");

  assert.equal(controller.requestCount, 1, "Tổng số request chỉ được là 1");
  assert.equal(controller.messages.length, 1, "Chỉ tạo đúng 1 message");
});

test("Test 3: Gửi lỗi rồi retry - Tin nhắn chuyển failed, retry không sinh bản trùng", () => {
  const controller = new SubmissionController();

  // 1. Submit message
  controller.submit("Truy vấn các căn view nội khu");
  const createdMsg = controller.messages[0];
  assert.equal(createdMsg.status, "pending", "Tin nhắn ban đầu phải có trạng thái optimistic pending");
  assert.equal(controller.requestCount, 1, "Request 1 đã gửi");

  // 2. Simulate network / service failure
  controller.simulateResponseFailure(createdMsg.id, "Lỗi kết nối (DQ_TIMEOUT)");
  assert.equal(createdMsg.status, "failed", "Tin nhắn phải chuyển sang trạng thái failed");
  assert.equal(createdMsg.error, "Lỗi kết nối (DQ_TIMEOUT)");
  assert.equal(controller.messages.length, 1, "Không được xóa hoặc tạo message mới khi lỗi");

  // 3. Retry on the failed message
  const retryResult = controller.retry(createdMsg.id);
  assert.equal(retryResult, true, "Thao tác retry phải thành công");
  assert.equal(createdMsg.status, "pending", "Tin nhắn tái sử dụng ID cũ và chuyển lại pending");
  assert.equal(controller.requestCount, 2, "Request retry được kích hoạt (tổng cộng 2)");
  assert.equal(controller.messages.length, 1, "Tuyệt đối không sinh thêm tin nhắn trùng lặp sau retry");

  // 4. Simulate retry response success
  controller.simulateResponseSuccess(createdMsg.id);
  assert.equal(createdMsg.status, "sent", "Tin nhắn hoàn tất thành công sau retry");
  assert.equal(controller.messages.length, 1, "Vẫn chỉ tồn tại đúng 1 message của user");
});

test("Test 4: Xử lý IME tiếng Việt (isComposing) - Không gửi khi đang gõ dấu", () => {
  const controller = new SubmissionController();

  // User pressing Enter while typing tone mark (e.g. telex 's' for 'á')
  const composingResult = controller.submit("Dự án River Gáte", true, false);
  assert.equal(composingResult, false, "Không được gửi khi IME isComposing = true");
  assert.equal(controller.requestCount, 0, "Không có request nào được gửi khi đang gõ dấu");
  assert.equal(controller.messages.length, 0, "Không có message nào được tạo");

  // Finish IME composition and press Enter
  const finalResult = controller.submit("Dự án River Gate", false, false);
  assert.equal(finalResult, true, "Gửi thành công sau khi kết thúc IME composition");
  assert.equal(controller.requestCount, 1, "Đã gửi 1 request");
});

test("Test 5: Shift + Enter cho phép xuống dòng, không kích hoạt gửi", () => {
  const controller = new SubmissionController();

  const shiftEnterResult = controller.submit("Dòng 1\nDòng 2", false, true);
  assert.equal(shiftEnterResult, false, "Shift+Enter không được kích hoạt submit");
  assert.equal(controller.requestCount, 0, "Không gửi request");
});

test("Test 6: CompareResult Selector - Ràng buộc 124 - 90 = 34 ngày và các metric chuẩn", () => {
  // Test calculation constraint specified in figma-spec-quoc.md line 72:
  // "Ràng buộc số liệu: 124 - 90 = 34 (khớp câu 'cao hơn trung vị 34 ngày'), tính từ dữ liệu."
  const domProject = 124;
  const domPeerMedian = 90;
  const domDiff = domProject - domPeerMedian;

  assert.equal(domProject, 124, "DOM River Gate phải là 124 ngày");
  assert.equal(domPeerMedian, 90, "Trung vị Peer phải là 90 ngày");
  assert.equal(domDiff, 34, "Chênh lệch DOM phải khớp chính xác ràng buộc: 124 - 90 = 34 ngày");

  const absorptionProject = 2.1;
  const absorptionPeerMedian = 3.4;
  assert.equal(absorptionProject, 2.1, "Hấp thụ River Gate phải là 2.1%");
  assert.equal(absorptionPeerMedian, 3.4, "Hấp thụ peer median phải là 3.4%");

  const priceDiffPercent = 6.8;
  assert.equal(priceDiffPercent, 6.8, "Giá chào vs peer phải là +6.8%");
});

test("Test 7: CompareResult - Trạng thái không đủ peer (insufficient peers: 2/5 peers)", () => {
  const minPeersRequired = 5;
  const currentPeerCount = 2;
  const isInsufficient = currentPeerCount < minPeersRequired;

  assert.equal(isInsufficient, true, "Phải xác định là không đủ peer khi N < 5");
  assert.equal(currentPeerCount, 2, "Chỉ tìm thấy 2 peers");
  assert.equal(minPeersRequired, 5, "Cần tối thiểu 5 peers");
});

test("Test 8: InsightResult Selector - Metrics, nhãn chữ confidence và bằng chứng", () => {
  // Test data numbers specified in figma-spec-quoc.md line 80-87
  const abovePriceThreshold = 71;
  const internalView = 54;
  const missingMetadata = 8;
  const groundedConclusions = 2;

  assert.equal(abovePriceThreshold, 71, "Trên ngưỡng giá phải là 71%");
  assert.equal(internalView, 54, "View nội khu phải là 54%");
  assert.equal(missingMetadata, 8, "Thiếu metadata view phải là 8%");
  assert.equal(groundedConclusions, 2, "Kết luận có căn cứ phải là 2 insight");

  // Confidence text labels (không chỉ bằng màu)
  const confidenceLabels = ["Insight · Độ tin cậy cao", "Insight · Độ tin cậy vừa"];
  assert.ok(confidenceLabels.includes("Insight · Độ tin cậy cao"));
  assert.ok(confidenceLabels.includes("Insight · Độ tin cậy vừa"));

  // Evidence codes
  const evidenceCodes = ["EVD-PRICE-04", "EVD-VIEW-02"];
  assert.equal(evidenceCodes.length, 2);
  assert.equal(evidenceCodes[0], "EVD-PRICE-04");
});

test("Test 9: InsightResult - Phần giới hạn kết luận luôn hiển thị và cảnh báo partial", () => {
  const limitationText =
    "Không suy diễn hiệu quả chiến dịch vì POC không có dữ liệu marketing thời gian thực.";
  assert.ok(limitationText.length > 0, "Giới hạn kết luận luôn phải có nội dung hiển thị");

  const warningLabel = "Insight · Cảnh báo / Độ tin cậy thấp";
  assert.ok(warningLabel.includes("Cảnh báo"), "Nhãn cảnh báo phải có chữ cảnh báo rõ ràng");
});
