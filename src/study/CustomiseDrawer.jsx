// src/study/CustomiseDrawer.jsx — Task 2 Sub-batch 2B
//
// Customise drawer per design v2 §3.3 / D6 (summary-chip-collapsed) /
// D8 (per-mode bag shape) / D11 (Reset-to-defaults) / D12 (disabled
// Start + tooltip on empty pool) / D13 (sub-objective checkboxes) /
// D14 (separate Session preferences group) / D15 (no length slider for
// Review/Drill/Matching) / D16 (save on Start; subtle dirty indicator).
//
// Owns drawer-local filter state, persists to secplus-v4-customise-last
// on Start, and emits onStart({ filters, pool }) when the user commits.
// Live pool preview via buildPool — see §5 of the 2B orientation.

import React, { useState, useMemo } from "react";
import { buildPool } from "./buildPool.js";
import {
  MODE_DEFAULTS,
  loadDrawerState,
  saveDrawerState,
  filtersAreEqual,
} from "./drawer-state.js";

const MODE_TITLE = {
  quiz: "Quiz",
  review: "Review",
  drill: "Drill Wrong",
  matching: "Matching",
};

const DOMAIN_LABEL = {
  "1": "D1 General",
  "2": "D2 Threats",
  "3": "D3 Architecture",
  "4": "D4 Operations",
  "5": "D5 Mgmt",
};

const drawerStyles = {
  card: { background: "#1e293b", borderRadius: 12, padding: "16px", marginBottom: 16, border: "1px solid #334155" },
  cardTitle: { fontSize: 16, fontWeight: 800, color: "#f1f5f9", marginBottom: 12 },
  backBtn: { background: "none", border: "none", color: "#94a3b8", cursor: "pointer", padding: "0 0 12px 0", fontSize: 13, fontWeight: 600 },
  formLabel: { fontSize: 13, color: "#94a3b8", marginBottom: 6, fontWeight: 600 },
  fieldRow: { marginBottom: 14 },
  chipRow: { display: "flex", flexWrap: "wrap", gap: 6 },
  chip: { background: "#0f172a", border: "1px solid #334155", color: "#64748b", borderRadius: 6, padding: "4px 10px", fontSize: 12, cursor: "pointer" },
  chipActive: { background: "#1d4ed8", border: "1px solid #3b82f6", color: "#fff" },
  chipDisabled: { background: "#0a0f1a", border: "1px solid #1e293b", color: "#475569", borderRadius: 6, padding: "4px 10px", fontSize: 12, cursor: "not-allowed" },
  toggle: { display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 10, padding: "8px 10px", background: "#1e293b", borderRadius: 6, cursor: "pointer", border: "1px solid #334155" },
  toggleActive: { border: "1px solid #3b82f6" },
  toggleTitle: { fontSize: 13, fontWeight: 600, color: "#e2e8f0" },
  toggleDesc: { fontSize: 12, color: "#94a3b8", marginTop: 2, lineHeight: 1.4 },
  summaryChip: { display: "flex", justifyContent: "space-between", alignItems: "center", background: "#0f172a", border: "1px solid #334155", borderRadius: 8, padding: "10px 12px", cursor: "pointer", marginBottom: 12 },
  summaryText: { fontSize: 13, color: "#cbd5e1", lineHeight: 1.4 },
  summaryEdit: { fontSize: 12, color: "#3b82f6", fontWeight: 600 },
  group: { background: "#0f172a", borderRadius: 8, padding: "12px", marginBottom: 12, border: "1px solid #1e293b" },
  groupTitle: { fontSize: 12, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10, fontWeight: 700 },
  preview: { background: "#0f172a", border: "1px solid #334155", borderRadius: 8, padding: "10px 12px", fontSize: 13, color: "#cbd5e1", marginBottom: 10, textAlign: "center" },
  previewEmpty: { background: "#450a0a22", border: "1px solid #ef4444", color: "#fca5a5" },
  startBtn: { width: "100%", padding: "14px", background: "#3b82f6", border: "none", borderRadius: 10, color: "#fff", fontWeight: 700, fontSize: 15, cursor: "pointer", marginTop: 8 },
  startBtnDisabled: { background: "#334155", color: "#64748b", cursor: "not-allowed" },
  resetLink: { background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: 12, marginTop: 10, textDecoration: "underline" },
  rangeInput: { width: "100%" },
  sectionGroup: { marginBottom: 8 },
  sectionTitle: { color: "#94a3b8", fontSize: 12, marginBottom: 4 },
  dirtyMark: { color: "#fbbf24", fontWeight: 700, marginLeft: 4 },
};

