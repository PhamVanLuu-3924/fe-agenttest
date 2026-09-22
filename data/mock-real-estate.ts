export type PropertyUnit = {
  code: string;
  project: string;
  area: string;
  type: string;
  size: number;
  listPrice: number;
  daysOnMarket: number;
  status: "Đang bán" | "Giữ chỗ" | "Đã bán";
  absorption: number;
};

export const projects = [
  { id: "green-avenue", name: "Green Avenue", city: "Hà Nội", snapshot: "Q2/2026", totalUnits: 1248, dq: 98.7 },
  { id: "ocean-park", name: "Ocean Park 3", city: "Hưng Yên", snapshot: "Q2/2026", totalUnits: 986, dq: 99.1 },
  { id: "grand-marina", name: "Grand Marina", city: "TP. Hồ Chí Minh", snapshot: "Q2/2026", totalUnits: 612, dq: 97.9 },
];

export const propertyUnits: PropertyUnit[] = [
  { code: "GA-RS-1208", project: "Green Avenue", area: "Riverside", type: "2PN", size: 72, listPrice: 6.12, daysOnMarket: 128, status: "Đang bán", absorption: 54.8 },
  { code: "GA-RS-1512", project: "Green Avenue", area: "Riverside", type: "2PN", size: 69, listPrice: 5.93, daysOnMarket: 117, status: "Đang bán", absorption: 56.2 },
  { code: "GA-GD-0806", project: "Green Avenue", area: "Garden", type: "2PN", size: 71, listPrice: 5.46, daysOnMarket: 64, status: "Giữ chỗ", absorption: 69.0 },
  { code: "GA-PK-2103", project: "Green Avenue", area: "Parkside", type: "3PN", size: 96, listPrice: 8.04, daysOnMarket: 48, status: "Đã bán", absorption: 73.5 },
  { code: "GA-RS-0902", project: "Green Avenue", area: "Riverside", type: "2PN", size: 74, listPrice: 6.28, daysOnMarket: 102, status: "Đang bán", absorption: 55.1 },
  { code: "GA-GD-1801", project: "Green Avenue", area: "Garden", type: "3PN", size: 98, listPrice: 7.72, daysOnMarket: 78, status: "Đang bán", absorption: 68.4 },
];

export const conversationHistory = [
  { id: "run-024", title: "Căn bán chậm Green Avenue", detail: "6 agent · Hoàn tất", time: "Hôm nay, 09:32" },
  { id: "run-019", title: "So sánh Riverside và Garden", detail: "3 agent · Hoàn tất", time: "Hôm qua, 16:18" },
  { id: "run-012", title: "Báo cáo hấp thụ tháng 5", detail: "4 agent · Bản nháp", time: "18/06/2026" },
  { id: "run-006", title: "Kiểm tra chất lượng CRM", detail: "1 agent · Có cảnh báo", time: "11/06/2026" },
];

export const agentGuides = {
  orchestrator: {
    purpose: "Điều phối một yêu cầu phân tích hoàn chỉnh qua nhiều agent và trả về kết quả có bằng chứng.",
    needs: "Nêu dự án, khoảng thời gian và câu hỏi kinh doanh bạn cần giải quyết.",
    outputs: ["Kế hoạch xử lý", "Kết quả hợp nhất", "Agent và bằng chứng đã dùng"],
    prompts: [
      "Phân tích căn bán chậm tại Green Avenue trong Q2/2026",
      "Điều tra nguyên nhân hấp thụ thấp của phân khu Riverside",
      "Tạo báo cáo tuần cho Sales Manager",
    ],
  },
  data: {
    purpose: "Tra cứu kho dữ liệu, kiểm tra chất lượng và tính metric định lượng.",
    needs: "Cho biết dự án, phân khu, loại căn, thời gian hoặc mã căn cần kiểm tra.",
    outputs: ["Dataset đã lọc", "Metric chuẩn", "Cảnh báo chất lượng dữ liệu"],
    prompts: [
      "Liệt kê các căn có DOM trên 90 ngày",
      "Kiểm tra dữ liệu thiếu trong snapshot Q2/2026",
      "Tính giá trung bình mỗi m² theo phân khu",
    ],
  },
  compare: {
    purpose: "Tạo nhóm căn tương đồng và so sánh hiệu suất theo rule đã cấu hình.",
    needs: "Chọn căn hoặc phân khu gốc và tiêu chí muốn so sánh.",
    outputs: ["Peer group", "Benchmark", "Mức chênh lệch và xếp hạng"],
    prompts: [
      "So sánh Riverside với các phân khu tương đồng",
      "Tìm 5 căn tương đồng với GA-RS-1208",
      "Xếp hạng tốc độ hấp thụ các phân khu",
    ],
  },
  insight: {
    purpose: "Diễn giải pattern nghiệp vụ từ metric và bằng chứng đã được xác thực.",
    needs: "Chọn insight, metric hoặc kết quả so sánh bạn muốn diễn giải.",
    outputs: ["Nhận định có căn cứ", "Mức tin cậy", "Giới hạn của kết luận"],
    prompts: [
      "Yếu tố nào liên quan tới tốc độ bán chậm?",
      "Giải thích chênh lệch hấp thụ tại Riverside",
      "Insight nào cần Sales Manager chú ý?",
    ],
  },
  chart: {
    purpose: "Biến metric thành biểu đồ và giữ liên kết về dữ liệu nguồn.",
    needs: "Nêu metric, chiều phân tích và dạng biểu đồ mong muốn.",
    outputs: ["Biểu đồ bằng chứng", "ChartSpec", "Liên kết dữ liệu nguồn"],
    prompts: [
      "Vẽ biểu đồ DOM theo phân khu",
      "Trực quan hóa hấp thụ theo loại căn",
      "So sánh giá/m² và DOM của nhóm 2PN",
    ],
  },
  report: {
    purpose: "Tổng hợp metric, insight, biểu đồ và evidence thành báo cáo để review.",
    needs: "Chọn phạm vi báo cáo, đối tượng đọc và các phần cần nhấn mạnh.",
    outputs: ["Bản nháp 6 phần", "Danh mục bằng chứng", "Điểm cần người dùng duyệt"],
    prompts: [
      "Tạo báo cáo Green Avenue Q2 cho Sales Manager",
      "Tóm tắt executive summary trong một trang",
      "Kiểm tra claim nào còn thiếu evidence",
    ],
  },
} as const;
