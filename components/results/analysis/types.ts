import type { ReactNode } from "react";

// ======================== COMPARE TYPES ========================
export type CompareStatus =
  | "normal"
  | "insufficient_peers"
  | "loading"
  | "empty"
  | "failed"
  | "partial";

export type PeerItem = {
  id: string;
  code: string;
  area: string;
  size: number;
  pricePerSqm: number;
  daysOnMarket: number;
  similarityPercent: number;
  absorption?: number;
  discountRate?: number;
};

export type CompareData = {
  projectName: string;
  snapshot: string;
  peerCount: number;
  minPeersRequired: number;
  criteriaRule: string;
  sourceText: string;

  domProject: number;
  domPeerMedian: number;
  domDiff: number;
  absorptionProject: number;
  absorptionPeerMedian: number;
  priceDiffPercent: number;

  originUnit?: {
    code: string;
    area: string;
    type: string;
    size: number;
    pricePerSqm: number;
    daysOnMarket: number;
  };
  peers: PeerItem[];

  benchmarkSummary: string;
  similarityWarning: string;

  partialInfo?: {
    completedItems: string[];
    missingItems: string[];
    availableScopes: string[];
    missingScopes: string[];
    nextAction: string;
    safetyCommitment: string;
  };
};

export type CompareResultProps = {
  data?: CompareData;
  projectId?: string;
  status?: CompareStatus;
  errorMessage?: string;
  chartSlot?: ReactNode;
  children?: ReactNode;
  onViewLimits?: () => void;
  onExpandCriteria?: () => void;
  onRetry?: () => void;
  compact?: boolean;
};

// ======================== INSIGHT TYPES ========================
export type InsightConfidence = "high" | "medium" | "low";

export type InsightItem = {
  id: string;
  order: string; // "01", "02", "03"
  title: string;
  description: string;
  confidence: InsightConfidence;
  confidenceLabel: string; // "Insight · Độ tin cậy cao", "Insight · Độ tin cậy vừa"
  evidenceCode: string; // "EVD-PRICE-04"
  evidenceName: string; // "Giá/m² · 71% căn chậm trên ngưỡng"
};

export type InsightStatus =
  | "normal"
  | "warning"
  | "empty"
  | "failed"
  | "partial"
  | "loading";

export type InsightData = {
  projectName: string;
  snapshot: string;
  summary: string;
  badge: string; // "2 insight · 1 giới hạn"

  abovePriceThresholdPercent: number; // 71%
  internalViewPercent: number; // 54%
  missingMetadataPercent: number; // 8%
  groundedConclusionCount: number; // 2 insight
  unresolvedCount: number; // 1 điểm chưa kết luận

  insights: InsightItem[];

  // Giới hạn kết luận (Luôn hiển thị)
  limitationTitle: string;
  limitationText: string;
  detailedLimitations?: string;

  sourceText: string;
  warningNotice?: string;
};

export type InsightResultProps = {
  data?: InsightData;
  projectId?: string;
  status?: InsightStatus;
  errorMessage?: string;
  chartSlot?: ReactNode;
  children?: ReactNode;
  onOpenEvidence?: (evidenceCode: string) => void;
  onViewLimits?: () => void;
  onRetry?: () => void;
  compact?: boolean;
};
