import test from "node:test";
import assert from "node:assert/strict";
import {
  getAreaMetrics,
  getProjectUnits,
  getSlowMovingUnits,
  projects,
} from "../../../data/mock-real-estate";
import { selectCompareData, selectInsightData } from "./selectors";

/**
 * Script & Unit Test kiểm tra tính nhất quán số liệu:
 * 1. Với cùng một fixture (`data/mock-real-estate.ts`), các số liệu hiển thị ở
 *    CompareResult và InsightResult (qua selector dùng chung) phải khớp 100% với
 *    những gì DataResult nhận được trong `components/chat-workspace.tsx`.
 * 2. Đối chiếu toàn diện giữa:
 *    - DataResult (tính trực tiếp từ fixture thô của repo)
 *    - CompareResult & InsightResult ở chế độ `derived`
 *    - CompareResult & InsightResult ở chế độ `figma_poc` (River Gate trong Figma spec)
 * 3. Tự động phát hiện bất kỳ chỗ nào lệch và báo cáo rõ nguyên nhân gốc rễ.
 */

// Helper hàm tính toán chuẩn của DataResult trong chat-workspace.tsx
function computeDataResultMetrics(projectId: string) {
  const project = projects.find((p) => p.id === projectId) ?? projects[0];
  const rows = getProjectUnits(projectId);
  const slow = getSlowMovingUnits(projectId, 500);
  const metrics = getAreaMetrics(projectId);
  const partial = rows.filter((r) => r.dataQuality === "PARTIAL").length;
  const avgPrice = rows.reduce((sum, r) => sum + r.pricePerSqm, 0) / rows.length;
  const slowCount = rows.filter((r) => r.status === "Đang bán" && r.daysOnMarket > 90).length;

  const focus = [...metrics].sort((a, b) => b.avgDom - a.avgDom)[0];
  const otherMetrics = metrics.filter((m) => m.area !== focus.area);

  const benchmarkAbsorption = otherMetrics.length
    ? otherMetrics.reduce((sum, item, _, source) => sum + item.absorption / source.length, 0)
    : 0;

  const benchmarkDom = otherMetrics.length
    ? Math.round(otherMetrics.reduce((sum, item, _, source) => sum + item.avgDom / source.length, 0))
    : 0;

  const domDifference = focus.avgDom - benchmarkDom;
  const absorptionDifference = Number((focus.absorption - benchmarkAbsorption).toFixed(1));

  // Thống kê căn chậm
  const slowAboveAvgPrice = slow.filter((u) => u.pricePerSqm > avgPrice).length;
  const abovePriceRatio = slow.length ? Math.round((slowAboveAvgPrice / slow.length) * 100) : 0;

  const slowInternalView = slow.filter((u) => u.view === "Nội khu").length;
  const internalViewRatio = slow.length ? Math.round((slowInternalView / slow.length) * 100) : 0;

  const partialRatio = rows.length ? Number(((partial / rows.length) * 100).toFixed(1)) : 0;

  return {
    projectId,
    projectName: project.name,
    snapshot: project.snapshot,
    totalUnits: rows.length,
    slowCount,
    partialCount: partial,
    partialRatio,
    avgPrice: Number(avgPrice.toFixed(1)),
    focusArea: focus.area,
    focusDom: focus.avgDom,
    benchmarkDom,
    domDifference,
    focusAbsorption: focus.absorption,
    benchmarkAbsorption: Number(benchmarkAbsorption.toFixed(1)),
    absorptionDifference,
    focusPricePerSqm: focus.pricePerSqm,
    abovePriceRatio,
    internalViewRatio,
  };
}

test("Test 1: Với fixture Green Avenue, CompareResult (mode derived) khớp 100% với DataResult", () => {
  const dataResult = computeDataResultMetrics("green-avenue");
  const compareResult = selectCompareData("green-avenue", { mode: "derived" });

  console.log("\n--- ĐỐI CHIẾU GREEN AVENUE (DERIVED MODE) ---");
  console.log(`DOM Focus (DataResult vs CompareResult): ${dataResult.focusDom} ngày vs ${compareResult.domProject} ngày`);
  console.log(`DOM Benchmark: ${dataResult.benchmarkDom} ngày vs ${compareResult.domPeerMedian} ngày`);
  console.log(`Chênh lệch DOM: ${dataResult.domDifference} ngày vs ${compareResult.domDiff} ngày`);
  console.log(`Hấp thụ Focus: ${dataResult.focusAbsorption}% vs ${compareResult.absorptionProject}%`);
  console.log(`Hấp thụ Benchmark: ${dataResult.benchmarkAbsorption}% vs ${compareResult.absorptionPeerMedian}%`);

  // 1. Phân khu gốc / Focus
  assert.equal(compareResult.domProject, dataResult.focusDom, "DOM dự án/phân khu gốc phải khớp với DataResult");

  // 2. Trung vị / Benchmark peer
  assert.equal(compareResult.domPeerMedian, dataResult.benchmarkDom, "DOM benchmark phải khớp với DataResult");

  // 3. Ràng buộc toán học: domDiff = domProject - domPeerMedian
  assert.equal(
    compareResult.domDiff,
    compareResult.domProject - compareResult.domPeerMedian,
    "Ràng buộc domDiff = domProject - domPeerMedian phải chính xác tuyệt đối"
  );
  assert.equal(compareResult.domDiff, dataResult.domDifference, "Chênh lệch DOM phải khớp với DataResult");

  // 4. Hấp thụ
  assert.equal(compareResult.absorptionProject, dataResult.focusAbsorption, "Tỷ lệ hấp thụ phải khớp");
  assert.equal(compareResult.absorptionPeerMedian, dataResult.benchmarkAbsorption, "Hấp thụ benchmark phải khớp");

  // 5. Căn gốc được chọn
  assert.ok(compareResult.originUnit, "Phải có căn gốc được chọn");
});

