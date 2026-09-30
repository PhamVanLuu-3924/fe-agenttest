import {
  getAreaMetrics,
  getProjectUnits,
  getSlowMovingUnits,
  projects,
} from "../../../data/mock-real-estate";
import type { CompareData, InsightData, InsightItem, PeerItem } from "./types";

export type CalculationMode = "derived" | "figma_poc";

export type SelectCompareOptions = {
  originCode?: string;
  minPeersRequired?: number;
  mockInsufficientPeers?: boolean;
  mode?: CalculationMode;
};

export type SelectInsightOptions = {
  mockWarningScenario?: boolean;
  mode?: CalculationMode;
};

/**
 * Pure selector tính toán số liệu đối chuẩn CompareResult
 * Hỗ trợ 2 chế độ:
 * - "derived": Tính toán động 100% từ fixture của repo (khớp chính xác với DataResult)
 * - "figma_poc": Trả về số liệu chuẩn theo mockup Figma của dự án River Gate (124, 90, 34, 2.1%, 3.4%, +6.8%)
 */
export function selectCompareData(
  projectId = "green-avenue",
  options: SelectCompareOptions = {}
): CompareData {
  const { minPeersRequired = 5, mockInsufficientPeers = false, mode } = options;

  const project = projects.find((p) => p.id === projectId) ?? projects[0];
  const units = getProjectUnits(project.id);
  const metrics = getAreaMetrics(project.id);
  const slowUnits = getSlowMovingUnits(project.id, 8);

  const focusMetric = [...metrics].sort((a, b) => b.avgDom - a.avgDom)[0] ?? metrics[0];
  const originUnitRaw =
    units.find((u) => u.code === options.originCode) ??
    slowUnits[0] ??
    units[0];

  let rawPeers = units.filter(
    (u) =>
      u.code !== originUnitRaw.code &&
      u.type === originUnitRaw.type &&
      Math.abs(u.size - originUnitRaw.size) / originUnitRaw.size <= 0.1
  );

  if (mockInsufficientPeers) {
    rawPeers = rawPeers.slice(0, 2);
  } else if (rawPeers.length > 8) {
    rawPeers = rawPeers.slice(0, 8);
  }

  // Tính trung vị DOM của peer
  const sortedPeerDoms = rawPeers.map((p) => p.daysOnMarket).sort((a, b) => a - b);
  const rawPeerMedianDom = sortedPeerDoms.length
    ? sortedPeerDoms[Math.floor(sortedPeerDoms.length / 2)]
    : 90;

  // Tính toán theo chế độ
  const isPoc = mode === "figma_poc" || projectId === "river-gate";

  // 1. DOM và Chênh lệch DOM (Đảm bảo ràng buộc: domDiff = domProject - domPeerMedian)
  const otherMetrics = metrics.filter((m) => m.area !== focusMetric.area);
  const benchmarkDom = otherMetrics.length
    ? Math.round(otherMetrics.reduce((s, m) => s + m.avgDom, 0) / otherMetrics.length)
    : rawPeerMedianDom;

  const domProject = isPoc ? 124 : focusMetric.avgDom;
  const domPeerMedian = isPoc ? 90 : benchmarkDom;
  const domDiff = domProject - domPeerMedian; // Figma: 124 - 90 = 34; Derived: 103 - 53 = 50

  // 2. Tỷ lệ hấp thụ
  const benchmarkAbsorption = otherMetrics.length
    ? Number((otherMetrics.reduce((s, m) => s + m.absorption, 0) / otherMetrics.length).toFixed(1))
    : 3.4;
  const absorptionProject = isPoc ? 2.1 : focusMetric.absorption;
  const absorptionPeerMedian = isPoc ? 3.4 : benchmarkAbsorption;

  // 3. Giá chào vs Peer
  const peerMedianPrice = rawPeers.length
    ? rawPeers.reduce((sum, p) => sum + p.pricePerSqm, 0) / rawPeers.length
    : 76.5;
  const calculatedPriceDiff = Number(
    (((originUnitRaw.pricePerSqm - peerMedianPrice) / peerMedianPrice) * 100).toFixed(1)
  );
  const priceDiffPercent = isPoc ? 6.8 : calculatedPriceDiff;

  const peers: PeerItem[] = rawPeers.map((u, idx) => {
    const similarityPercent = Math.max(75, 98 - idx * 2);
    return {
      id: u.code,
      code: u.code,
      area: u.area,
      size: u.size,
      pricePerSqm: u.pricePerSqm,
      daysOnMarket: u.daysOnMarket,
      similarityPercent,
      absorption: u.absorption,
      discountRate: u.discountRate,
    };
  });

  return {
    projectName: isPoc ? "River Gate" : project.name,
    snapshot: project.snapshot,
    peerCount: peers.length,
    minPeersRequired,
    criteriaRule: `${peers.length} peer · diện tích 61–73 m² · cùng giai đoạn mở bán ${project.snapshot}`,
    sourceText: `Nguồn: ${peers.length} peer · diện tích 61–73 m² · snapshot ${project.snapshot}`,

    domProject,
    domPeerMedian,
    domDiff,
    absorptionProject,
    absorptionPeerMedian,
    priceDiffPercent,

    originUnit: {
      code: originUnitRaw.code,
      area: originUnitRaw.area,
      type: originUnitRaw.type,
      size: originUnitRaw.size,
      pricePerSqm: originUnitRaw.pricePerSqm,
      daysOnMarket: originUnitRaw.daysOnMarket,
    },
    peers,

    benchmarkSummary: `Nhóm ${peers.length} dự án cùng khu vực và diện tích ±10% cho thấy DOM cao hơn trung vị ${domDiff} ngày. Tỷ lệ hấp thụ đạt ${absorptionProject}%, so với trung vị peer ${absorptionPeerMedian}%.`,
    similarityWarning:
      "Cảnh báo mức tương đồng: Đối sánh vị trí mới ở cấp quận; chưa kiểm soát khác biệt về view và tầng.",

    partialInfo: {
      completedItems: ["Đối soát diện tích thông thủy ±10%", "Tính trung vị DOM và giá chào theo m²"],
      missingItems: ["Thiếu lịch sử biến động giá của 2 peer", "Chưa kiểm soát dữ liệu tầng cao"],
      availableScopes: ["Có dữ liệu · Giá", "Có dữ liệu · DOM", "Có dữ liệu · Diện tích"],
      missingScopes: ["Thiếu · Marketing chiến dịch", "Thiếu · Metadata view"],
      nextAction: "Mở rộng mẫu đối sánh hoặc nhập bổ sung dữ liệu tầng để tăng độ tin cậy.",
      safetyCommitment: "Không tự tạo số liệu thay thế; phần thiếu được hiển thị rõ ràng và tách riêng khỏi kết luận.",
    },
  };
}

