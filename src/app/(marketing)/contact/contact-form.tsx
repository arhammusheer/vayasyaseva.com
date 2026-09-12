"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowUpRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
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

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormInput, undefined, ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      details: isAssessment
        ? "Site assessment requested.\nSite: \nRoles: \nHeadcount: \nShift pattern: \nTarget start: "
        : "",
    },
  });

  async function onSubmit(data: ContactFormData) {
    setError(null);
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "x-contact-form-started-at": String(formStartedAt),
      };
      if (honeypot.trim().length > 0) {
        headers["x-contact-form-honeypot"] = honeypot;
      }
      const response = await fetch("/api/contact", {
        method: "POST",
        headers,
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (!response.ok) {
        setError(result.error ?? "Submission failed. Please try again.");
        return;
      }
      setSubmitted(true);
    } catch {
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
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
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

      <div className="grid gap-x-5 gap-y-6 sm:grid-cols-2">
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
