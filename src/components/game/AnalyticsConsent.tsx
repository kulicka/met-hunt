"use client";

import { setAnalyticsConsent, useAnalyticsConsent, useAnalyticsServer } from "@/lib/analytics/client";
import { Button, Card } from "./ui";

// Grown-up notice and choice for optional analytics. Shown only in the
// grown-ups area, only when this server collects analytics, and off until a
// grown-up turns it on. Turning it off takes effect at once.

export function AnalyticsConsentCard() {
  const server = useAnalyticsServer();
  const consent = useAnalyticsConsent();
  if (!server.enabled) return null;
  const on = consent?.status === "granted";
  const months = Math.max(1, Math.round(server.retentionDays / 30));

  return (
    <Card>
      <h2 className="font-display text-2xl font-semibold">Help improve the hunt (optional)</h2>
      <p className="mt-2">
        With your permission, this phone sends us game events (no names, no photos) so we can tell which riddles, hints, and routes
        work for kids, and fix the ones that don’t.
      </p>
      <p className="mt-3 font-semibold">What’s sent</p>
      <ul className="mt-1 flex list-disc flex-col gap-1 pl-5">
        <li>Which mysteries were opened, found, or skipped, and how many hints were used</li>
        <li>How fun and how hard to find your child rated each mystery, if they tap a rating (pictures only, no typing)</li>
        <li>Whether each photo check said yes, not yet, or couldn’t connect (never the photo)</li>
        <li>Time spent on each mystery, the age group picked (like “8–10”), and app and content versions</li>
        <li>A random code for this adventure that changes when a new adventure starts</li>
      </ul>
      <p className="mt-3 font-semibold">Never sent</p>
      <ul className="mt-1 flex list-disc flex-col gap-1 pl-5">
        <li>Photos, names, birthdays, email, location, or anything typed</li>
        <li>The explorer your child picked, or any code that follows them from one adventure to the next</li>
      </ul>
      <p className="mt-3">
        Events are stored on our own server (no ad or third-party trackers) for about {months} {months === 1 ? "month" : "months"}, and we
        look at them only as totals. Turning this off stops it right away and deletes anything still waiting on this
        phone. Events already sent can’t be picked out by person, so we can’t delete them one adventure at a time; they
        expire on schedule.
      </p>
      <p className="mt-3 font-semibold" role="status">
        Analytics is {on ? "on" : "off"} on this phone.
      </p>
      <div className="mt-3 flex flex-col gap-2">
        {on ? (
          <Button variant="secondary" onClick={() => setAnalyticsConsent(false)}>
            TURN OFF AND DELETE QUEUED EVENTS
          </Button>
        ) : (
          <>
            <Button onClick={() => setAnalyticsConsent(true)}>YES, SEND GAME EVENTS</Button>
            {!consent && (
              <Button variant="secondary" onClick={() => setAnalyticsConsent(false)}>
                NO THANKS
              </Button>
            )}
          </>
        )}
      </div>
    </Card>
  );
}
