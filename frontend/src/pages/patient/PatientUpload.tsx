import { useRef, useState, type ChangeEvent } from "react";
import { motion } from "framer-motion";
import { apiPost, ApiError } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { getConsentFlag, setConsentFlag } from "../../lib/consentFlag";
import { useLanguage } from "../../i18n/LanguageContext";
import { BottomSheet } from "../../components/BottomSheet";
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
      <h1 className="font-serif text-xl text-ink">{t("uploadTitle")}</h1>

      <div className="rounded-card border border-line bg-surface p-5">
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
            className="flex min-h-11 w-full items-center justify-center gap-2 rounded-btn bg-gradient-to-br from-rose to-blush px-5 font-semibold text-white shadow-btn hover:shadow-btn-hover"
          >
            📷 {t("uploadButton")}
          </button>
        )}

        {file && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
            <p className="truncate text-sm text-ink-soft">{file.name}</p>
            <button
              type="button"
              disabled={uploading}
              onClick={handleSubmit}
              className="flex min-h-11 w-full items-center justify-center rounded-btn bg-gradient-to-br from-rose to-blush px-5 font-semibold text-white shadow-btn disabled:from-rose-pale disabled:to-rose-pale disabled:shadow-none"
            >
              {uploading ? "…" : t("uploadSubmit")}
            </button>
          </motion.div>
        )}

        {result && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            <h2 className="font-serif text-lg text-ink">{t("uploadResultTitle")}</h2>
            <span className="inline-flex items-center rounded-full bg-rose-bg px-2.5 py-1 text-xs font-semibold text-rose-deep">
              {result.triage_label}
            </span>
            <div className="rounded-input border-l-3 border-rose-pale bg-surface-2 p-3 text-sm text-ink">
              {result.patient_facing_message}
            </div>
            <p className="text-xs leading-relaxed text-ink-soft">{result.disclaimer}</p>
          </motion.div>
        )}
      </div>

      <BottomSheet
        open={consentSheetOpen}
        onClose={() => setConsentSheetOpen(false)}
        title={t("consentRequiredTitle")}
      >
        <p className="mb-4 text-sm text-ink-soft">{t("consentText")}</p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setConsentSheetOpen(false)}
            className="min-h-11 flex-1 rounded-btn border border-line text-sm font-semibold text-ink-soft"
          >
            {t("cancelButton")}
          </button>
          <button
            type="button"
            disabled={consenting}
            onClick={handleGiveConsent}
            className="min-h-11 flex-1 rounded-btn bg-gradient-to-br from-rose to-blush text-sm font-semibold text-white shadow-btn disabled:from-rose-pale disabled:to-rose-pale"
          >
            {t("consentGive")}
          </button>
        </div>
      </BottomSheet>
    </div>
  );
}
