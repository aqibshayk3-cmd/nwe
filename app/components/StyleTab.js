"use client";

import { useState, useRef } from "react";
import { buildStyleTransferUrl, uploadForStyleTransfer } from "../lib/pollinations";

const PRESETS = [
  "turn this into a watercolor painting",
  "make this look like a vintage film photograph",
  "convert this into anime art style",
  "turn this into an oil painting with visible brushstrokes",
  "make this look like a pencil sketch",
];

// Resize/compress client-side before upload, so it transfers fast.
async function prepareFile(file) {
  const bitmap = await createImageBitmap(file);
  const maxSide = 1280;
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(bitmap, 0, 0, w, h);

  const blob = await new Promise((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", 0.85)
  );
  return new File([blob], "photo.jpg", { type: "image/jpeg" });
}

export default function StyleTab() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [prompt, setPrompt] = useState("");
  const [stage, setStage] = useState("idle"); // idle | uploading | generating | done | error
  const [resultUrl, setResultUrl] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const fileInputRef = useRef(null);

  const onPick = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setResultUrl(null);
    setStage("idle");
  };

  const run = async () => {
    if (!file || !prompt.trim()) return;
    setErrorMsg("");
    setResultUrl(null);
    try {
      setStage("uploading");
      const prepared = await prepareFile(file);
      const hostedUrl = await uploadForStyleTransfer(prepared);

      setStage("generating");
      const url = buildStyleTransferUrl(prompt, hostedUrl);

      // Preload before showing, so the "generating" state covers the wait.
      await new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = resolve;
        img.onerror = () => reject(new Error("Style generation failed."));
        img.src = url;
      });

      setResultUrl(url);
      setStage("done");
    } catch (err) {
      setErrorMsg(err.message || "Something went wrong.");
      setStage("error");
    }
  };

  return (
    <div className="style-tab">
      <div className="upload-row">
        <div
          className="dropzone"
          onClick={() => fileInputRef.current?.click()}
        >
          {preview ? (
            <img src={preview} alt="Your upload" className="dropzone-preview" />
          ) : (
            <>
              <span className="dropzone-plus">+</span>
              <span>Upload a photo</span>
            </>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={onPick}
          style={{ display: "none" }}
        />

        <div className="style-controls">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="describe the new style..."
            className="style-input"
          />
          <div className="preset-row">
            {PRESETS.map((p) => (
              <button key={p} className="preset-chip" onClick={() => setPrompt(p)}>
                {p.replace("turn this into ", "").replace("make this look like ", "").replace("convert this into ", "")}
              </button>
            ))}
          </div>
          <button
            className="run-btn"
            onClick={run}
            disabled={!file || !prompt.trim() || stage === "uploading" || stage === "generating"}
          >
            {stage === "uploading" && "Uploading..."}
            {stage === "generating" && "Developing..."}
            {(stage === "idle" || stage === "done" || stage === "error") && "Restyle it"}
          </button>
        </div>
      </div>

      {stage === "error" && <p className="frame-error">{errorMsg}</p>}

      {resultUrl && (
        <div className="frame" style={{ marginTop: 24 }}>
          <div className="frame-label">
            <span>
              <span className="dot" /> restyled
            </span>
            <a className="mini-link" href={resultUrl} download target="_blank" rel="noreferrer">
              download
            </a>
          </div>
          <div className="frame-image-slot">
            <img src={resultUrl} alt="Restyled result" style={{ display: "block" }} />
          </div>
        </div>
      )}

      <p className="style-note">
        Your photo is briefly hosted on catbox.moe (anonymous, public link) so
        the style model can fetch it — don't upload anything you need to keep
        private.
      </p>
    </div>
  );
}
