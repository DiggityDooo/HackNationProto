import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  SCENARIOS,
  FROZEN,
  type ChecklistItem,
  type ChecklistStatus,
  type ExtractedField,
  type Scenario,
  type ScenarioId,
} from "./realdoor-data";

export type Stage = "discover" | "profile" | "understand" | "prepare";
export const STAGES: Stage[] = ["discover", "profile", "understand", "prepare"];

export interface ActivityEntry {
  ts: string;
  stage: Stage | "welcome" | "privacy" | "transparency";
  action: string;
  // Never store raw document contents. Only metadata / action labels.
  meta?: Record<string, string | number>;
}

interface State {
  // Session
  consented: boolean;
  activeScenarioId: ScenarioId | null;

  // Document / extraction (mutable copies of the scenario seed)
  documentName: string;
  documentType: string;
  sizeKb: number;
  pages: number;
  uploadedAt: string;
  ocrEngine: string;
  documentDate: string;
  evidenceSnippet: string;
  fields: ExtractedField[];

  // Household
  householdSize: number;
  cityZip: string;
  applicantName: string;

  // Checklist
  checklist: ChecklistItem[];

  // Discover filter
  municipalityFilter: string; // "" = all

  // UI
  theme: "light" | "dark";
  copilotOpen: boolean;
  stagesVisited: Set<Stage>;

  // Activity log (redacted)
  activity: ActivityEntry[];
}

interface API extends State {
  giveConsent: () => void;
  loadScenario: (id: ScenarioId) => void;
  loadDemoDocument: (fileName?: string) => void;

  setField: (id: string, patch: Partial<ExtractedField>) => void;
  confirmField: (id: string) => void;
  confirmAll: () => void;

  setHouseholdSize: (n: number) => void;
  setMunicipalityFilter: (s: string) => void;

  setChecklistStatus: (id: string, status: ChecklistStatus) => void;
  toggleChecklistIncluded: (id: string) => void;

  visitStage: (s: Stage) => void;
  setCopilotOpen: (b: boolean) => void;
  toggleTheme: () => void;

  logActivity: (a: Omit<ActivityEntry, "ts">) => void;

  deleteSession: () => void;
}

const Ctx = createContext<API | null>(null);

const EMPTY: Pick<
  State,
  | "documentName"
  | "documentType"
  | "sizeKb"
  | "pages"
  | "uploadedAt"
  | "ocrEngine"
  | "documentDate"
  | "evidenceSnippet"
  | "fields"
  | "checklist"
  | "householdSize"
  | "cityZip"
  | "applicantName"
> = {
  documentName: "",
  documentType: "",
  sizeKb: 0,
  pages: 0,
  uploadedAt: "",
  ocrEngine: "",
  documentDate: "",
  evidenceSnippet: "",
  fields: [],
  checklist: [],
  householdSize: 1,
  cityZip: "",
  applicantName: "",
};

