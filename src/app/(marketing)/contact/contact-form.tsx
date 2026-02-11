"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod/v4";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CheckCircle2, Loader2 } from "lucide-react";

const contactSchema = z.object({
  name: z.string().min(2, "Name is required"),
  company: z.string().min(1, "Company name is required"),
  role: z.string().min(1, "Your role is required"),
  phone: z.string().min(10, "Valid phone number is required"),
  email: z.email("Valid email is required"),
  location: z.string().min(1, "Location is required"),
  industry: z.string().min(1, "Please select an industry"),
  headcount: z.string().min(1, "Approximate headcount is required"),
  shiftRequirement: z.string().optional(),
  targetStartDate: z.string().optional(),
  details: z.string().optional(),
});

type ContactFormData = z.infer<typeof contactSchema>;

const industryOptions = [
  "Manufacturing",
  "Warehousing & Logistics",
  "FMCG / Consumer Operations",
  "Institutional Facilities",
  "Hospitality",
  "Other",
];

export function ContactForm() {
  const searchParams = useSearchParams();
  const isAssessment = searchParams.get("type") === "assessment";
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      details: isAssessment
        ? "Requesting a site assessment for workforce deployment."
        : "",
    },
  });

  const [error, setError] = useState<string | null>(null);

  async function onSubmit(data: ContactFormData) {
    setError(null);
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
        "Unable to submit. Please try again or contact us directly at help@vayasyaseva.com."
      );
    }
  }

  if (submitted) {
    return (
      <div role="status" className="flex flex-col items-center justify-center py-12 text-center">
        <CheckCircle2 className="h-12 w-12 text-success" />
        <h3 className="mt-4 text-xl font-semibold">Requirement Received</h3>
        <p className="mt-2 max-w-sm text-muted-foreground">
          Thank you for reaching out. Our operations team will review your
          requirement and respond — our target is 2 business days (IST, Mon–Sat).
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-5">
      {/* Row: Name + Company */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="name">
            Full Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="name"
            placeholder="Your name"
            {...register("name")}
            className="mt-1.5"
          />
          {errors.name && (
            <p className="mt-1 text-xs text-destructive">{errors.name.message}</p>
          )}
        </div>
        <div>
          <Label htmlFor="company">
            Company <span className="text-destructive">*</span>
          </Label>
          <Input
            id="company"
            placeholder="Company name"
            {...register("company")}
            className="mt-1.5"
          />
          {errors.company && (
            <p className="mt-1 text-xs text-destructive">{errors.company.message}</p>
          )}
        </div>
      </div>

      {/* Row: Role + Phone */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="role">
            Your Role <span className="text-destructive">*</span>
          </Label>
          <Input
            id="role"
            placeholder="e.g. Warehouse Manager"
            {...register("role")}
            className="mt-1.5"
          />
          {errors.role && (
            <p className="mt-1 text-xs text-destructive">{errors.role.message}</p>
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
            className="mt-1.5"
          />
          {errors.phone && (
            <p className="mt-1 text-xs text-destructive">{errors.phone.message}</p>
          )}
        </div>
      </div>

      {/* Row: Email + Location */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="email">
            Email <span className="text-destructive">*</span>
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="you@company.com"
            {...register("email")}
            className="mt-1.5"
          />
          {errors.email && (
            <p className="mt-1 text-xs text-destructive">{errors.email.message}</p>
          )}
        </div>
        <div>
          <Label htmlFor="location">
            Site Location <span className="text-destructive">*</span>
          </Label>
          <Input
            id="location"
            placeholder="City / Industrial area"
            {...register("location")}
            className="mt-1.5"
          />
          {errors.location && (
            <p className="mt-1 text-xs text-destructive">{errors.location.message}</p>
          )}
        </div>
      </div>

      {/* Row: Industry + Headcount */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="industry">
            Industry <span className="text-destructive">*</span>
          </Label>
          <Select onValueChange={(value) => setValue("industry", value)}>
            <SelectTrigger className="mt-1.5">
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
          <Label htmlFor="headcount">
            Approx. Headcount <span className="text-destructive">*</span>
          </Label>
          <Input
            id="headcount"
            placeholder="e.g. 50"
            {...register("headcount")}
            className="mt-1.5"
          />
          {errors.headcount && (
            <p className="mt-1 text-xs text-destructive">{errors.headcount.message}</p>
          )}
        </div>
      </div>

      {/* Row: Shift + Start Date */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="shiftRequirement">Shift Requirement</Label>
          <Input
            id="shiftRequirement"
            placeholder="e.g. 2 shifts, 8 hours each"
            {...register("shiftRequirement")}
            className="mt-1.5"
          />
        </div>
        <div>
          <Label htmlFor="targetStartDate">Target Start Date</Label>
          <Input
            id="targetStartDate"
            type="date"
            {...register("targetStartDate")}
            className="mt-1.5"
          />
        </div>
      </div>

      {/* Details */}
      <div>
        <Label htmlFor="details">Requirement Details</Label>
        <Textarea
          id="details"
          placeholder="Describe your workforce requirements, specific roles needed, or any other details..."
          rows={4}
          {...register("details")}
          className="mt-1.5"
        />
      </div>

      {error && (
        <div role="alert" className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
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
