"use client";

import { useState, useRef } from "react";
import { buildImageUrl, IMAGE_MODELS } from "../lib/pollinations";

export default function ImageTab() {
  const [value, setValue] = useState("");
  const [model, setModel] = useState("flux");
  const [frames, setFrames] = useState([]);
  const idRef = useRef(0);

  const submit = (e) => {
    e.preventDefault();
    const prompt = value.trim();
    if (!prompt) return;

    const id = ++idRef.current;
    const seed = Math.floor(Math.random() * 1_000_000);
    const url = buildImageUrl(prompt, { model, seed });

    setFrames((f) => [{ id, prompt, model, url, status: "pending" }, ...f]);
    setValue("");
  };

  const markStatus = (id, status) => {
    setFrames((f) => f.map((fr) => (fr.id === id ? { ...fr, status } : fr)));
  };

  const retry = (id) => {
    setFrames((f) =>
      f.map((fr) =>
        fr.id === id
          ? { ...fr, status: "pending", url: buildImageUrl(fr.prompt, { model: fr.model, seed: Math.floor(Math.random() * 1_000_000) }) }
          : fr
      )
    );
  };

  return (
    <div>
      <form className="composer" onSubmit={submit}>
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="a lighthouse in a storm, oil painting..."
          autoFocus
        />
        <select
          className="model-picker"
          value={model}
          onChange={(e) => setModel(e.target.value)}
          title="Model"
        >
          {IMAGE_MODELS.filter((m) => m !== "kontext").map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
        <button type="submit" disabled={!value.trim()}>
          Expose
        </button>
      </form>

      {frames.length === 0 && (
        <p className="empty">The tray is empty. Enter a prompt above to begin.</p>
      )}

      <div className="reel">
        {frames.map((fr) => (
          <div className="frame" key={fr.id}>
            <div className="frame-label">
              <span>
                <span className={`dot ${fr.status === "pending" ? "pending" : ""}`} />
                frame #{fr.id} · {fr.model}
              </span>
              {fr.status === "pending" && <span className="tray-icon" />}
              {fr.status === "done" && (
                <a className="mini-link" href={fr.url} download target="_blank" rel="noreferrer">
                  download
                </a>
              )}
            </div>
            <p className="frame-prompt">{fr.prompt}</p>
            <div className="frame-image-slot">
              {fr.status === "error" ? (
                <div className="frame-error">
                  <p>Development failed. The generator may be busy.</p>
                  <button className="retry-btn" onClick={() => retry(fr.id)}>
                    Retry
                  </button>
                </div>
              ) : (
                <img
                  src={fr.url}
                  alt={fr.prompt}
                  onLoad={() => markStatus(fr.id, "done")}
                  onError={() => markStatus(fr.id, "error")}
                  style={{ display: fr.status === "pending" ? "none" : "block" }}
                />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