test("Test 2: Với fixture Green Avenue, InsightResult (mode derived) khớp 100% với DataResult", () => {
  const dataResult = computeDataResultMetrics("green-avenue");
  const insightResult = selectInsightData("green-avenue", { mode: "derived" });

  console.log("\n--- INSIGHT RESULT SO VỚI DATARESULT (GREEN AVENUE) ---");
  console.log(`Tỷ lệ trên ngưỡng giá: DataResult ${dataResult.abovePriceRatio}% vs Insight ${insightResult.abovePriceThresholdPercent}%`);
  console.log(`Tỷ lệ view nội khu: DataResult ${dataResult.internalViewRatio}% vs Insight ${insightResult.internalViewPercent}%`);
  console.log(`Tỷ lệ thiếu metadata (PARTIAL): DataResult ${dataResult.partialRatio}% vs Insight ${insightResult.missingMetadataPercent}%`);

  // 1. Tỷ lệ căn chậm có giá > avgPrice
  assert.equal(
    insightResult.abovePriceThresholdPercent,
    dataResult.abovePriceRatio,
    "Tỷ lệ trên ngưỡng giá của InsightResult phải khớp với tính toán từ DataResult"
  );

  // 2. Tỷ lệ view nội khu trong nhóm chậm
  assert.equal(
    insightResult.internalViewPercent,
    dataResult.internalViewRatio,
    "Tỷ lệ view nội khu của InsightResult phải khớp với tính toán từ DataResult"
  );

  // 3. Tỷ lệ thiếu metadata (dữ liệu PARTIAL)
  assert.equal(
    insightResult.missingMetadataPercent,
    Math.round(dataResult.partialRatio),
    "Tỷ lệ thiếu metadata phải khớp với tỷ lệ PARTIAL của DataResult"
  );

  // 4. Giới hạn kết luận luôn hiển thị
  assert.ok(insightResult.limitationTitle, "Tiêu đề giới hạn kết luận phải tồn tại");
  assert.ok(insightResult.limitationText.length > 10, "Nội dung giới hạn kết luận phải đầy đủ");
});

test("Test 3: Kiểm tra tính nhất quán cho cả 3 project trong repo (Green Avenue, Ocean Park 3, Grand Marina)", () => {
  const projectIds = ["green-avenue", "ocean-park", "grand-marina"];

  for (const pid of projectIds) {
    const dataRes = computeDataResultMetrics(pid);
    const compRes = selectCompareData(pid, { mode: "derived" });
    const insRes = selectInsightData(pid, { mode: "derived" });

    // Kiểm tra ràng buộc toán học
    assert.equal(compRes.domProject, dataRes.focusDom);
    assert.equal(compRes.domPeerMedian, dataRes.benchmarkDom);
    assert.equal(compRes.domDiff, compRes.domProject - compRes.domPeerMedian);
    assert.equal(compRes.absorptionProject, dataRes.focusAbsorption);
    assert.equal(compRes.absorptionPeerMedian, dataRes.benchmarkAbsorption);

    // Kiểm tra InsightResult
    assert.equal(insRes.abovePriceThresholdPercent, dataRes.abovePriceRatio);
    assert.equal(insRes.internalViewPercent, dataRes.internalViewRatio);
    assert.equal(insRes.missingMetadataPercent, Math.round(dataRes.partialRatio));
  }
});

