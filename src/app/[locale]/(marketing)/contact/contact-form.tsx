"use client";

import Script from "next/script";
import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowUpRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { trackAnalyticsEvent } from "@/lib/analytics";
import { ENQUIRY_PREFILL_FIELDS, labelledLines, readPrefill } from "@/lib/prefill";
import { TURNSTILE_SCRIPT_URL, TURNSTILE_SITE_KEY } from "@/lib/turnstile";
import {
  contactSchema,
  type ContactFormData,
  type ContactFormInput,
} from "@/lib/contact-contract";

const field =
  "mt-2 h-12 rounded-lg border-neutral-300 bg-background px-4 text-base text-foreground shadow-none placeholder:text-neutral-400 focus-visible:border-gold-500 focus-visible:ring-gold-500/25 md:text-base";

function Field({
  id,
  label,
  optional,
  error,
  children,
  className,
}: {
  id: string;
  label: string;
  optional?: boolean;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <Label htmlFor={id} className="text-sm font-medium">
        {label}
        {optional && (
          <span className="font-normal text-muted-foreground">Optional</span>
        )}
      </Label>
      {children}
      {error && <p className="mt-1.5 text-xs text-destructive">{error}</p>}
    </div>
  );
}

export function ContactForm() {
  const searchParams = useSearchParams();
  const isAssessment = searchParams.get("type") === "assessment";
  const [submitted, setSubmitted] = useState(false);
  const [honeypot, setHoneypot] = useState("");
  const [formStartedAt] = useState(() => Date.now());
  const [error, setError] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const turnstileBox = useRef<HTMLDivElement>(null);
  const turnstileId = useRef<string | null>(null);
  // State as well as the ref: onSubmit runs through handleSubmit, so it must not read refs.
  const [turnstileWidget, setTurnstileWidget] = useState<string | null>(null);
  const trackedStart = useRef(false);
  const formType = isAssessment ? "site_assessment" : "contact";

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormInput, undefined, ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      details: isAssessment
        ? "Site assessment requested.\nSite: \nRoles: \nHeadcount: \nShift pattern: \nTarget start: "
        : "",
    },
  });

  // Prefilled link (#name=…&phone=…&details=…): fields the form shows are
  // filled in; the rest go into the details box so the person sees them.
  useEffect(() => {
    const values = readPrefill(ENQUIRY_PREFILL_FIELDS);
    if (!values) return;
    for (const key of ["name", "phone", "email", "company"] as const) {
      if (values[key]) setValue(key, values[key]);
    }
    const lines = labelledLines(values, {
      role: "My role",
      location: "Site",
      industry: "Industry",
      headcount: "Headcount",
      shifts: "Shifts",
      start: "Target start",
    });
    if (values.details) lines.push(values.details);
    if (lines.length) setValue("details", lines.join("\n"));
    trackAnalyticsEvent("form_prefilled", { form: "contact", fields: Object.keys(values).length });
  }, [setValue]);

  const renderTurnstile = useCallback(() => {
    if (!window.turnstile || !turnstileBox.current || turnstileId.current) return;
    turnstileId.current = window.turnstile.render(turnstileBox.current, {
      sitekey: TURNSTILE_SITE_KEY,
      action: "contact",
      appearance: "interaction-only",
      callback: (token: string) => setTurnstileToken(token),
      "expired-callback": () => setTurnstileToken(null),
      "error-callback": () => setTurnstileToken(null),
    });
    setTurnstileWidget(turnstileId.current);
  }, []);
  useEffect(() => renderTurnstile(), [renderTurnstile]);
  const resetTurnstile = () => {
    setTurnstileToken(null);
    if (window.turnstile && turnstileWidget) window.turnstile.reset(turnstileWidget);
  };

  async function onSubmit(data: ContactFormData) {
    setError(null);
    if (!turnstileToken) {
      trackAnalyticsEvent("contact_form_error", { form_type: formType, reason: "verification" });
      setError("Please wait a moment while we check this browser, then send again.");
      return;
    }
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "x-contact-form-started-at": String(formStartedAt),
        "x-turnstile-token": turnstileToken,
      };
      if (honeypot.trim().length > 0) {
        headers["x-contact-form-honeypot"] = honeypot;
      }
      const response = await fetch("/api/contact", {
        method: "POST",
        headers,
        body: JSON.stringify(data),
      });
      resetTurnstile(); // tokens are single-use
      const result = await response.json();
      if (!response.ok) {
        trackAnalyticsEvent("contact_form_error", {
          form_type: formType,
          reason: response.status === 429 ? "rate_limit" : response.status === 403 ? "verification" : "server",
        });
        setError(result.error ?? "Submission failed. Please try again.");
        return;
      }
      setSubmitted(true);
      trackAnalyticsEvent("generate_lead", {
        form_type: formType,
      });
    } catch {
      // The server may have used the token before the connection dropped.
      resetTurnstile();
      trackAnalyticsEvent("contact_form_error", { form_type: formType, reason: "network" });
      setError("The message could not be sent. Please try again, or call us.");
    }
  }

  if (submitted) {
    return (
      <div role="status" className="border-t pt-8">
        <h2 className="text-3xl font-medium">Received.</h2>
        <p className="mt-3 max-w-md text-muted-foreground leading-relaxed">
          Thank you. Our team will review your message and contact you using
          the details you shared.
        </p>
      </div>
    );
  }

  return (
    <form
      data-clarity-mask="true"
      data-analytics-form="contact"
      onSubmit={handleSubmit(onSubmit, () => {
        trackAnalyticsEvent("contact_form_error", { form_type: formType, reason: "validation" });
      })}
      onFocusCapture={(event) => {
        if (trackedStart.current || !(event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement)) return;
        trackedStart.current = true;
        trackAnalyticsEvent("contact_form_start", { form_type: formType });
      }}
      noValidate
    >
      <Script src={TURNSTILE_SCRIPT_URL} onReady={renderTurnstile} />
      <div
        aria-hidden="true"
        className="absolute -left-[9999px] top-auto h-px w-px overflow-hidden"
      >
        <Label htmlFor="website">Website</Label>
        <Input
          id="website"
          autoComplete="new-password"
          tabIndex={-1}
          value={honeypot}
          onChange={(event) => setHoneypot(event.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 gap-x-5 gap-y-6 sm:grid-cols-2">
        <Field id="name" label="Name" error={errors.name?.message}>
          <Input
            id="name"
            autoComplete="name"
            placeholder="Your name"
            {...register("name")}
            className={cn(field, errors.name && "border-destructive")}
          />
        </Field>
        <Field id="phone" label="Phone" error={errors.phone?.message}>
          <Input
            id="phone"
            type="tel"
            autoComplete="tel"
            placeholder="+91 98765 43210"
            {...register("phone")}
            className={cn(field, "font-data", errors.phone && "border-destructive")}
          />
        </Field>
        <Field id="email" label="Email" optional error={errors.email?.message}>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@company.com"
            {...register("email")}
            className={cn(field, errors.email && "border-destructive")}
          />
        </Field>
        <Field id="company" label="Company" optional error={errors.company?.message}>
          <Input
            id="company"
            autoComplete="organization"
            placeholder="Company name"
            {...register("company")}
            className={cn(field, errors.company && "border-destructive")}
          />
        </Field>
        <Field
          id="details"
          label="What do you need?"
          error={errors.details?.message}
          className="sm:col-span-2"
        >
          <Textarea
            id="details"
            rows={6}
            placeholder="Roles, headcount, shifts, site and timing, as far as you know them."
            {...register("details")}
            className={cn(
              field,
              "h-auto min-h-40 resize-y py-3 leading-relaxed",
              errors.details && "border-destructive",
            )}
          />
        </Field>
      </div>

      <div ref={turnstileBox} className="mt-6" />

      {error && (
        <p role="alert" className="mt-6 text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="mt-8">
        <Button type="submit" size="lg" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Sending
            </>
          ) : (
            <>
              Send message
              <ArrowUpRight className="h-4 w-4" />
            </>
          )}
        </Button>
        <p className="mt-4 text-xs text-muted-foreground">
          Used only to respond to this enquiry.
        </p>
      </div>
    </form>
  );
}
