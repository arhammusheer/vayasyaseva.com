import { homeGuess } from "@/context/home-guess";

/**
 * The jobs form's location guesses (src/context/home-guess.ts): the places
 * nearest the visitor's IP position, and its state. Asked only when the form
 * reaches "Where do you live?", never for the holdout. Answers this visitor
 * only; nothing is stored or logged. Private and uncached.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET(request: Request) {
  return Response.json(homeGuess(request.headers), { headers: { "cache-control": "private, no-store" } });
}
