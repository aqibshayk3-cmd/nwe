"use client";

import { useState, useRef } from "react";
import { generateVideo } from "../lib/pollinations";

export default function VideoTab() {
  const [value, setValue] = useState("");
  const [clips, setClips] = useState([]);
  const [stage, setStage] = useState("idle"); // idle | working | error
  const [statusMsg, setStatusMsg] = useState("");
  const idRef = useRef(0);

  const submit = async (e) => {
    e.preventDefault();
    const prompt = value.trim();
    if (!prompt || stage === "working") return;

    setStage("working");
    setStatusMsg("Starting...");
    try {
      const url = await generateVideo(prompt, { onStatus: setStatusMsg });
      const id = ++idRef.current;
      setClips((c) => [{ id, prompt, url }, ...c]);
      setStage("idle");
      setValue("");
    } catch (err) {
      setStatusMsg(err.message || "Video generation failed.");
      setStage("error");
    }
  };

  return (
    <div>
      <p className="video-note">
        Runs on a free, community-hosted model (Wan2.1 on Hugging Face Spaces)
        — no key needed, but it's shared infrastructure, so generations can
        take a minute or two and occasionally fail if the Space is busy or
        asleep. Retry if that happens.
      </p>

      <form className="composer" onSubmit={submit}>
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="a paper boat drifting down a rainy street..."
        />
        <button type="submit" disabled={!value.trim() || stage === "working"}>
          {stage === "working" ? "Working..." : "Generate"}
        </button>
      </form>

      {stage === "working" && (
        <div className="frame-label" style={{ border: "none", padding: "10px 2px" }}>
          <span>
            <span className="dot pending" /> {statusMsg}
          </span>
          <span className="tray-icon" />
        </div>
      )}

      {stage === "error" && <p className="frame-error">{statusMsg}</p>}

      {clips.length === 0 && stage === "idle" && (
        <p className="empty">No clips yet. Describe a short scene above.</p>
      )}

      <div className="reel">
        {clips.map((c) => (
          <div className="frame" key={c.id}>
            <div className="frame-label">
              <span>
                <span className="dot" /> clip #{c.id}
              </span>
              <a className="mini-link" href={c.url} download target="_blank" rel="noreferrer">
                download
              </a>
            </div>
            <p className="frame-prompt">{c.prompt}</p>
            <video controls src={c.url} className="video-player" />
          </div>
        ))}
      </div>
    </div>
  );
}
