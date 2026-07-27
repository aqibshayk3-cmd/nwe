"use client";

import { useState } from "react";
import ImageTab from "./components/ImageTab";
import StyleTab from "./components/StyleTab";
import ChatTab from "./components/ChatTab";
import AudioTab from "./components/AudioTab";
import VideoTab from "./components/VideoTab";

const TABS = [
  { id: "image", label: "Image", hint: "text → image" },
  { id: "style", label: "Style Transfer", hint: "your photo → new style" },
  { id: "video", label: "Video", hint: "text → video (free, unstable)" },
  { id: "chat", label: "Chat", hint: "talk to a model" },
  { id: "audio", label: "Audio", hint: "text → speech" },
];

export default function Home() {
  const [tab, setTab] = useState("image");

  return (
    <main className="wrap">
      <div className="header">
        <p className="eyebrow">// darkroom</p>
        <h1 className="title">
          One bot, <em>every</em> medium.
        </h1>
        <p className="sub">
          Free, no-signup generation powered by Pollinations.ai — images,
          style transfer, chat, and text-to-speech.
        </p>
      </div>

      <nav className="tabbar" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            className={`tabbtn ${tab === t.id ? "active" : ""}`}
            onClick={() => setTab(t.id)}
          >
            <span className="tabbtn-label">{t.label}</span>
            <span className="tabbtn-hint">{t.hint}</span>
          </button>
        ))}
      </nav>

      <div className="tabpanel">
        {tab === "image" && <ImageTab />}
        {tab === "style" && <StyleTab />}
        {tab === "video" && <VideoTab />}
        {tab === "chat" && <ChatTab />}
        {tab === "audio" && <AudioTab />}
      </div>
    </main>
  );
}
