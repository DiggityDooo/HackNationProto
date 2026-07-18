import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import {
  INITIAL_CHECKLIST,
  SEED_EXTRACTION,
  SEED_HOUSEHOLD,
  type ChecklistItem,
  type ChecklistStatus,
  type ExtractedField,
} from "./realdoor-data";

interface RealDoorState {
  documentName: string;
  documentType: string;
  sizeKb: number;
  pages: number;
  uploadedAt: string;
  ocrEngine: string;
  fields: ExtractedField[];
  checklist: ChecklistItem[];
  householdSize: number;
  cityZip: string;

  setField: (id: string, patch: Partial<ExtractedField>) => void;
  confirmField: (id: string) => void;
  confirmAll: () => void;
  setHouseholdSize: (n: number) => void;
  setChecklistStatus: (id: string, status: ChecklistStatus) => void;
  deleteSession: () => void;
  loadDemoDocument: (fileName?: string) => void;
}

const Ctx = createContext<RealDoorState | null>(null);

export function RealDoorProvider({ children }: { children: ReactNode }) {
  const [documentName, setDocumentName] = useState(SEED_EXTRACTION.documentName);
  const [documentType, setDocumentType] = useState(SEED_EXTRACTION.documentType);
  const [sizeKb, setSizeKb] = useState(SEED_EXTRACTION.sizeKb);
  const [pages] = useState(SEED_EXTRACTION.pages);
  const [uploadedAt, setUploadedAt] = useState(SEED_EXTRACTION.uploadedAt);
  const [ocrEngine] = useState(SEED_EXTRACTION.ocrEngine);
  const [fields, setFields] = useState<ExtractedField[]>(SEED_EXTRACTION.fields);
  const [checklist, setChecklist] = useState<ChecklistItem[]>(INITIAL_CHECKLIST);
  const [householdSize, setHouseholdSize] = useState(SEED_HOUSEHOLD.householdSize);
  const [cityZip] = useState(SEED_HOUSEHOLD.cityZip);

  const value = useMemo<RealDoorState>(
    () => ({
      documentName,
      documentType,
      sizeKb,
      pages,
      uploadedAt,
      ocrEngine,
      fields,
      checklist,
      householdSize,
      cityZip,
      setField: (id, patch) =>
        setFields((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch } : f))),
      confirmField: (id) =>
        setFields((prev) => prev.map((f) => (f.id === id ? { ...f, confirmed: true } : f))),
      confirmAll: () => setFields((prev) => prev.map((f) => ({ ...f, confirmed: true }))),
      setHouseholdSize,
      setChecklistStatus: (id, status) =>
        setChecklist((prev) => prev.map((c) => (c.id === id ? { ...c, status } : c))),
      deleteSession: () => {
        setFields([]);
        setChecklist([]);
        setDocumentName("");
        setDocumentType("");
        setSizeKb(0);
        setUploadedAt("");
      },
      loadDemoDocument: (fileName) => {
        setDocumentName(fileName || SEED_EXTRACTION.documentName);
        setDocumentType(SEED_EXTRACTION.documentType);
        setSizeKb(SEED_EXTRACTION.sizeKb);
        setUploadedAt(new Date().toISOString());
        setFields(SEED_EXTRACTION.fields.map((f) => ({ ...f, confirmed: false })));
        setChecklist(INITIAL_CHECKLIST);
      },
    }),
    [documentName, documentType, sizeKb, pages, uploadedAt, ocrEngine, fields, checklist, householdSize, cityZip],
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
