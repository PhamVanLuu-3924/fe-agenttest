export type PropertyStatus = "Đang bán" | "Giữ chỗ" | "Đã bán";

export type PropertyUnit = {
  code: string;
  projectId: string;
  project: string;
  city: string;
  area: string;
  tower: string;
  floor: number;
  direction: "Đông" | "Tây" | "Nam" | "Bắc";
  view: string;
  type: "Studio" | "1PN" | "2PN" | "3PN";
  size: number;
  listPrice: number;
  pricePerSqm: number;
  daysOnMarket: number;
  status: PropertyStatus;
  absorption: number;
  discountRate: number;
  leads: number;
  bookings: number;
  launchMonth: string;
  dataQuality: "COMPLETE" | "PARTIAL";
};

export type AreaMetric = {
  area: string;
  units: number;
  avgDom: number;
  absorption: number;
  pricePerSqm: number;
  discountRate: number;
  leads: number;
};

export type ProjectSummary = {
  id: string;
  name: string;
  prefix: string;
  city: string;
  snapshot: string;
  totalUnits: number;
  dq: number;
  areas: readonly string[];
};
