import configJson from "./config.json";

export interface DemoConfig {
  metro: string;
  program: "LIHTC";
  ruleYear: "FY2026";
  amiThreshold: 30 | 50 | 60 | 80;
  sourceRelease: string;
  effectiveDate: string;
  sourceUrl: string;
  geography: string;
  datasetAsOf: string;
}

export const DEMO_CONFIG: DemoConfig = configJson as DemoConfig;
