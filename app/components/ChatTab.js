"use client";

import { useState, useRef, useEffect } from "react";
import { sendChatMessage } from "../lib/pollinations";

const MODELS = ["openai", "mistral", "openai-fast"];

export default function ChatTab() {
  const [model, setModel] = useState("openai");
  const [messages, setMessages] = useState([]);
  const [value, setValue] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  const send = async (e) => {
    e.preventDefault();
    const text = value.trim();
    if (!text || sending) return;

    const next = [...messages, { role: "user", content: text }];
    setMessages(next);
    setValue("");
    setError("");
    setSending(true);

    try {
      const reply = await sendChatMessage(next, { model });
      setMessages((m) => [...m, { role: "assistant", content: reply }]);
    } catch (err) {
      setError(err.message || "Chat request failed.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="chat-tab">
      <div className="chat-toolbar">
        <select value={model} onChange={(e) => setModel(e.target.value)} className="model-picker">
          {MODELS.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
        {messages.length > 0 && (
          <button className="mini-link" onClick={() => setMessages([])}>
            clear
          </button>
        )}
      </div>

      <div className="chat-log">
        {messages.length === 0 && (
          <p className="empty">Say something to start the conversation.</p>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`bubble ${m.role}`}>
            <span className="bubble-role">{m.role === "user" ? "you" : model}</span>
            <p>{m.content}</p>
          </div>
        ))}
        {sending && (
          <div className="bubble assistant">
            <span className="bubble-role">{model}</span>
            <span className="tray-icon" />
          </div>
        )}
        {error && <p className="frame-error">{error}</p>}
        <div ref={endRef} />
      </div>

      <form className="composer" onSubmit={send}>
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="ask anything..."
        />
        <button type="submit" disabled={!value.trim() || sending}>
          Send
        </button>
      </form>
    </div>
  );
}