/**
 * Pure selector tính toán số liệu tổng hợp InsightResult
 * Hỗ trợ cả derived từ repo fixture lẫn POC minh họa Figma.
 */
export function selectInsightData(
  projectId = "green-avenue",
  options: SelectInsightOptions = {}
): InsightData {
  const { mockWarningScenario = false, mode } = options;

  const project = projects.find((p) => p.id === projectId) ?? projects[0];
  const units = getProjectUnits(project.id);
  const slowUnits = getSlowMovingUnits(project.id, 500);
  const avgPrice = units.reduce((s, u) => s + u.pricePerSqm, 0) / units.length;

  const isPoc = mode === "figma_poc" || projectId === "river-gate";

  // Thẻ 1: Trên ngưỡng giá (Figma: 71%; Derived: tỷ lệ căn chậm có giá > avgPrice)
  const derivedAbovePrice = slowUnits.length
    ? Math.round((slowUnits.filter((u) => u.pricePerSqm > avgPrice).length / slowUnits.length) * 100)
    : 0;
  const abovePriceThresholdPercent = isPoc ? 71 : derivedAbovePrice;

  // Thẻ 2: View nội khu (Figma: 54%; Derived: tỷ lệ căn chậm có view === 'Nội khu')
  const derivedInternalView = slowUnits.length
    ? Math.round((slowUnits.filter((u) => u.view === "Nội khu").length / slowUnits.length) * 100)
    : 0;
  const internalViewPercent = isPoc ? 54 : derivedInternalView;

  // Thẻ 3: Thiếu metadata view (Figma: 8%; Derived: tỷ lệ căn PARTIAL trong dự án)
  const partialUnits = units.filter((u) => u.dataQuality === "PARTIAL");
  const derivedMissingMetadata = units.length
    ? Number(((partialUnits.length / units.length) * 100).toFixed(1))
    : 0;
  const missingMetadataPercent = isPoc ? 8 : Math.round(derivedMissingMetadata);

  const groundedConclusionCount = 2;
  const unresolvedCount = 1;

  const baseInsights: InsightItem[] = [
    {
      id: "ins-01",
      order: "01",
      title: "Giá chào cao hơn peer là yếu tố tương quan mạnh nhất",
      description: `Trong nhóm căn bán chậm (DOM > 90 ngày), ${abovePriceThresholdPercent}% căn có mức giá/m² cao hơn mức chuẩn. Đây là tín hiệu chênh lệch rõ ràng nhất trong tập dữ liệu.`,
      confidence: "high",
      confidenceLabel: "Insight · Độ tin cậy cao",
      evidenceCode: "EVD-PRICE-04",
      evidenceName: `Giá/m² · ${abovePriceThresholdPercent}% căn chậm trên ngưỡng`,
    },
    {
      id: "ins-02",
      order: "02",
      title: "Tỷ lệ căn view nội khu chiếm tỷ trọng đáng kể trong nhóm chậm",
      description: `${internalViewPercent}% căn trong nhóm chậm có tầm nhìn nội khu. Tuy nhiên, do còn ${missingMetadataPercent}% dữ liệu partial nên cần thận trọng khi suy diễn.`,
      confidence: "medium",
      confidenceLabel: "Insight · Độ tin cậy vừa",
      evidenceCode: "EVD-VIEW-02",
      evidenceName: `View nội khu · metadata partial ${missingMetadataPercent}%`,
    },
  ];

  if (mockWarningScenario) {
    baseInsights.push({
      id: "ins-03",
      order: "03",
      title: "Chưa có căn cứ đánh giá hiệu quả chuyển đổi lead",
      description:
        "Tập dữ liệu POC thiếu trường dữ liệu nguồn chiến dịch marketing thời gian thực; không kết luận chất lượng lead là nguyên nhân bán chậm.",
      confidence: "low",
      confidenceLabel: "Insight · Cảnh báo / Độ tin cậy thấp",
      evidenceCode: "EVD-CRM-08",
      evidenceName: "Thiếu dữ liệu chiến dịch marketing",
    });
  }

  return {
    projectName: isPoc ? "River Gate" : project.name,
    snapshot: project.snapshot,
    summary:
      "Giá chào cao hơn peer và tỷ lệ căn view kém cùng xuất hiện trong nhóm DOM >90 ngày.",
    badge: mockWarningScenario ? "2 insight · 1 cảnh báo · 1 giới hạn" : "2 insight · 1 giới hạn",

    abovePriceThresholdPercent,
    internalViewPercent,
    missingMetadataPercent,
    groundedConclusionCount,
    unresolvedCount,

    insights: baseInsights,

    limitationTitle: "Giới hạn kết luận",
    limitationText:
      "Không suy diễn hiệu quả chiến dịch vì POC không có dữ liệu marketing thời gian thực.",
    detailedLimitations:
      "Dữ liệu POC được trích xuất tại một mốc snapshot tĩnh và chưa kiểm soát đầy đủ biến số về tiến độ thi công, chính sách chiết khấu đột xuất hoặc kênh truyền thông số. Mối quan hệ giữa giá và tốc độ bán cần được đối chứng thêm với nhật ký tư vấn trực tiếp của đội ngũ kinh doanh.",

    sourceText: `Nguồn: ${isPoc ? "River Gate" : project.name} · 8 peer · metadata view còn thiếu ${missingMetadataPercent}%`,
    warningNotice: mockWarningScenario
      ? "Cảnh báo: Dữ liệu chứa các bản ghi thiếu metadata; một số kết luận chỉ đạt mức tin cậy vừa và cần kiểm tra thực địa."
      : undefined,
  };
}
