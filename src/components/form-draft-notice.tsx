import type { Locale } from "@/lib/i18n";

const COPY = {
  "en-IN": { saved: "Saved in this tab.", restored: "Your unfinished form has been restored.", resume: "Resume", clear: "Clear draft", files: "Please add your files again." },
  "hi-IN": { saved: "इस टैब में सेव है।", restored: "आपका अधूरा फ़ॉर्म वापस आ गया है।", resume: "जारी रखें", clear: "ड्राफ़्ट हटाएँ", files: "फ़ाइलें फिर से जोड़ें।" },
  "hi-Latn-IN": { saved: "Is tab mein save hai.", restored: "Aapka adhoora form wapas aa gaya hai.", resume: "Jaari rakhein", clear: "Draft hataayein", files: "Files phir se jodein." },
  "kn-IN": { saved: "ಈ ಟ್ಯಾಬ್‌ನಲ್ಲಿ ಸೇವ್ ಆಗಿದೆ.", restored: "ನೀವು ಅರ್ಧ ತುಂಬಿದ್ದ ಫಾರ್ಮ್ ಮತ್ತೆ ಬಂದಿದೆ.", resume: "ಮುಂದುವರಿಸಿ", clear: "ಡ್ರಾಫ್ಟ್ ಅಳಿಸಿ", files: "ದಯವಿಟ್ಟು ನಿಮ್ಮ ಫೈಲ್‌ಗಳನ್ನು ಮತ್ತೆ ಸೇರಿಸಿ." },
  "te-IN": { saved: "ఈ ట్యాబ్‌లో సేవ్ అయింది.", restored: "మీరు పూర్తి చేయని ఫారం తిరిగి వచ్చింది.", resume: "కొనసాగించండి", clear: "డ్రాఫ్ట్ తీసివేయండి", files: "దయచేసి మీ ఫైళ్లను మళ్లీ జోడించండి." },
  "pa-IN": { saved: "ਇਸ ਟੈਬ ਵਿੱਚ ਸੇਵ ਹੈ।", restored: "ਤੁਹਾਡਾ ਅਧੂਰਾ ਫ਼ਾਰਮ ਵਾਪਸ ਆ ਗਿਆ ਹੈ।", resume: "ਜਾਰੀ ਰੱਖੋ", clear: "ਸਾਰਾ ਮਿਟਾਓ", files: "ਫ਼ਾਈਲਾਂ ਦੁਬਾਰਾ ਜੋੜੋ।" },
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