test("Test 4: Đối chiếu số liệu Figma POC (River Gate) với Repo Fixture (Green Avenue) và xác nhận độ lệch", () => {
  const pocCompare = selectCompareData("river-gate", { mode: "figma_poc" });
  const pocInsight = selectInsightData("river-gate", { mode: "figma_poc" });
  const repoData = computeDataResultMetrics("green-avenue");

  console.log("\n================ BẢNG ĐỐI CHIẾU: FIGMA POC vs REPO FIXTURE ================");
  console.log("| Chỉ số                        | Figma POC (River Gate) | Repo Fixture (Green Ave) | Chênh lệch (Lệch) |");
  console.log("|-------------------------------|------------------------|--------------------------|-------------------|");
  console.log(`| DOM Dự án/Focus               | ${pocCompare.domProject} ngày               | ${repoData.focusDom} ngày                | ${pocCompare.domProject - repoData.focusDom} ngày           |`);
  console.log(`| DOM Benchmark Peer            | ${pocCompare.domPeerMedian} ngày                | ${repoData.benchmarkDom} ngày                 | ${pocCompare.domPeerMedian - repoData.benchmarkDom} ngày           |`);
  console.log(`| Chênh lệch DOM (Delta)        | ${pocCompare.domDiff} ngày                | ${repoData.domDifference} ngày                 | ${pocCompare.domDiff - repoData.domDifference} ngày           |`);
  console.log(`| Hấp thụ Dự án/Focus           | ${pocCompare.absorptionProject}%                  | ${repoData.focusAbsorption}%                    | ${(pocCompare.absorptionProject - repoData.focusAbsorption).toFixed(1)}%            |`);
  console.log(`| Hấp thụ Benchmark Peer        | ${pocCompare.absorptionPeerMedian}%                  | ${repoData.benchmarkAbsorption}%                    | ${(pocCompare.absorptionPeerMedian - repoData.benchmarkAbsorption).toFixed(1)}%            |`);
  console.log(`| Tỷ lệ trên ngưỡng giá         | ${pocInsight.abovePriceThresholdPercent}%                    | ${repoData.abovePriceRatio}%                     | ${pocInsight.abovePriceThresholdPercent - repoData.abovePriceRatio}%               |`);
  console.log(`| Tỷ lệ view nội khu            | ${pocInsight.internalViewPercent}%                    | ${repoData.internalViewRatio}%                     | ${pocInsight.internalViewPercent - repoData.internalViewRatio}%               |`);
  console.log(`| Tỷ lệ thiếu metadata view     | ${pocInsight.missingMetadataPercent}%                     | ${Math.round(repoData.partialRatio)}%                       | ${pocInsight.missingMetadataPercent - Math.round(repoData.partialRatio)}%                 |`);
  console.log("==========================================================================\n");

  // Ràng buộc nội bộ Figma POC phải tuyệt đối chính xác: 124 - 90 = 34
  assert.equal(pocCompare.domProject, 124);
  assert.equal(pocCompare.domPeerMedian, 90);
  assert.equal(pocCompare.domDiff, 34);
  assert.equal(pocCompare.domDiff, pocCompare.domProject - pocCompare.domPeerMedian);
  assert.equal(pocCompare.absorptionProject, 2.1);
  assert.equal(pocCompare.absorptionPeerMedian, 3.4);
  assert.equal(pocCompare.priceDiffPercent, 6.8);

  // Thẻ Insight Figma POC
  assert.equal(pocInsight.abovePriceThresholdPercent, 71);
  assert.equal(pocInsight.internalViewPercent, 54);
  assert.equal(pocInsight.missingMetadataPercent, 8);
  assert.equal(pocInsight.groundedConclusionCount, 2);

  // Xác nhận phát hiện các điểm lệch có chủ ý giữa Figma POC và Repo Fixture:
  assert.notEqual(pocCompare.domProject, repoData.focusDom, "Lệch DOM dự án: Figma 124 vs Repo 103");
  assert.notEqual(pocCompare.domPeerMedian, repoData.benchmarkDom, "Lệch DOM benchmark: Figma 90 vs Repo 53");
  assert.notEqual(pocCompare.domDiff, repoData.domDifference, "Lệch Delta DOM: Figma 34 vs Repo 50");
  assert.notEqual(pocCompare.absorptionProject, repoData.focusAbsorption, "Lệch thang đo hấp thụ: Figma 2.1% (tháng) vs Repo 55% (tích lũy)");
  assert.notEqual(pocInsight.abovePriceThresholdPercent, repoData.abovePriceRatio, "Lệch tỷ lệ vượt giá: Figma 71% vs Repo 100%");
  assert.notEqual(pocInsight.internalViewPercent, repoData.internalViewRatio, "Lệch tỷ lệ view nội khu: Figma 54% vs Repo 25%");
  assert.notEqual(pocInsight.missingMetadataPercent, Math.round(repoData.partialRatio), "Lệch tỷ lệ metadata thiếu: Figma 8% vs Repo 1%");
});

test("Test 5: Kiểm tra trạng thái không đủ peer (insufficient peers) khi N < 5", () => {
  const result = selectCompareData("green-avenue", { mockInsufficientPeers: true, minPeersRequired: 5 });

  assert.equal(result.peerCount, 2, "Số lượng peer bị giới hạn là 2");
  assert.equal(result.minPeersRequired, 5, "Ngưỡng yêu cầu tối thiểu là 5");
  assert.ok(result.peerCount < result.minPeersRequired, "Phải rơi vào điều kiện không đủ peer");
});

test("Test 6: Kiểm tra trạng thái cảnh báo / độ tin cậy thấp (warning / low confidence)", () => {
  const result = selectInsightData("green-avenue", { mockWarningScenario: true });

  const lowConfidenceInsight = result.insights.find((ins) => ins.confidence === "low");
  assert.ok(lowConfidenceInsight, "Phải có insight độ tin cậy thấp");
  assert.equal(lowConfidenceInsight.confidenceLabel, "Insight · Cảnh báo / Độ tin cậy thấp");
  assert.ok(result.warningNotice, "Phải có thông báo cảnh báo toàn cục");
});
