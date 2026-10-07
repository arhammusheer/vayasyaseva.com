/** Fast2SMS acceptance is separate from handset delivery. Never retry ambiguity. */
export default async function main() {
  const claim = $("Claim acknowledgement").first().json;
  const response = $input.first().json as {
    statusCode?: number;
    body?: { return?: boolean; request_id?: string; status_code?: number };
  };
  const body = response.body;
  const accepted = response.statusCode === 200 && body?.return === true
    && typeof body.request_id === "string" && body.request_id.length > 0;
  // Only a documented explicit rejection or rate limit is safe to classify.
  // Network failures, unexpected bodies and server errors may have sent the SMS.
  const rejected = (response.statusCode === 400 || response.statusCode === 401) && body?.return === false;
  const limited = response.statusCode === 429;
  const status = accepted ? "accepted"
    : limited && claim.attempts < 3 ? "pending"
    : rejected || limited ? "failed" : "unknown";
  return [{ json: {
    submissionId: claim.submission_id,
    status,
    requestId: accepted ? body!.request_id! : null,
    error: accepted ? null
      : rejected ? `Fast2SMS rejected request (HTTP ${response.statusCode}, code ${body?.status_code ?? "unspecified"})`
      : limited ? "Fast2SMS rate limit"
      : "Send outcome uncertain; check Fast2SMS delivery history before retrying",
  } }];
}