function summaryChipText(mode, filters) {
  const parts = [MODE_TITLE[mode]];
  const def = MODE_DEFAULTS[mode];

  // Length (Quiz only — design §3.3 D15)
  if (mode === "quiz" && filters.length) parts.push(`${filters.length} Q`);

  // Domain (only if not all 5)
  if (filters.domains && filters.domains.length < 5) {
    parts.push(`D${filters.domains.join("/D")}`);
  }
  // Sub-objectives (if any)
  if (filters.subObjectives && filters.subObjectives.length > 0) {
    parts.push(`§${filters.subObjectives.join(",§")}`);
  }
  // Specific videos
  if (filters.videoIds && filters.videoIds.length > 0) {
    parts.push(`${filters.videoIds.length} video${filters.videoIds.length === 1 ? "" : "s"}`);
  }

  // questionTypes (if non-default for mode)
  if (filters.questionTypes && !sameSet(filters.questionTypes, def.questionTypes)) {
    const labels = filters.questionTypes.map(t => ({ mc: "MC", scen: "Scenarios", match: "Matching", cram: "Cram" }[t] || t));
    parts.push(labels.join(" + "));
  }

  // Loud non-defaults
  if (filters.watchedOnly === false) parts.push("incl. unwatched");
  if (filters.preferUnseen) parts.push("prefer unseen");
  if (filters.dueOnly && mode !== "review") parts.push("due only");
  if (filters.includeUnseen && mode === "review" && filters.dueOnly) parts.push("+ unseen");
  if (filters.belowAccuracy != null) parts.push(`< ${Math.round(filters.belowAccuracy * 100)}%`);
  if (mode === "drill" && filters.legacyVideoLevelWeak) parts.push("video-level (legacy)");

  return parts.join(" · ");
}

function sameSet(a, b) {
  if (a.length !== b.length) return false;
  const sa = new Set(a);
  for (const x of b) if (!sa.has(x)) return false;
  return true;
}

function uniqueVideoCount(pool) {
  return new Set(pool.map(p => p.videoId)).size;
}

