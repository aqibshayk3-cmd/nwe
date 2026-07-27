"use client";

import { useState, useRef } from "react";
import { buildTtsUrl } from "../lib/pollinations";

const VOICES = [
  { id: "alloy", label: "Alloy — neutral" },
  { id: "echo", label: "Echo — deep" },
  { id: "fable", label: "Fable — storyteller" },
  { id: "onyx", label: "Onyx — warm" },
  { id: "nova", label: "Nova — bright" },
  { id: "shimmer", label: "Shimmer — soft" },
];

export default function AudioTab() {
  const [text, setText] = useState("");
  const [voice, setVoice] = useState("nova");
  const [clips, setClips] = useState([]);
  const idRef = useRef(0);

  const submit = (e) => {
    e.preventDefault();
    const t = text.trim();
    if (!t) return;
    const id = ++idRef.current;
    const url = buildTtsUrl(t, voice);
    setClips((c) => [{ id, text: t, voice, url }, ...c]);
    setText("");
  };

  return (
    <div>
      <form className="composer" onSubmit={submit}>
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="type something to hear it spoken..."
        />
        <select value={voice} onChange={(e) => setVoice(e.target.value)} className="model-picker">
          {VOICES.map((v) => (
            <option key={v.id} value={v.id}>
              {v.label}
            </option>
          ))}
        </select>
        <button type="submit" disabled={!text.trim()}>
          Speak
        </button>
      </form>

      {clips.length === 0 && (
        <p className="empty">No clips yet. Type something above.</p>
      )}

      <div className="reel">
        {clips.map((c) => (
          <div className="frame" key={c.id}>
            <div className="frame-label">
              <span>
                <span className="dot" /> {c.voice}
              </span>
              <a className="mini-link" href={c.url} download target="_blank" rel="noreferrer">
                download
              </a>
            </div>
            <p className="frame-prompt">{c.text}</p>
            <audio controls src={c.url} className="audio-player" />
          </div>
        ))}
      </div>
    </div>
  );
}
