import type { Locale } from "@/lib/i18n";

const COPY = {
  "en-IN": { saved: "Saved in this tab.", restored: "Your unfinished form has been restored.", resume: "Resume", clear: "Clear draft", files: "Please add your files again." },
  "hi-IN": { saved: "इस टैब में सेव है।", restored: "आपका अधूरा फ़ॉर्म वापस आ गया है।", resume: "जारी रखें", clear: "ड्राफ़्ट हटाएँ", files: "फ़ाइलें फिर से जोड़ें।" },
  "hi-Latn-IN": { saved: "Is tab mein save hai.", restored: "Aapka adhoora form wapas aa gaya hai.", resume: "Jaari rakhein", clear: "Draft hataayein", files: "Files phir se jodein." },
};

export function FormDraftNotice({ locale = "en-IN", restored, missingFiles = false, disabled = false, onResume, onClear }: {
  locale?: Locale; restored: boolean; missingFiles?: boolean; disabled?: boolean;
  onResume: () => void; onClear: () => void;
}) {
  const t = COPY[locale];
  return (
    <div className="mb-6 border-y py-3 text-sm text-muted-foreground" data-draft-notice>
      <p role="status">{restored ? t.restored : t.saved}</p>
      {missingFiles && <p className="mt-1">{t.files}</p>}
      <div className="flex flex-wrap gap-x-6">
        {restored && <button type="button" className="text-link mt-1 min-h-11" disabled={disabled} onClick={onResume}>{t.resume}</button>}
        <button type="button" className="text-link mt-1 min-h-11" disabled={disabled} onClick={onClear}>{t.clear}</button>
      </div>
    </div>
  );
}
