export type PropertyStatus = "Đang bán" | "Giữ chỗ" | "Đã bán";
export type PropertyUnit = {
  code: string; projectId: string; project: string; city: string; area: string; tower: string;
  floor: number; direction: "Đông" | "Tây" | "Nam" | "Bắc"; view: string;
  type: "Studio" | "1PN" | "2PN" | "3PN"; size: number; listPrice: number;
  pricePerSqm: number; daysOnMarket: number; status: PropertyStatus; absorption: number;
  discountRate: number; leads: number; bookings: number; launchMonth: string;
  dataQuality: "COMPLETE" | "PARTIAL";
};

export const projects = [
  { id: "green-avenue", name: "Green Avenue", prefix: "GA", city: "Hà Nội", snapshot: "Q2/2026", totalUnits: 1248, dq: 98.7, areas: ["Riverside", "Garden", "Parkside"] },
  { id: "ocean-park", name: "Ocean Park 3", prefix: "OP", city: "Hưng Yên", snapshot: "Q2/2026", totalUnits: 986, dq: 99.1, areas: ["Vịnh Xanh", "Thời Đại", "Ánh Dương"] },
  { id: "grand-marina", name: "Grand Marina", prefix: "GM", city: "TP. Hồ Chí Minh", snapshot: "Q2/2026", totalUnits: 612, dq: 97.9, areas: ["Lake", "Cove", "Harbour"] },
] as const;

const types: PropertyUnit["type"][] = ["Studio", "1PN", "2PN", "3PN"];
const directions: PropertyUnit["direction"][] = ["Đông", "Nam", "Tây", "Bắc"];
const views = ["Nội khu", "Công viên", "Sông", "Thành phố"];
const areaBias: Record<string, { dom: number; absorption: number; price: number; discount: number }> = {
  Riverside: { dom: 52, absorption: -10, price: 8.6, discount: -1.8 },
  Garden: { dom: 12, absorption: 2, price: 1.4, discount: 0.2 },
  Parkside: { dom: -8, absorption: 7, price: -1.5, discount: 1.1 },
  "Vịnh Xanh": { dom: 20, absorption: -3, price: 4.2, discount: -0.4 },
  "Thời Đại": { dom: 4, absorption: 3, price: 1.1, discount: 0.5 },
  "Ánh Dương": { dom: -9, absorption: 8, price: -2.2, discount: 1.3 },
  Lake: { dom: 28, absorption: -5, price: 7.2, discount: -0.7 },
  Cove: { dom: 8, absorption: 2, price: 2.8, discount: 0.1 },
  Harbour: { dom: -5, absorption: 6, price: -1.2, discount: 0.8 },
};
const projectBase = {
  "green-avenue": { price: 76, absorption: 65, dom: 48 },
  "ocean-park": { price: 64, absorption: 70, dom: 42 },
  "grand-marina": { price: 185, absorption: 61, dom: 58 },
} as const;

/** 2.846 bản ghi mô phỏng, sinh tất định để mọi màn hình dùng cùng một snapshot. */
export const propertyUnits: PropertyUnit[] = projects.flatMap((project) => {
  const base = projectBase[project.id];
  return Array.from({ length: project.totalUnits }, (_, index) => {
    const area = project.areas[index % project.areas.length];
    const bias = areaBias[area];
    const type = types[(index + Math.floor(index / 11)) % types.length];
    const typeSize = { Studio: 36, "1PN": 51, "2PN": 71, "3PN": 98 }[type];
    const size = typeSize + ((index * 7) % 9) - 4;
    const floor = (index % 32) + 2;
    const pricePerSqm = Number((base.price * (1 + (bias.price + ((index % 9) - 4) * 0.55) / 100)).toFixed(1));
    const daysOnMarket = Math.max(8, base.dom + bias.dom + ((index * 13) % 41) - 17);
    const absorption = Number(Math.max(38, Math.min(91, base.absorption + bias.absorption + ((index * 5) % 13) - 6)).toFixed(1));
    const discountRate = Number(Math.max(0.5, 5.2 + bias.discount + ((index * 3) % 11) * 0.22).toFixed(1));
    const leads = 7 + ((index * 11) % 35);
    const bookings = Math.min(leads, Math.max(0, Math.round(leads * absorption / 210)));
    const status: PropertyStatus = daysOnMarket > 90 ? "Đang bán" : index % 5 === 0 ? "Giữ chỗ" : index % 3 === 0 ? "Đã bán" : "Đang bán";
    return {
      code: `${project.prefix}-${area.slice(0, 2).toUpperCase()}-${String(index + 1).padStart(4, "0")}`,
      projectId: project.id, project: project.name, city: project.city, area,
      tower: `${project.prefix}-${String.fromCharCode(65 + (index % 4))}`, floor,
      direction: directions[index % directions.length], view: views[(index + 1) % views.length], type, size,
      listPrice: Number((pricePerSqm * size / 1000).toFixed(2)), pricePerSqm, daysOnMarket, status,
      absorption, discountRate, leads, bookings,
      launchMonth: `2026-${String((index % 6) + 1).padStart(2, "0")}`,
      dataQuality: index % 79 === 0 ? "PARTIAL" : "COMPLETE",
    };
  });
});

