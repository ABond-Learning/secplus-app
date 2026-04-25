import React, { useEffect, useState, useCallback } from "react";
import {
  setConfig,
  clearConfig,
  triggerPush,
  createGist,
  pushAll,
  pullAll,
  testConnection,
  subscribe,
  getStatus,
} from "./sync-engine.js";

// Settings → Sync screen.
//
// Subscribes to the engine's status. Handles enable/disable, force
// push/pull, sync-now, gist creation, and test-connection. After a
// successful setConfig the page is reloaded so React's in-memory state
// re-reads localStorage (engine wrote merged values straight to
// localStorage; React's store wouldn't otherwise pick them up).

const PAT_HELP_URL = "https://github.com/settings/tokens/new?scopes=gist&description=Security%2B%20Study%20App%20Sync";

function StatusDot({ color, title }) {
  return (
    <span
      title={title}
      style={{
        display: "inline-block",
        width: 10,
        height: 10,
        borderRadius: "50%",
        background: color,
        marginRight: 8,
        verticalAlign: "middle",
      }}
    />
  );
}

function formatTime(iso) {
  if (!iso) return "never";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "unknown";
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

export function deriveHealth(status) {
  if (!status || !status.enabled) return { color: "#64748b", label: "Disabled" };
  if (status.lastError && /auth failed|gist not found/i.test(status.lastError)) {
    return { color: "#ef4444", label: `Error — ${status.lastError}` };
  }
  if (!status.lastSuccessAt) {
    return { color: "#f59e0b", label: "Connecting…" };
  }
  const ageMs = Date.now() - new Date(status.lastSuccessAt).getTime();
  if (ageMs > 60 * 60 * 1000) {
    return { color: "#f59e0b", label: `Sync degraded (last success ${formatTime(status.lastSuccessAt)})` };
  }
  return { color: "#10b981", label: `Synced ${formatTime(status.lastSuccessAt)}` };
}

const styles = {
  page: { maxWidth: 800, margin: "0 auto", padding: "16px", color: "#f1f5f9" },
  back: { background: "none", border: "none", color: "#3b82f6", cursor: "pointer", fontSize: 14, padding: "4px 0", marginBottom: 12 },
  h1: { fontSize: 22, fontWeight: 800, marginBottom: 4 },
  sub: { fontSize: 13, color: "#94a3b8", marginBottom: 20 },
  card: { background: "#1e293b", borderRadius: 12, padding: "16px", marginBottom: 16, border: "1px solid #334155" },
  cardTitle: { fontSize: 15, fontWeight: 700, color: "#f1f5f9", marginBottom: 12 },
  label: { display: "block", fontSize: 12, color: "#94a3b8", marginBottom: 4, fontWeight: 600 },
  input: { width: "100%", background: "#0f172a", border: "1px solid #334155", color: "#e2e8f0", borderRadius: 8, padding: "10px 12px", fontSize: 14, fontFamily: "inherit", boxSizing: "border-box" },
  btnRow: { display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 },
  btnPrimary: { background: "#3b82f6", color: "#fff", border: "none", borderRadius: 6, padding: "10px 16px", cursor: "pointer", fontWeight: 600, fontSize: 13 },
  btnSecondary: { background: "#475569", color: "#fff", border: "none", borderRadius: 6, padding: "10px 16px", cursor: "pointer", fontWeight: 600, fontSize: 13 },
  btnDanger: { background: "#7f1d1d", color: "#fecaca", border: "1px solid #991b1b", borderRadius: 6, padding: "10px 16px", cursor: "pointer", fontWeight: 600, fontSize: 13 },
  btnGhost: { background: "transparent", color: "#94a3b8", border: "1px solid #334155", borderRadius: 6, padding: "10px 16px", cursor: "pointer", fontWeight: 600, fontSize: 13 },
  toast: { padding: "10px 12px", borderRadius: 6, fontSize: 13, marginTop: 12 },
  toastOk: { background: "#064e3b", color: "#bbf7d0", border: "1px solid #065f46" },
  toastErr: { background: "#7f1d1d", color: "#fecaca", border: "1px solid #991b1b" },
  toastInfo: { background: "#1e3a5f", color: "#bfdbfe", border: "1px solid #1e40af" },
  helpText: { fontSize: 12, color: "#94a3b8", lineHeight: 1.5, marginTop: 8 },
  helpLink: { color: "#3b82f6", textDecoration: "underline" },
  metaRow: { display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #334155", fontSize: 13 },
  metaKey: { color: "#94a3b8" },
  metaVal: { color: "#e2e8f0", fontFamily: "monospace", fontSize: 12 },
  showHide: { background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: 11, padding: "4px 8px" },
  patWrap: { position: "relative" },
};

export default function SyncSettings({ onBack, setDialog }) {
  const [status, setStatus] = useState(getStatus());
  const [pat, setPat] = useState("");
  const [gistId, setGistId] = useState("");
  const [showPat, setShowPat] = useState(false);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState(null); // { kind: 'ok'|'err'|'info', text }

  useEffect(() => {
    const unsub = subscribe(setStatus);
    return unsub;
  }, []);

  // Re-render once a minute so "Synced 14:32" age check stays accurate.
  useEffect(() => {
    const i = setInterval(() => setStatus(getStatus()), 60 * 1000);
    return () => clearInterval(i);
  }, []);

  const health = deriveHealth(status);

  const showToast = (kind, text) => setToast({ kind, text });

  const onCreateGist = useCallback(async () => {
    if (!pat) { showToast("err", "Enter your PAT first."); return; }
    setBusy(true);
    setToast({ kind: "info", text: "Creating private Gist…" });
    try {
      const result = await createGist({ pat });
      setGistId(result.gistId);
      showToast("ok", `Private Gist created: ${result.gistId}. URL copied below.`);
    } catch (e) {
      showToast("err", `Couldn't create Gist: ${e.message || e}`);
    } finally {
      setBusy(false);
    }
  }, [pat]);

  const onTestConnection = useCallback(async () => {
    if (!pat || !gistId) { showToast("err", "PAT and Gist ID are both required."); return; }
    setBusy(true);
    setToast({ kind: "info", text: "Testing connection…" });
    try {
      const result = await testConnection({ pat, gistId });
      if (result.ok) {
        const sizeNote = result.hasContent ? "Gist already has sync data." : "Gist is empty (will be seeded on enable).";
        showToast("ok", `Connection works. ${sizeNote}`);
      } else {
        showToast("err", result.error || "Connection failed.");
      }
    } catch (e) {
      showToast("err", `Connection failed: ${e.message || e}`);
    } finally {
      setBusy(false);
    }
  }, [pat, gistId]);

  const onEnable = useCallback(async () => {
    if (!pat || !gistId) { showToast("err", "PAT and Gist ID are both required."); return; }
    setBusy(true);
    setToast({ kind: "info", text: "Enabling sync — initial pull-merge-push…" });
    try {
      const result = await setConfig({ pat, gistId });
      if (result.lastError) {
        showToast("err", `Sync enabled but first sync failed: ${result.lastError}. Check the Sync screen after reload.`);
      } else {
        showToast("ok", "Sync enabled. Reloading to apply synced progress…");
      }
      // Reload either way — on success this picks up merged data; on
      // failure the user can still see the new Sync screen state.
      setTimeout(() => { window.location.reload(); }, 1500);
    } catch (e) {
      showToast("err", `Couldn't enable sync: ${e.message || e}`);
      setBusy(false);
    }
  }, [pat, gistId]);

  const onDisable = useCallback(() => {
    setDialog({
      title: "Disable sync?",
      body: "This stops syncing on this device. The data on the cloud and on this device is left as-is. You can re-enable later with the same PAT and Gist ID.",
      actions: (
        <>
          <button
            onClick={() => setDialog(null)}
            style={{ background: "#475569", color: "#fff", border: "none", borderRadius: 6, padding: "10px 18px", cursor: "pointer", fontWeight: 600 }}
          >Cancel</button>
          <button
            onClick={() => {
              clearConfig();
              setDialog(null);
              showToast("ok", "Sync disabled on this device.");
              setPat("");
              setGistId("");
            }}
            style={{ background: "#7f1d1d", color: "#fecaca", border: "1px solid #991b1b", borderRadius: 6, padding: "10px 18px", cursor: "pointer", fontWeight: 600 }}
          >Disable</button>
        </>
      ),
    });
  }, [setDialog]);

  const onSyncNow = useCallback(async () => {
    setBusy(true);
    setToast({ kind: "info", text: "Syncing now…" });
    try {
      const result = await triggerPush();
      if (result.lastError) {
        showToast("err", `Sync failed: ${result.lastError}`);
      } else {
        showToast("ok", `Synced at ${formatTime(result.lastSuccessAt)}.`);
      }
    } catch (e) {
      showToast("err", `Sync failed: ${e.message || e}`);
    } finally {
      setBusy(false);
    }
  }, []);

  const onForcePush = useCallback(() => {
    setDialog({
      title: "Force push to cloud?",
      body: "This OVERWRITES the cloud with this device's current data. Use only when you want this device to be the source of truth (e.g. after restoring from a backup). Other devices will pick up this data on their next sync.",
      actions: (
        <>
          <button
            onClick={() => setDialog(null)}
            style={{ background: "#475569", color: "#fff", border: "none", borderRadius: 6, padding: "10px 18px", cursor: "pointer", fontWeight: 600 }}
          >Cancel</button>
          <button
            onClick={async () => {
              setDialog(null);
              setBusy(true);
              setToast({ kind: "info", text: "Forcing push to cloud…" });
              try {
                await pushAll();
                showToast("ok", "Cloud now matches this device.");
              } catch (e) {
                showToast("err", `Force push failed: ${e.message || e}`);
              } finally {
                setBusy(false);
              }
            }}
            style={{ background: "#7f1d1d", color: "#fecaca", border: "1px solid #991b1b", borderRadius: 6, padding: "10px 18px", cursor: "pointer", fontWeight: 600 }}
          >Force push</button>
        </>
      ),
    });
  }, [setDialog]);

  const onForcePull = useCallback(() => {
    setDialog({
      title: "Force pull from cloud?",
      body: "This REPLACES this device's data with the cloud's current data. Local-only changes that haven't been pushed will be lost. Use when joining a sync set you want to adopt fully. Page will reload after.",
      actions: (
        <>
          <button
            onClick={() => setDialog(null)}
            style={{ background: "#475569", color: "#fff", border: "none", borderRadius: 6, padding: "10px 18px", cursor: "pointer", fontWeight: 600 }}
          >Cancel</button>
          <button
            onClick={async () => {
              setDialog(null);
              setBusy(true);
              setToast({ kind: "info", text: "Pulling cloud data…" });
              try {
                await pullAll();
                showToast("ok", "Local data replaced from cloud. Reloading…");
                setTimeout(() => { window.location.reload(); }, 1500);
              } catch (e) {
                showToast("err", `Force pull failed: ${e.message || e}`);
                setBusy(false);
              }
            }}
            style={{ background: "#7f1d1d", color: "#fecaca", border: "1px solid #991b1b", borderRadius: 6, padding: "10px 18px", cursor: "pointer", fontWeight: 600 }}
          >Force pull</button>
        </>
      ),
    });
  }, [setDialog]);

  return (
    <div style={styles.page}>
      <button onClick={onBack} style={styles.back}>← Back to app</button>
      <div style={styles.h1}>Sync</div>
      <div style={styles.sub}>
        Cross-device sync via a private GitHub Gist. Each device authenticates with your own personal access token; data lives in your Gist and stays under your control.
      </div>

      <div style={styles.card}>
        <div style={styles.cardTitle}>
          <StatusDot color={health.color} title={health.label} />
          {health.label}
        </div>
        {status.enabled && (
          <>
            <div style={styles.metaRow}>
              <span style={styles.metaKey}>Last successful sync</span>
              <span style={styles.metaVal}>{formatTime(status.lastSuccessAt)}</span>
            </div>
            <div style={styles.metaRow}>
              <span style={styles.metaKey}>Device</span>
              <span style={styles.metaVal}>{status.deviceId || "—"}</span>
            </div>
            <div style={styles.metaRow}>
              <span style={styles.metaKey}>Gist ID</span>
              <span style={styles.metaVal}>{status.gistId || "—"}</span>
            </div>
            {status.lastError && (
              <div style={{ ...styles.toast, ...styles.toastErr, marginTop: 12 }}>
                Last error: {status.lastError}
              </div>
            )}
          </>
        )}
      </div>

      {!status.enabled ? (
        <div style={styles.card}>
          <div style={styles.cardTitle}>Enable sync</div>

          <label style={styles.label}>Personal access token (PAT)</label>
          <div style={styles.patWrap}>
            <input
              type={showPat ? "text" : "password"}
              autoComplete="off"
              value={pat}
              onChange={e => setPat(e.target.value.trim())}
              placeholder="ghp_…"
              style={styles.input}
            />
            <button onClick={() => setShowPat(s => !s)} style={{ ...styles.showHide, position: "absolute", right: 8, top: 8 }}>
              {showPat ? "hide" : "show"}
            </button>
          </div>
          <div style={styles.helpText}>
            Create one at <a href={PAT_HELP_URL} target="_blank" rel="noreferrer" style={styles.helpLink}>github.com → Settings → Developer settings → Personal access tokens</a> with the <strong>gist</strong> scope only. Stored unencrypted in this device's localStorage; do not share this token.
          </div>

          <div style={{ height: 16 }} />

          <label style={styles.label}>Gist ID</label>
          <input
            type="text"
            autoComplete="off"
            value={gistId}
            onChange={e => setGistId(e.target.value.trim())}
            placeholder="paste an existing Gist ID, or create a new one →"
            style={styles.input}
          />

          <div style={styles.btnRow}>
            <button onClick={onCreateGist} disabled={busy} style={styles.btnSecondary}>
              Create new private Gist
            </button>
            <button onClick={onTestConnection} disabled={busy} style={styles.btnGhost}>
              Test connection
            </button>
          </div>

          <div style={{ height: 12 }} />

          <button onClick={onEnable} disabled={busy || !pat || !gistId} style={{ ...styles.btnPrimary, opacity: (busy || !pat || !gistId) ? 0.5 : 1 }}>
            Enable sync
          </button>

          <div style={styles.helpText}>
            On enabling, the engine pulls the cloud, merges with this device's data using per-key latest-timestamp-wins, and pushes the result back. If the cloud already has data and this device also has data, the cloud wins on overlap (joining-device safety).
          </div>
        </div>
      ) : (
        <>
          <div style={styles.card}>
            <div style={styles.cardTitle}>Sync controls</div>
            <div style={styles.btnRow}>
              <button onClick={onSyncNow} disabled={busy} style={styles.btnPrimary}>
                Sync now
              </button>
              <button onClick={onDisable} disabled={busy} style={styles.btnGhost}>
                Disable sync
              </button>
            </div>
          </div>

          <div style={styles.card}>
            <div style={styles.cardTitle}>Advanced — use with care</div>
            <div style={styles.helpText}>
              These bypass the normal merge. Useful for joining a sync set with conflicting data, or recovering from a wrongly-overwritten cloud.
            </div>
            <div style={styles.btnRow}>
              <button onClick={onForcePull} disabled={busy} style={styles.btnDanger}>
                Force pull from cloud
              </button>
              <button onClick={onForcePush} disabled={busy} style={styles.btnDanger}>
                Force push to cloud
              </button>
            </div>
          </div>
        </>
      )}

      {toast && (
        <div style={{
          ...styles.toast,
          ...(toast.kind === "ok" ? styles.toastOk : toast.kind === "err" ? styles.toastErr : styles.toastInfo),
        }}>
          {toast.text}
        </div>
      )}
    </div>
  );
}
