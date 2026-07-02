import { useState } from "react";
import { CheckCircle2, ShieldQuestion } from "lucide-react";
import { apiPost } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { getConsentFlag, setConsentFlag } from "../../lib/consentFlag";
import { useLanguage } from "../../i18n/LanguageContext";
import { BottomSheet } from "../../components/BottomSheet";
import { Button } from "../../components/ui";
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
      <h1 className="font-serif text-2xl text-navy">{t("navConsent")}</h1>

      <div className="rounded-card border border-navy/15 bg-surface p-5 shadow-soft">
        <div className="mb-4 flex items-center gap-3">
          <span
            className={`grid h-11 w-11 flex-none place-items-center rounded-full ${
              given ? "bg-mint text-mint-deep" : "bg-surface-3 text-ink-muted"
            }`}
          >
            {given ? <CheckCircle2 size={20} strokeWidth={2.25} /> : <ShieldQuestion size={20} strokeWidth={2.25} />}
          </span>
          <p className="text-base font-semibold text-ink">
            {given ? t("consentGiven") : t("consentRequiredTitle")}
          </p>
        </div>
        <p className="mb-4 text-sm text-ink-soft">{t("consentText")}</p>
        {given ? (
          <Button
            type="button"
            variant="outline"
            onClick={() => setSheetMode("withdraw")}
            className="w-full border-urgent text-urgent hover:bg-urgent-bg"
          >
            {t("consentWithdraw")}
          </Button>
        ) : (
          <Button
            type="button"
            onClick={() => setSheetMode("give")}
            className="w-full font-bold uppercase tracking-wide"
          >
            {t("consentGive")}
          </Button>
        )}
      </div>

      <BottomSheet
        open={sheetMode !== null}
        onClose={() => setSheetMode(null)}
        title={sheetMode === "withdraw" ? t("consentWithdraw") : t("consentGive")}
      >
        <p className="mb-4 text-sm text-ink-soft">{t("consentText")}</p>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => setSheetMode(null)} className="flex-1">
            {t("cancelButton")}
          </Button>
          <Button
            type="button"
            variant={sheetMode === "withdraw" ? "destructive" : "primary"}
            loading={busy}
            onClick={sheetMode === "withdraw" ? confirmWithdraw : confirmGive}
            className="flex-1 font-bold uppercase tracking-wide"
          >
            {t("confirmButton")}
          </Button>
        </div>
      </BottomSheet>
    </div>
  );
}