export function RealDoorProvider({ children }: { children: ReactNode }) {
  const [consented, setConsented] = useState(false);
  const [activeScenarioId, setActiveScenarioId] = useState<ScenarioId | null>(null);

  const [documentName, setDocumentName] = useState("");
  const [documentType, setDocumentType] = useState("");
  const [sizeKb, setSizeKb] = useState(0);
  const [pages, setPages] = useState(0);
  const [uploadedAt, setUploadedAt] = useState("");
  const [ocrEngine, setOcrEngine] = useState("");
  const [documentDate, setDocumentDate] = useState("");
  const [evidenceSnippet, setEvidenceSnippet] = useState("");
  const [fields, setFields] = useState<ExtractedField[]>([]);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [householdSize, setHouseholdSize] = useState(1);
  const [cityZip, setCityZip] = useState("");
  const [applicantName, setApplicantName] = useState("");
  const [municipalityFilter, setMunicipalityFilter] = useState("");

  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [copilotOpen, setCopilotOpen] = useState(false);
  const [stagesVisited, setStagesVisited] = useState<Set<Stage>>(new Set());
  const [activity, setActivity] = useState<ActivityEntry[]>([]);

  // Theme follows OS preference at first paint
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = (dark: boolean) => {
      setTheme(dark ? "dark" : "light");
      document.documentElement.classList.toggle("dark", dark);
    };
    apply(mq.matches);
    const on = (e: MediaQueryListEvent) => apply(e.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);

  const logActivity = useCallback((a: Omit<ActivityEntry, "ts">) => {
    setActivity((prev) => [{ ...a, ts: new Date().toISOString() }, ...prev].slice(0, 100));
  }, []);

  const applyScenario = useCallback((s: Scenario, uploadedIso?: string) => {
    setActiveScenarioId(s.id);
    setDocumentName(s.documentName);
    setDocumentType(s.documentType);
    setSizeKb(s.sizeKb);
    setPages(s.pages);
    setUploadedAt(uploadedIso ?? new Date().toISOString());
    setOcrEngine(s.ocrEngine);
    setDocumentDate(s.documentDate);
    setEvidenceSnippet(s.evidenceSnippet);
    setFields(s.fields.map((f) => ({ ...f, confirmed: false })));
    setChecklist(s.checklist.map((c) => ({ ...c })));
    setHouseholdSize(s.householdSize);
    setCityZip(s.cityZip);
    setApplicantName(s.applicantName);
  }, []);

  const loadScenario = useCallback((id: ScenarioId) => {
    const s = SCENARIOS[id];
    applyScenario(s);
    logActivity({ stage: "profile", action: "scenario_loaded", meta: { id } });
  }, [applyScenario, logActivity]);

  const loadDemoDocument = useCallback((fileName?: string) => {
    // Default demo = HH-003
    const s = SCENARIOS["HH-003"];
    applyScenario({ ...s, documentName: fileName || s.documentName });
    logActivity({ stage: "profile", action: "demo_document_loaded", meta: { name: fileName || s.documentName } });
  }, [applyScenario, logActivity]);

  const value = useMemo<API>(
    () => ({
      consented,
      activeScenarioId,
      documentName,
      documentType,
      sizeKb,
      pages,
      uploadedAt,
      ocrEngine,
      documentDate,
      evidenceSnippet,
      fields,
      householdSize,
      cityZip,
      applicantName,
      checklist,
      municipalityFilter,
      theme,
      copilotOpen,
      stagesVisited,
      activity,

      giveConsent: () => {
        setConsented(true);
        logActivity({ stage: "welcome", action: "consent_given" });
      },
      loadScenario,
      loadDemoDocument,

      setField: (id, patch) =>
        setFields((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch } : f))),
      confirmField: (id) => {
        setFields((prev) => prev.map((f) => (f.id === id ? { ...f, confirmed: true } : f)));
        logActivity({ stage: "profile", action: "field_confirmed", meta: { id } });
      },
      confirmAll: () => {
        setFields((prev) => prev.map((f) => ({ ...f, confirmed: true })));
        logActivity({ stage: "profile", action: "all_fields_confirmed" });
      },

      setHouseholdSize: (n) => {
        setHouseholdSize(n);
        logActivity({ stage: "profile", action: "household_size_set", meta: { n } });
      },
      setMunicipalityFilter,

      setChecklistStatus: (id, status) =>
        setChecklist((prev) => prev.map((c) => (c.id === id ? { ...c, status } : c))),
      toggleChecklistIncluded: (id) =>
        setChecklist((prev) => prev.map((c) => (c.id === id ? { ...c, includedInPacket: !c.includedInPacket } : c))),

      visitStage: (s) => setStagesVisited((prev) => {
        if (prev.has(s)) return prev;
        const next = new Set(prev);
        next.add(s);
        return next;
      }),
      setCopilotOpen,
      toggleTheme: () => {
        setTheme((t) => {
          const next = t === "light" ? "dark" : "light";
          document.documentElement.classList.toggle("dark", next === "dark");
          return next;
        });
      },

      logActivity,

      deleteSession: () => {
        setConsented(false);
        setActiveScenarioId(null);
        setDocumentName(EMPTY.documentName);
        setDocumentType(EMPTY.documentType);
        setSizeKb(EMPTY.sizeKb);
        setPages(EMPTY.pages);
        setUploadedAt(EMPTY.uploadedAt);
        setOcrEngine(EMPTY.ocrEngine);
        setDocumentDate(EMPTY.documentDate);
        setEvidenceSnippet(EMPTY.evidenceSnippet);
        setFields([]);
        setChecklist([]);
        setHouseholdSize(1);
        setCityZip("");
        setApplicantName("");
        setMunicipalityFilter("");
        setStagesVisited(new Set());
        setActivity([{ ts: new Date().toISOString(), stage: "privacy", action: "session_deleted" }]);
      },
    }),
    [consented, activeScenarioId, documentName, documentType, sizeKb, pages, uploadedAt, ocrEngine, documentDate, evidenceSnippet, fields, householdSize, cityZip, applicantName, checklist, municipalityFilter, theme, copilotOpen, stagesVisited, activity, applyScenario, loadScenario, loadDemoDocument, logActivity],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useRealDoor() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useRealDoor must be used inside RealDoorProvider");
  return v;
}

export function parseCurrency(v: string): number {
  const n = Number(v.replace(/[^0-9.\-]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

export function confirmedAnnualIncome(fields: ExtractedField[]): number | null {
  const ann = fields.find((f) => f.id === "annualized");
  if (!ann || !ann.confirmed) return null;
  return parseCurrency(ann.value);
}

export function daysBetween(a: string, b: string): number {
  const da = new Date(a);
  const db = new Date(b);
  return Math.round((db.getTime() - da.getTime()) / 86_400_000);
}

export function isEvidenceExpired(documentDate: string): boolean {
  if (!documentDate) return false;
  return daysBetween(documentDate, FROZEN.simulationDate) > FROZEN.evidenceCurrencyDays;
}
