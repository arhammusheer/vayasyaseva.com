/**
 * The job seeker intake contract (job_application.v1) lives in the contracts
 * package: packages/contracts/src/job-application.v1.ts. The site forwards
 * the canonical payload to Windmill's f/talent/intake, which checks it with
 * the generated JSON Schema (packages/contracts/generated).
 */
export * from "@vspl/contracts/job-application";
