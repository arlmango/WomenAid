import { useRef, useState, type ChangeEvent } from "react";
import { motion } from "framer-motion";
import { Camera, FileImage } from "lucide-react";
import { apiPost, ApiError } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { getConsentFlag, setConsentFlag } from "../../lib/consentFlag";
import { useLanguage } from "../../i18n/LanguageContext";
import { BottomSheet } from "../../components/BottomSheet";
import { TriageMessageCard } from "../../components/TriageMessageCard";
import { Button } from "../../components/ui";
import type { ConsentResponse, UploadResult } from "../../types/api";

export function PatientUpload() {
  const { t } = useLanguage();
  const { session } = useAuth();
  const patientId = session?.patientId;

  const [consentSheetOpen, setConsentSheetOpen] = useState(false);
  const [consenting, setConsenting] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  // No "raw_score"/"confidence" field exists on this type — see types/api.ts.
  const [result, setResult] = useState<UploadResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handlePickFile() {
    if (!getConsentFlag()) {
      setConsentSheetOpen(true);
      return;
    }
    fileInputRef.current?.click();
  }

  async function handleGiveConsent() {
    if (!patientId) return;
    setConsenting(true);
    try {
      await apiPost<ConsentResponse>(`/api/monitoring/patients/${patientId}/consent`, {
        consent_text_version: "v1.0",
        consent_text_snapshot: t("consentText"),
      });
      setConsentFlag(true);
      setConsentSheetOpen(false);
      fileInputRef.current?.click();
    } catch {
      // apiPost already toasted the error.
    } finally {
      setConsenting(false);
    }
  }

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    setFile(e.target.files?.[0] ?? null);
    setResult(null);
  }

  async function handleSubmit() {
    if (!file || !patientId) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const data = await apiPost<UploadResult>(
        `/api/risk-assessment/upload/${patientId}`,
        form,
      );
      setResult(data);
      setFile(null);
    } catch (err) {
      // A consent 403 means it was withdrawn server-side since our last
      // check — re-sync the local flag and reopen the gate instead of
      // leaving the user stuck behind a generic error toast.
      if (err instanceof ApiError && err.status === 403) {
        setConsentFlag(false);
        setConsentSheetOpen(true);
      }
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="font-serif text-2xl text-navy">{t("uploadTitle")}</h1>

      <div className="rounded-card border border-navy/15 bg-surface p-5 shadow-soft">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleFileChange}
        />

        {!file && !result && (
          <button
            type="button"
            onClick={handlePickFile}
            className="flex w-full flex-col items-center gap-2.5 rounded-card border-2 border-dashed border-pink/50 bg-rose-bg/40 px-5 py-8 text-center transition-colors hover:bg-rose-bg/70"
          >
            <span className="grid h-12 w-12 place-items-center rounded-full bg-gradient-to-br from-pink to-magenta text-white shadow-btn">
              <Camera size={22} strokeWidth={2.25} />
            </span>
            <span className="font-bold uppercase tracking-wide text-rose-deep">{t("uploadButton")}</span>
          </button>
        )}

        {file && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
            <div className="flex items-center gap-2.5 rounded-input border border-navy/15 bg-surface-2 px-3.5 py-2.5">
              <FileImage size={18} className="flex-none text-rose-deep" />
              <p className="truncate text-sm text-ink-soft">{file.name}</p>
            </div>
            <Button
              type="button"
              loading={uploading}
              onClick={handleSubmit}
              className="w-full font-bold uppercase tracking-wide"
            >
              {uploading ? t("uploadSubmitBusy") : t("uploadSubmit")}
            </Button>
          </motion.div>
        )}

        {result && <TriageMessageCard result={result} />}
      </div>

      <BottomSheet
        open={consentSheetOpen}
        onClose={() => setConsentSheetOpen(false)}
        title={t("consentRequiredTitle")}
      >
        <p className="mb-4 text-sm text-ink-soft">{t("consentText")}</p>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => setConsentSheetOpen(false)} className="flex-1">
            {t("cancelButton")}
          </Button>
          <Button
            type="button"
            loading={consenting}
            onClick={handleGiveConsent}
            className="flex-1 font-bold uppercase tracking-wide"
          >
            {t("consentGive")}
          </Button>
        </div>
      </BottomSheet>
    </div>
  );
}
