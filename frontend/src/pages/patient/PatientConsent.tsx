import { useState } from "react";
import { CheckCircle2, ShieldQuestion } from "lucide-react";
import { apiPost } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { getConsentFlag, setConsentFlag } from "../../lib/consentFlag";
import { useLanguage } from "../../i18n/LanguageContext";
import { BottomSheet } from "../../components/BottomSheet";
import { toast } from "../../lib/toast";
import type { ConsentResponse } from "../../types/api";

export function PatientConsent() {
  const { t } = useLanguage();
  const { session } = useAuth();
  const patientId = session?.patientId;

  const [given, setGiven] = useState(getConsentFlag());
  const [sheetMode, setSheetMode] = useState<"give" | "withdraw" | null>(null);
  const [busy, setBusy] = useState(false);

  async function confirmGive() {
    if (!patientId) return;
    setBusy(true);
    try {
      await apiPost<ConsentResponse>(`/api/monitoring/patients/${patientId}/consent`, {
        consent_text_version: "v1.0",
        consent_text_snapshot: t("consentText"),
      });
      setConsentFlag(true);
      setGiven(true);
      setSheetMode(null);
      toast.success(t("consentGiven"));
    } catch {
      // apiPost already toasted the error.
    } finally {
      setBusy(false);
    }
  }

  async function confirmWithdraw() {
    if (!patientId) return;
    setBusy(true);
    try {
      await apiPost<ConsentResponse>(`/api/monitoring/patients/${patientId}/consent/withdraw`);
      setConsentFlag(false);
      setGiven(false);
      setSheetMode(null);
      toast.success(t("consentWithdrawn"));
    } catch {
      // apiPost already toasted the error.
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="font-serif text-xl text-ink">{t("navConsent")}</h1>

      <div className="rounded-card border border-white/60 bg-white/80 p-5 shadow-soft backdrop-blur-sm">
        <div className="mb-4 flex items-center gap-3">
          <span
            className={`grid h-11 w-11 flex-none place-items-center rounded-full ${
              given ? "bg-mint-bg text-[#2a7055]" : "bg-surface-3 text-ink-muted"
            }`}
          >
            {given ? <CheckCircle2 size={20} strokeWidth={2.25} /> : <ShieldQuestion size={20} strokeWidth={2.25} />}
          </span>
          <p className="text-sm font-semibold text-ink">
            {given ? t("consentGiven") : t("consentRequiredTitle")}
          </p>
        </div>
        <p className="mb-4 text-sm text-ink-soft">{t("consentText")}</p>
        {given ? (
          <button
            type="button"
            onClick={() => setSheetMode("withdraw")}
            className="min-h-11 w-full rounded-btn border border-urgent px-5 text-sm font-semibold text-urgent"
          >
            {t("consentWithdraw")}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setSheetMode("give")}
            className="min-h-11 w-full rounded-btn bg-gradient-to-br from-rose to-blush px-5 text-sm font-semibold text-white shadow-btn"
          >
            {t("consentGive")}
          </button>
        )}
      </div>

      <BottomSheet
        open={sheetMode !== null}
        onClose={() => setSheetMode(null)}
        title={sheetMode === "withdraw" ? t("consentWithdraw") : t("consentGive")}
      >
        <p className="mb-4 text-sm text-ink-soft">{t("consentText")}</p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setSheetMode(null)}
            className="min-h-11 flex-1 rounded-btn border border-line text-sm font-semibold text-ink-soft"
          >
            {t("cancelButton")}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={sheetMode === "withdraw" ? confirmWithdraw : confirmGive}
            className={`min-h-11 flex-1 rounded-btn text-sm font-semibold text-white shadow-btn disabled:shadow-none ${
              sheetMode === "withdraw"
                ? "bg-urgent disabled:bg-urgent-bg"
                : "bg-gradient-to-br from-rose to-blush disabled:from-rose-pale disabled:to-rose-pale"
            }`}
          >
            {t("confirmButton")}
          </button>
        </div>
      </BottomSheet>
    </div>
  );
}