export type AreaMetric = { area: string; units: number; avgDom: number; absorption: number; pricePerSqm: number; discountRate: number; leads: number };
export function getProjectUnits(projectId: string) { return propertyUnits.filter((unit) => unit.projectId === projectId); }
export function getAreaMetrics(projectId: string): AreaMetric[] {
  const rows = getProjectUnits(projectId);
  return [...new Set(rows.map((row) => row.area))].map((area) => {
    const units = rows.filter((row) => row.area === area);
    const avg = (key: "daysOnMarket" | "absorption" | "pricePerSqm" | "discountRate") => units.reduce((sum, unit) => sum + unit[key], 0) / units.length;
    return { area, units: units.length, avgDom: Math.round(avg("daysOnMarket")), absorption: Number(avg("absorption").toFixed(1)), pricePerSqm: Number(avg("pricePerSqm").toFixed(1)), discountRate: Number(avg("discountRate").toFixed(1)), leads: units.reduce((sum, unit) => sum + unit.leads, 0) };
  });
}
export function getSlowMovingUnits(projectId: string, limit = 8) {
  return getProjectUnits(projectId).filter((unit) => unit.status === "Đang bán" && unit.daysOnMarket > 90).sort((a, b) => b.daysOnMarket - a.daysOnMarket).slice(0, limit);
}

export const conversationHistory = [
  { id: "run-024", title: "Căn bán chậm Green Avenue", detail: "6 agent · Hoàn tất", time: "Hôm nay, 09:32" },
  { id: "run-019", title: "So sánh Riverside và Garden", detail: "3 agent · Hoàn tất", time: "Hôm qua, 16:18" },
  { id: "run-012", title: "Báo cáo hấp thụ tháng 5", detail: "4 agent · Bản nháp", time: "18/06/2026" },
  { id: "run-006", title: "Kiểm tra chất lượng CRM", detail: "1 agent · Có cảnh báo", time: "11/06/2026" },
];

export const agentGuides = {
  orchestrator: { purpose: "Điều phối một yêu cầu phân tích hoàn chỉnh qua nhiều agent và trả về kết quả có bằng chứng.", needs: "Nêu dự án, khoảng thời gian và câu hỏi kinh doanh bạn cần giải quyết.", outputs: ["Kế hoạch xử lý", "Kết quả hợp nhất", "Agent và bằng chứng đã dùng"], prompts: ["Phân tích căn bán chậm tại Green Avenue trong Q2/2026", "Điều tra nguyên nhân hấp thụ thấp của phân khu Riverside", "Tạo báo cáo tuần cho Sales Manager"] },
  data: { purpose: "Tra cứu kho dữ liệu, kiểm tra chất lượng và tính metric định lượng.", needs: "Cho biết dự án, phân khu, loại căn, thời gian hoặc mã căn cần kiểm tra.", outputs: ["Dataset đã lọc", "Metric chuẩn", "Cảnh báo chất lượng dữ liệu"], prompts: ["Liệt kê các căn có DOM trên 90 ngày", "Kiểm tra dữ liệu thiếu trong snapshot Q2/2026", "Tính giá trung bình mỗi m² theo phân khu"] },
  compare: { purpose: "Tạo nhóm căn tương đồng và so sánh hiệu suất theo rule đã cấu hình.", needs: "Chọn căn hoặc phân khu gốc và tiêu chí muốn so sánh.", outputs: ["Peer group", "Benchmark", "Mức chênh lệch và xếp hạng"], prompts: ["So sánh Riverside với các phân khu tương đồng", "Tìm 5 căn tương đồng với GA-RI-0001", "Xếp hạng tốc độ hấp thụ các phân khu"] },
  insight: { purpose: "Diễn giải pattern nghiệp vụ từ metric và bằng chứng đã được xác thực.", needs: "Chọn insight, metric hoặc kết quả so sánh bạn muốn diễn giải.", outputs: ["Nhận định có căn cứ", "Mức tin cậy", "Giới hạn của kết luận"], prompts: ["Yếu tố nào liên quan tới tốc độ bán chậm?", "Giải thích chênh lệch hấp thụ tại Riverside", "Insight nào cần Sales Manager chú ý?"] },
  chart: { purpose: "Biến metric thành biểu đồ và giữ liên kết về dữ liệu nguồn.", needs: "Nêu metric, chiều phân tích và dạng biểu đồ mong muốn.", outputs: ["Biểu đồ bằng chứng", "ChartSpec", "Liên kết dữ liệu nguồn"], prompts: ["Vẽ biểu đồ DOM theo phân khu", "Trực quan hóa hấp thụ theo loại căn", "So sánh giá/m² và DOM của nhóm 2PN"] },
  report: { purpose: "Tổng hợp metric, insight, biểu đồ và evidence thành báo cáo để review.", needs: "Chọn phạm vi báo cáo, đối tượng đọc và các phần cần nhấn mạnh.", outputs: ["Bản nháp 6 phần", "Danh mục bằng chứng", "Điểm cần người dùng duyệt"], prompts: ["Tạo báo cáo Green Avenue Q2 cho Sales Manager", "Tóm tắt executive summary trong một trang", "Kiểm tra claim nào còn thiếu evidence"] },
} as const;
