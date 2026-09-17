import { Status, when } from "@/components/admin/ui";
import type { Qualification } from "@/lib/prospecting/qualify";
import type { OpportunityOverride } from "@/lib/prospecting/types";
import { DecisionControls } from "./decision-controls";
import { OpportunityControls } from "./opportunity-controls";
import { ScoreAdjustControls } from "./score-adjust-controls";

/**
 * `at` comes from an adjustment or override, stored jsonb a reviewer could
 * have hand-edited — `qualify.ts` already defends `points` against exactly
 * this class of input. `Intl.DateTimeFormat.format` throws `RangeError` on an
 * invalid date, which would take out the whole page, so a malformed
 * timestamp gets the same one-line guard here.
 */
function whenSafe(at: string): string {
  const date = new Date(at);
  return Number.isNaN(date.getTime()) ? "—" : when(date);
}

/**
 * A prospect's qualification, rendered from a fresh `qualifyProspect` result
 * and never from the list's snapshot columns, so every number can be read
 * back against the evidence beside it.
 */
export function QualificationPanel({
  prospectId,
  qualification,
  override,
  decision,
  suppressed,
}: {
  prospectId: number;
  qualification: Qualification;
  override: OpportunityOverride | null;
  decision: { decision: string; reason: string; decidedBy: number | null; decidedAt: Date | null };
  suppressed: boolean;
}) {
  const { band, automaticOpportunities: automatic, effectiveOpportunities: effective } = qualification;

  return (
    <section className="mt-6 rounded-sm border border-rule bg-white p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="text-[1.0625rem] font-semibold">Qualification</h2>
        <p className="font-mono text-micro text-faint">
          {qualification.auditId ? `Scored from audit #${qualification.auditId}` : "No completed audit yet"}
        </p>
      </div>

      <div className="mt-4 border-l-2 border-accent bg-paper px-4 py-3">
        <p className="font-mono text-[1.5rem] font-medium text-graphite">
          {qualification.effectiveTotal}
          <span className="text-[0.875rem] text-muted">/100</span>
          {qualification.effectiveTotal !== qualification.automaticTotal ? (
            <span className="ml-2 text-[0.8125rem] text-muted">automatic {qualification.automaticTotal}</span>
          ) : null}
        </p>
        <p className="mt-1 text-[0.9375rem] font-medium text-graphite">{band.meaning}</p>
        <p className="mt-1 text-[0.875rem] text-muted">Required action: {band.action}</p>
        <p className="mt-2 text-[0.75rem] text-faint">
          A recommendation for review. Only a reviewer qualifies a prospect.
        </p>
      </div>

      <div className="mt-5 overflow-x-auto">
        <table className="w-full min-w-[40rem] border-collapse text-left">
          <thead>
            <tr className="border-b border-rule">
              {["Component", "Automatic", "Effective", "Evidence and adjustment"].map((h) => (
                <th key={h} scope="col" className="px-3 py-2 font-mono text-micro font-normal text-faint">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {qualification.components.map((c) => (
              <tr key={c.key} className="border-b border-rule align-top last:border-b-0">
                <td className="px-3 py-3 text-[0.875rem] font-medium text-graphite">
                  {c.label}
                  <span className="block font-mono text-micro font-normal text-faint">of {c.cap}</span>
                </td>
                <td className="px-3 py-3 font-mono text-[0.875rem] text-muted">{c.automatic}</td>
                <td className="px-3 py-3 font-mono text-[0.875rem] text-graphite">{c.effective}</td>
                <td className="px-3 py-3 text-[0.8125rem] text-muted">
                  <ul className="space-y-0.5">
                    {c.evidence.map((line, index) => (
                      <li key={`${c.key}-${index}`}>{line}</li>
                    ))}
                  </ul>
                  {c.adjustment ? (
                    <div
                      className={`mt-2 border-l-2 pl-2 ${c.adjustmentApplies ? "border-ink" : "border-accent"}`}
                    >
                      <p className="text-graphite">
                        Adjusted to {c.adjustment.points}: {c.adjustment.reason}
                      </p>
                      <p className="font-mono text-micro text-faint">
                        {c.adjustment.byEmail}, {whenSafe(c.adjustment.at)}
                      </p>
                      {c.adjustmentApplies ? null : (
                        <p className="text-graphite">
                          Made against audit #{c.adjustment.auditId}, now{" "}
                          {qualification.auditId ? `#${qualification.auditId}` : "no usable audit"} —
                          re-check. Not applied.
                        </p>
                      )}
                    </div>
                  ) : null}
                  <ScoreAdjustControls
                    prospectId={prospectId}
                    component={c.key}
                    cap={c.cap}
                    automatic={c.automatic}
                    adjusted={c.adjustment !== null}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 grid gap-6 border-t border-rule pt-5 lg:grid-cols-2">
        <div>
          <h3 className="text-[0.9375rem] font-semibold">Opportunities</h3>
          <dl className="mt-3 space-y-3 text-[0.875rem]">
            <div>
              <dt className="font-mono text-micro text-faint">
                Primary{effective.overridden ? " — set by a reviewer" : ""}
              </dt>
              <dd className="mt-1 text-graphite">{effective.primary ?? "— no completed audit yet"}</dd>
            </div>
            <div>
              <dt className="font-mono text-micro text-faint">Secondary</dt>
              <dd className="mt-1 text-graphite">
                {effective.secondary.length ? effective.secondary.join(", ") : "—"}
              </dd>
            </div>
            {override ? (
              <div>
                <dt className="font-mono text-micro text-faint">Override reason</dt>
                <dd className="mt-1 text-muted">
                  {override.reason}
                  <span className="block font-mono text-micro text-faint">
                    {override.byEmail}, {whenSafe(override.at)}
                  </span>
                </dd>
              </div>
            ) : null}
            <div>
              <dt className="font-mono text-micro text-faint">Automatic</dt>
              <dd className="mt-1 text-muted">
                {automatic.primary ?? "—"}
                {automatic.secondary.length ? (
                  <ul className="mt-1 space-y-0.5">
                    {automatic.secondary.map((s) => (
                      <li key={s.opportunity}>
                        {s.opportunity}: {s.evidence}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </dd>
            </div>
          </dl>
          <OpportunityControls
            prospectId={prospectId}
            overridden={effective.overridden}
            primary={effective.primary}
            secondary={effective.secondary}
          />
        </div>

        <div>
          <h3 className="text-[0.9375rem] font-semibold">Decision</h3>
          <div className="mt-3 text-[0.875rem]">
            {decision.decision ? (
              <>
                <Status value={decision.decision} />
                <p className="mt-2 text-[0.8125rem] text-muted">{decision.reason || "No reason given."}</p>
                <p className="font-mono text-micro text-faint">
                  {when(decision.decidedAt)}
                  {decision.decidedBy !== null ? ` by user #${decision.decidedBy}` : ""}
                </p>
              </>
            ) : (
              <p className="text-muted">Undecided</p>
            )}
          </div>
          <DecisionControls prospectId={prospectId} decision={decision.decision} suppressed={suppressed} />
        </div>
      </div>
    </section>
  );
}
