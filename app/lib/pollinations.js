// Small helpers around Pollinations.ai's public endpoints.
// No API key needed for any of this — anonymous tier, rate-limited to
// roughly one request per 15s per the docs at
// https://github.com/pollinations/pollinations/blob/master/APIDOCS.md

export const IMAGE_MODELS = ["flux", "turbo", "kontext"];

export function buildImageUrl(prompt, { model = "flux", width = 1024, height = 1024, seed } = {}) {
  const encoded = encodeURIComponent(prompt.trim());
  const params = new URLSearchParams({
    model,
    width: String(width),
    height: String(height),
    nologo: "true",
  });
  if (seed !== undefined) params.set("seed", String(seed));
  return `https://image.pollinations.ai/prompt/${encoded}?${params.toString()}`;
}

export function buildStyleTransferUrl(prompt, imageUrl, { width = 1024, height = 1024 } = {}) {
  const encoded = encodeURIComponent(prompt.trim());
  const params = new URLSearchParams({
    model: "kontext",
    image: imageUrl,
    width: String(width),
    height: String(height),
  });
  return `https://image.pollinations.ai/prompt/${encoded}?${params.toString()}`;
}

export function buildTtsUrl(text, voice = "nova") {
  const encoded = encodeURIComponent(text.trim());
  const params = new URLSearchParams({ model: "openai-audio", voice });
  return `https://text.pollinations.ai/${encoded}?${params.toString()}`;
}

export async function sendChatMessage(messages, { model = "openai" } = {}) {
  const res = await fetch("https://text.pollinations.ai/openai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model, messages, temperature: 0.8 }),
  });
  if (!res.ok) {
    throw new Error(`Chat request failed (${res.status})`);
  }
  const data = await res.json();
  return data?.choices?.[0]?.message?.content ?? "";
}

// Video generation: Pollinations only offers this on a paid credit tier, so
// instead we call a free, public Hugging Face Space running an open-source
// video model (Wan2.1), via Gradio's official JS client. This is genuinely
// free and needs no key — but it's shared community infrastructure run by
// volunteers, so expect queueing, occasional downtime, and the possibility
// the Space's API shape changes over time. We introspect the Space's API at
// call time rather than hardcoding parameter names, so small changes on
// their end are less likely to break this outright.
const VIDEO_SPACE_ID = "multimodalart/wan2-1-fast";

export async function generateVideo(prompt, { onStatus } = {}) {
  const { Client } = await import("@gradio/client");
  onStatus?.("Connecting to the video model...");
  const app = await Client.connect(VIDEO_SPACE_ID);

  const api = await app.view_api();
  const endpoints = { ...(api?.named_endpoints || {}) };
  const endpointNames = Object.keys(endpoints);
  if (endpointNames.length === 0) {
    throw new Error("This video Space doesn't expose a usable API right now.");
  }

  // Pick the endpoint whose first parameter looks like a text prompt.
  const chosenName =
    endpointNames.find((name) => {
      const params = endpoints[name]?.parameters || [];
      return params[0]?.python_type?.type === "str" || /prompt/i.test(params[0]?.label || "");
    }) || endpointNames[0];

  const params = endpoints[chosenName]?.parameters || [];
  // Fill the prompt into the first param, leave the rest at their defaults.
  const args = params.map((p, i) => (i === 0 ? prompt : p.parameter_default));

  onStatus?.("Queued — this can take a minute or two on shared infra...");
  const result = await app.predict(chosenName, args);

  const data = result?.data;
  const videoEntry = Array.isArray(data) ? data.find((d) => d?.url || d?.video?.url) : null;
  const url = videoEntry?.url || videoEntry?.video?.url;
  if (!url) {
    throw new Error("The model responded, but no video URL was found in the result.");
  }
  return url;
}

// Uploads a local file to catbox.moe anonymously so it gets a public URL,
// which Pollinations' kontext (image-to-image) model requires as input.
// Free, no signup, no key. https://catbox.moe/tools.php
export async function uploadForStyleTransfer(file) {
  const form = new FormData();
  form.append("reqtype", "fileupload");
  form.append("fileToUpload", file);

  const res = await fetch("https://catbox.moe/user/api.php", {
    method: "POST",
    body: form,
  });
  if (!res.ok) {
    throw new Error("Upload failed — try a smaller image or try again.");
  }
  const url = (await res.text()).trim();
  if (!url.startsWith("http")) {
    throw new Error("Upload didn't return a valid URL.");
  }
  return url;
}