export default function CustomiseDrawer({ mode, sections, watchedVideos, store, onStart, onBack }) {
  const initial = useMemo(() => loadDrawerState(mode), [mode]);
  const [filters, setFilters] = useState(initial);
  const [persisted, setPersisted] = useState(initial);
  const [expanded, setExpanded] = useState(false);

  // Stable today string for the preview (avoids re-running buildPool when
  // todayStr() returns a fresh-but-equal value).
  const today = useMemo(() => new Date().toLocaleDateString("en-CA"), []);

  const previewPool = useMemo(
    () => buildPool({ mode, filters, sections, watchedVideos, store, today }),
    [mode, filters, sections, watchedVideos, store, today]
  );
  const videoCount = useMemo(() => uniqueVideoCount(previewPool), [previewPool]);
  const isEmpty = previewPool.length === 0;
  const isDirty = !filtersAreEqual(filters, persisted);

  function patch(field, value) {
    setFilters(prev => {
      const next = { ...prev, [field]: value };
      // Auto-clear stale subObjectives when domain selection changes
      if (field === "domains" && next.subObjectives && next.subObjectives.length) {
        const allowedSubObjs = new Set();
        sections.forEach(sec => {
          const dom = sec.id.split(".")[0];
          if (next.domains.includes(dom)) allowedSubObjs.add(sec.id);
        });
        next.subObjectives = next.subObjectives.filter(s => allowedSubObjs.has(s));
      }
      return next;
    });
  }

  function toggleArrayField(field, value) {
    setFilters(prev => {
      const arr = prev[field] || [];
      const has = arr.includes(value);
      const nextArr = has ? arr.filter(x => x !== value) : [...arr, value];
      const next = { ...prev, [field]: nextArr };
      if (field === "domains" && next.subObjectives && next.subObjectives.length) {
        const allowedSubObjs = new Set();
        sections.forEach(sec => {
          const dom = sec.id.split(".")[0];
          if (next.domains.includes(dom)) allowedSubObjs.add(sec.id);
        });
        next.subObjectives = next.subObjectives.filter(s => allowedSubObjs.has(s));
      }
      // Matching mode locks questionTypes to ["match"] — defensive
      if (mode === "matching" && field === "questionTypes") next.questionTypes = ["match"];
      return next;
    });
  }

  function handleStart() {
    if (isEmpty) return;
    saveDrawerState(mode, filters);
    setPersisted(filters);
    onStart(filters, previewPool);
  }

  function handleReset() {
    setFilters({ ...MODE_DEFAULTS[mode] });
  }

  // Sub-objective options visible only when exactly one domain checked
  const singleDomain = filters.domains && filters.domains.length === 1 ? filters.domains[0] : null;
  const subObjectiveOptions = useMemo(() => {
    if (!singleDomain) return [];
    return sections
      .filter(sec => sec.id.split(".")[0] === singleDomain)
      .map(sec => ({ id: sec.id, label: sec.label }));
  }, [singleDomain, sections]);

  const watchedSections = useMemo(() => {
    return sections.map(sec => ({
      id: sec.id,
      label: sec.label,
      videos: sec.videos.filter(v => watchedVideos.some(wv => wv.id === v.id)),
    })).filter(sec => sec.videos.length > 0);
  }, [sections, watchedVideos]);

  // Per-mode visibility flags for filter groups (design §3.3)
  const showLengthSlider = mode === "quiz";
  const showPreferUnseen = mode !== "matching";
  const showDueOnly = mode === "review";
  const showBelowAccuracy = mode === "drill";
  const showActiveRecall = mode !== "matching";

  return (
    <div>
      <div style={drawerStyles.card}>
        <button onClick={onBack} style={drawerStyles.backBtn}>← Back to modes</button>
        <div style={drawerStyles.cardTitle}>{MODE_TITLE[mode]}</div>

        {/* Summary chip — D6 collapsed-by-default. Click to expand. */}
        <div
          onClick={() => setExpanded(e => !e)}
          style={drawerStyles.summaryChip}
          role="button"
          aria-expanded={expanded}
        >
          <div style={drawerStyles.summaryText}>
            {summaryChipText(mode, filters)}
          </div>
          <div style={drawerStyles.summaryEdit}>{expanded ? "Collapse ▴" : "Customise ▾"}</div>
        </div>

        {expanded && (
          <div>
            {/* ── Filter scope ─────────────────────────────────────── */}
            <div style={drawerStyles.group}>
              <div style={drawerStyles.groupTitle}>Filter scope</div>

              <div style={drawerStyles.fieldRow}>
                <div style={drawerStyles.formLabel}>Domains</div>
                <div style={drawerStyles.chipRow}>
                  {["1", "2", "3", "4", "5"].map(d => (
                    <button
                      key={d}
                      onClick={() => toggleArrayField("domains", d)}
                      style={{ ...drawerStyles.chip, ...(filters.domains.includes(d) ? drawerStyles.chipActive : {}) }}
                    >
                      {DOMAIN_LABEL[d]}
                    </button>
                  ))}
                </div>
              </div>

              {singleDomain && subObjectiveOptions.length > 0 && (
                <div style={drawerStyles.fieldRow}>
                  <div style={drawerStyles.formLabel}>Sub-objectives (single-domain filter)</div>
                  <div style={drawerStyles.chipRow}>
                    {subObjectiveOptions.map(s => (
                      <button
                        key={s.id}
                        onClick={() => toggleArrayField("subObjectives", s.id)}
                        style={{ ...drawerStyles.chip, ...(filters.subObjectives.includes(s.id) ? drawerStyles.chipActive : {}) }}
                      >
                        §{s.id}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div style={drawerStyles.fieldRow}>
                <div style={drawerStyles.formLabel}>Specific videos (optional — leave empty for all in scope)</div>
                {watchedSections.map(sec => (
                  <div key={sec.id} style={drawerStyles.sectionGroup}>
                    <div style={drawerStyles.sectionTitle}>{sec.label}</div>
                    <div style={drawerStyles.chipRow}>
                      {sec.videos.map(v => (
                        <button
                          key={v.id}
                          onClick={() => toggleArrayField("videoIds", v.id)}
                          style={{ ...drawerStyles.chip, ...(filters.videoIds.includes(v.id) ? drawerStyles.chipActive : {}) }}
                        >
                          {v.id}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
                {filters.videoIds.length > 0 && (
                  <button onClick={() => patch("videoIds", [])} style={{ ...drawerStyles.resetLink, marginTop: 4 }}>Clear video selection</button>
                )}
              </div>

              <label style={{ ...drawerStyles.toggle, ...(filters.watchedOnly ? drawerStyles.toggleActive : {}) }}>
                <input
                  type="checkbox"
                  checked={!!filters.watchedOnly}
                  onChange={e => patch("watchedOnly", e.target.checked)}
                  style={{ marginTop: 2 }}
                />
                <div>
                  <div style={drawerStyles.toggleTitle}>Watched videos only</div>
                  <div style={drawerStyles.toggleDesc}>
                    Pull questions from videos you've marked watched. Turn off for a pre-watch skim of unwatched videos.
                  </div>
                </div>
              </label>
            </div>

            {/* ── Format ───────────────────────────────────────────── */}
            <div style={drawerStyles.group}>
              <div style={drawerStyles.groupTitle}>Format</div>
              <div style={drawerStyles.fieldRow}>
                <div style={drawerStyles.formLabel}>Question types</div>
                <div style={drawerStyles.chipRow}>
                  {[
                    ["mc", "MC"],
                    ["scen", "Scenarios"],
                    ["match", "Matching"],
                    ["cram", "Cram (Sub-batch 4)"],
                  ].map(([t, label]) => {
                    const matchingLocked = mode === "matching";
                    const cramDisabled = t === "cram"; // cram lands in Sub-batch 4 (D7)
                    const checked = filters.questionTypes.includes(t);
                    if (cramDisabled) {
                      return (
                        <span key={t} style={drawerStyles.chipDisabled} title="Cram cards become drawer-pickable in Sub-batch 4">
                          {label}
                        </span>
                      );
                    }
                    if (matchingLocked && t !== "match") {
                      return (
                        <span key={t} style={drawerStyles.chipDisabled} title="Matching mode is matching-only">
                          {label}
                        </span>
                      );
                    }
                    return (
                      <button
                        key={t}
                        onClick={() => toggleArrayField("questionTypes", t)}
                        style={{ ...drawerStyles.chip, ...(checked ? drawerStyles.chipActive : {}) }}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {showLengthSlider && (
                <div style={drawerStyles.fieldRow}>
                  <div style={drawerStyles.formLabel}>Length: {filters.length} questions</div>
                  <input
                    type="range"
                    min={5}
                    max={50}
                    value={filters.length || 20}
                    onChange={e => patch("length", +e.target.value)}
                    style={drawerStyles.rangeInput}
                  />
                </div>
              )}
            </div>

            {/* ── Quality / SM-2 ───────────────────────────────────── */}
            <div style={drawerStyles.group}>
              <div style={drawerStyles.groupTitle}>SM-2 filters</div>

              {showPreferUnseen && (
                <label style={{ ...drawerStyles.toggle, ...(filters.preferUnseen ? drawerStyles.toggleActive : {}) }}>
                  <input
                    type="checkbox"
                    checked={!!filters.preferUnseen}
                    onChange={e => patch("preferUnseen", e.target.checked)}
                    style={{ marginTop: 2 }}
                  />
                  <div>
                    <div style={drawerStyles.toggleTitle}>Prefer unseen items</div>
                    <div style={drawerStyles.toggleDesc}>
                      Show only items you haven't tried yet (no SM-2 record). Subsumes the legacy "New" sub-mode.
                    </div>
                  </div>
                </label>
              )}

              {showDueOnly && (
                <>
                  <label style={{ ...drawerStyles.toggle, ...(filters.dueOnly ? drawerStyles.toggleActive : {}) }}>
                    <input
                      type="checkbox"
                      checked={!!filters.dueOnly}
                      onChange={e => patch("dueOnly", e.target.checked)}
                      style={{ marginTop: 2 }}
                    />
                    <div>
                      <div style={drawerStyles.toggleTitle}>Due today only</div>
                      <div style={drawerStyles.toggleDesc}>SM-2 review queue: items whose nextDue ≤ today.</div>
                    </div>
                  </label>
                  <label style={{ ...drawerStyles.toggle, ...(filters.includeUnseen ? drawerStyles.toggleActive : {}) }}>
                    <input
                      type="checkbox"
                      checked={!!filters.includeUnseen}
                      onChange={e => patch("includeUnseen", e.target.checked)}
                      style={{ marginTop: 2 }}
                    />
                    <div>
                      <div style={drawerStyles.toggleTitle}>Include unseen items</div>
                      <div style={drawerStyles.toggleDesc}>Compose with "Due today only" to mirror legacy spaced behaviour (due ∪ unseen).</div>
                    </div>
                  </label>
                </>
              )}

              {showBelowAccuracy && (
                <div style={drawerStyles.fieldRow}>
                  <div style={drawerStyles.formLabel}>
                    Per-question accuracy threshold {filters.legacyVideoLevelWeak ? "(disabled — 2B uses video-level scope)" : `< ${Math.round((filters.belowAccuracy || 0) * 100)}%`}
                  </div>
                  <input
                    type="range"
                    min={50}
                    max={95}
                    step={5}
                    value={Math.round((filters.belowAccuracy || 0.70) * 100)}
                    onChange={e => patch("belowAccuracy", +e.target.value / 100)}
                    disabled={!!filters.legacyVideoLevelWeak}
                    style={{ ...drawerStyles.rangeInput, opacity: filters.legacyVideoLevelWeak ? 0.4 : 1 }}
                  />
                  <div style={{ fontSize: 11, color: "#64748b", marginTop: 4, lineHeight: 1.4 }}>
                    2B preserves legacy video-level Drill scope (whole video pulled if its average accuracy is below 70%). 2C swaps to per-question per Q-F — slider lights up then.
                  </div>
                </div>
              )}
            </div>

            {/* ── Session preferences ──────────────────────────────── */}
            {(showActiveRecall || mode !== "matching") && (
              <div style={drawerStyles.group}>
                <div style={drawerStyles.groupTitle}>Session preferences</div>

                {showActiveRecall && (
                  <label style={{ ...drawerStyles.toggle, ...(filters.activeRecall ? drawerStyles.toggleActive : {}) }}>
                    <input
                      type="checkbox"
                      checked={!!filters.activeRecall}
                      onChange={e => patch("activeRecall", e.target.checked)}
                      style={{ marginTop: 2 }}
                    />
                    <div>
                      <div style={drawerStyles.toggleTitle}>🧠 Active recall mode</div>
                      <div style={drawerStyles.toggleDesc}>
                        Hide answer options until you press Space/Enter — read the question, think of the answer, then reveal.
                      </div>
                    </div>
                  </label>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Live preview ──────────────────────────────────────── */}
        <div style={{ ...drawerStyles.preview, ...(isEmpty ? drawerStyles.previewEmpty : {}) }}>
          {isEmpty ? (
            <span>No items match — adjust filters above</span>
          ) : (
            <span>Drawing <strong>{previewPool.length}</strong> item{previewPool.length === 1 ? "" : "s"} from <strong>{videoCount}</strong> video{videoCount === 1 ? "" : "s"}</span>
          )}
        </div>

        {/* ── Start ─────────────────────────────────────────────── */}
        <button
          onClick={handleStart}
          disabled={isEmpty}
          style={{ ...drawerStyles.startBtn, ...(isEmpty ? drawerStyles.startBtnDisabled : {}) }}
          title={isEmpty ? "No items match the current filter set — relax filters or pick more videos" : ""}
        >
          Start {MODE_TITLE[mode]}
          {isDirty && !isEmpty && <span style={drawerStyles.dirtyMark}>*</span>}
        </button>
        {isDirty && (
          <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 6, textAlign: "center" }}>
            Filters changed since last save — Start writes them to your saved preferences.
          </div>
        )}

        <div style={{ textAlign: "center" }}>
          <button onClick={handleReset} style={drawerStyles.resetLink}>Reset to defaults</button>
        </div>
      </div>
    </div>
  );
}
