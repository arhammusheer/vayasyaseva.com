"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  contactSchema,
  type ContactFormData,
  type ContactFormInput,
} from "@/lib/contact-contract";

const industryOptions = [
  "Manufacturing",
  "Warehousing & Logistics",
  "FMCG / Consumer Operations",
  "Housekeeping & Facility Operations",
  "Civil Works",
  "Fabrication Works",
  "Machinery Maintenance",
  "Equipment Provisioning",
  "Hospitality",
  "Other",
];

const fieldClassName =
  "mt-1.5 h-11 border-neutral-300 bg-background text-foreground placeholder:text-neutral-500 shadow-none focus-visible:border-seva-500 focus-visible:ring-seva/15";

const textAreaClassName =
  "mt-1.5 border-neutral-300 bg-background text-foreground placeholder:text-neutral-500 shadow-none focus-visible:border-seva-500 focus-visible:ring-seva/15";

const selectTriggerClassName =
  "mt-1.5 h-11 w-full border-neutral-300 bg-background text-foreground shadow-none data-[placeholder]:text-neutral-500 focus-visible:border-seva-500 focus-visible:ring-seva/15";

export function ContactForm() {
  const searchParams = useSearchParams();
  const isAssessment = searchParams.get("type") === "assessment";
  const [submitted, setSubmitted] = useState(false);
  const [honeypot, setHoneypot] = useState("");
  const [formStartedAt] = useState(() => Date.now());
  const [selectedIndustry, setSelectedIndustry] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormInput, undefined, ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      details: isAssessment
        ? "Requirement review requested for workforce deployment, housekeeping, warehouses and logistics, civil and fabrication works, machinery maintenance, or equipment and material support."
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
      setError(
        "Submission could not be completed. Please try again or contact Vayasya Seva operations at help@vayasyaseva.com."
      );
    }
  }

  if (submitted) {
    return (
      <div
        role="status"
        className="flex flex-col items-center justify-center py-12 text-center"
      >
        <CheckCircle2 className="h-12 w-12 text-success" />
        <h3 className="mt-4 text-xl font-semibold">Requirement Received</h3>
        <p className="mt-2 max-w-sm text-muted-foreground">
          Current status: received. Owner: Vayasya Seva operations. Target next
          update: within 2 business days (IST, Mon-Sat).
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-5">
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

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="name">
            Full Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="name"
            placeholder="Your name"
            {...register("name")}
            className={fieldClassName}
          />
          {errors.name && (
            <p className="mt-1 text-xs text-destructive">{errors.name.message}</p>
          )}
        </div>
        <div>
          <Label htmlFor="phone">
            Phone <span className="text-destructive">*</span>
          </Label>
          <Input
            id="phone"
            type="tel"
            placeholder="+91 XXXXX XXXXX"
            {...register("phone")}
            className={fieldClassName}
          />
          {errors.phone && (
            <p className="mt-1 text-xs text-destructive">{errors.phone.message}</p>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="company">Company</Label>
          <Input
            id="company"
            placeholder="Company name"
            {...register("company")}
            className={fieldClassName}
          />
          {errors.company && (
            <p className="mt-1 text-xs text-destructive">{errors.company.message}</p>
          )}
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@company.com"
            {...register("email")}
            className={fieldClassName}
          />
          {errors.email && (
            <p className="mt-1 text-xs text-destructive">{errors.email.message}</p>
          )}
        </div>
      </div>

      <div>
        <Label htmlFor="details">
          Requirement Details <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id="details"
          placeholder="State service area, site location, headcount, and target timing if known."
          rows={5}
          {...register("details")}
          className={textAreaClassName}
        />
        {errors.details && (
          <p className="mt-1 text-xs text-destructive">{errors.details.message}</p>
        )}
      </div>

      <details className="rounded-xl border border-neutral-300 bg-neutral-25 p-4">
        <summary className="cursor-pointer list-none text-sm font-medium text-neutral-900">
          Add Site and Scope Details
        </summary>
        <p className="mt-2 text-sm text-neutral-700">
          Use this section for service area, site context, timing, and
          operating details.
        </p>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="role">Your Role</Label>
            <Input
              id="role"
              placeholder="e.g. Warehouse Manager"
              {...register("role")}
              className={fieldClassName}
            />
            {errors.role && (
              <p className="mt-1 text-xs text-destructive">{errors.role.message}</p>
            )}
          </div>
          <div>
            <Label htmlFor="location">Site Location</Label>
            <Input
              id="location"
              placeholder="City / industrial area"
              {...register("location")}
              className={fieldClassName}
            />
            {errors.location && (
              <p className="mt-1 text-xs text-destructive">{errors.location.message}</p>
            )}
          </div>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="industry">Industry</Label>
            <input type="hidden" {...register("industry")} />
            <Select
              value={
                selectedIndustry && selectedIndustry.length > 0
                  ? selectedIndustry
                  : undefined
              }
              onValueChange={(value) => {
                setSelectedIndustry(value);
                setValue("industry", value, {
                  shouldDirty: true,
                  shouldTouch: true,
                  shouldValidate: true,
                });
              }}
            >
              <SelectTrigger className={selectTriggerClassName}>
                <SelectValue placeholder="Select industry" />
              </SelectTrigger>
              <SelectContent>
                {industryOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.industry && (
              <p className="mt-1 text-xs text-destructive">{errors.industry.message}</p>
            )}
          </div>
          <div>
            <Label htmlFor="headcount">Approx. Headcount</Label>
            <Input
              id="headcount"
              placeholder="e.g. 50"
              {...register("headcount")}
              className={fieldClassName}
            />
            {errors.headcount && (
              <p className="mt-1 text-xs text-destructive">{errors.headcount.message}</p>
            )}
          </div>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="shiftRequirement">Shift Requirement</Label>
            <Input
              id="shiftRequirement"
              placeholder="e.g. 2 shifts, 8 hours each"
              {...register("shiftRequirement")}
              className={fieldClassName}
            />
          </div>
          <div>
            <Label htmlFor="targetStartDate">Target Start Date</Label>
            <Input
              id="targetStartDate"
              type="date"
              {...register("targetStartDate")}
              className={fieldClassName}
            />
          </div>
        </div>
      </details>

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive"
        >
          {error}
        </div>
      )}

      <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Submitting...
          </>
        ) : (
          "Submit Requirement"
        )}
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        Your information will be used only to respond to this inquiry.
      </p>
    </form>
  );
}
