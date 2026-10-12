"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { io, type Socket } from "socket.io-client";
import { CODE_RE, normalizeCode } from "../lib/codes";
import { fetchSession, FREE_SHARE_LIMIT, recordShare, type Account } from "../lib/account";

type Role = "idle" | "host" | "viewer";
type View = "home" | "join" | "host" | "watch" | "ended";
type EndReason = "stopped" | "dropped";

type Ack = {
  ok?: boolean;
  error?: string;
  code?: string;
  token?: string;
  reclaimed?: boolean;
};

type PeerEntry = {
  pc: RTCPeerConnection;
  pendingIce: RTCIceCandidateInit[];
  remoteSet: boolean;
};

type SignalPayload = {
  viewerId?: string;
  count?: number;
  offer?: RTCSessionDescriptionInit;
  answer?: RTCSessionDescriptionInit;
  candidate?: RTCIceCandidateInit;
  reason?: EndReason;
};

const ICE: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun.cloudflare.com:3478" },
  ],
};

function emit(socket: Socket | null, event: string, payload?: object): Promise<Ack> {
  return new Promise((resolve) => {
    if (!socket) {
      resolve({ error: "Not connected to the server yet." });
      return;
    }
    const timer = setTimeout(() => resolve({ error: "The server did not respond." }), 8000);
    socket.emit(event, payload ?? {}, (res: Ack | undefined) => {
      clearTimeout(timer);
      resolve(res || { error: "No response from the server." });
    });
  });
}

function stopStream(stream: MediaStream | null) {
  if (!stream) return;
  for (const track of stream.getTracks()) track.stop();
}

async function captureScreen() {
  const attempts: DisplayMediaStreamOptions[] = [
    { video: { frameRate: { ideal: 30, max: 30 } }, audio: true },
    { video: true, audio: false },
  ];
  let lastError: unknown;
  for (const constraints of attempts) {
    try {
      return await navigator.mediaDevices.getDisplayMedia(constraints);
    } catch (err) {
      lastError = err;
      const name = err && typeof err === "object" && "name" in err ? String(err.name) : "";
      if (name === "NotAllowedError" || name === "AbortError") throw err;
    }
  }
  throw lastError instanceof Error ? lastError : new Error("Could not start screen sharing.");
}

function shareErrorMessage(err: unknown) {
  const name = err && typeof err === "object" && "name" in err ? String(err.name) : "";
  if (name === "NotAllowedError" || name === "AbortError") {
    return "Screen sharing was cancelled. Try again when you want to share.";
  }
  if (typeof window !== "undefined" && !window.isSecureContext) {
    return "Screen sharing needs a secure page. Open this site on localhost or HTTPS.";
  }
  return "Could not start screen sharing. Use Chrome, Edge, or Firefox on a computer.";
}

async function addCandidate(pc: RTCPeerConnection, candidate: RTCIceCandidateInit) {
  try {
    await pc.addIceCandidate(candidate);
  } catch {
    // A candidate can arrive after the peer connection closes.
  }
}

export function useShareSession(options?: { keepPath?: boolean }) {
  const keepPath = options?.keepPath ?? false;
  const params = useSearchParams();
  const searched = normalizeCode(params.get("code") || "");
  const openJoinOnLoad = params.get("join") === "1" && searched.length !== 6;

  const [view, setView] = useState<View>(searched.length === 6 || openJoinOnLoad ? "join" : "home");
  const [code, setCode] = useState("");
  const [joinInput, setJoinInput] = useState(searched);
  const [status, setStatus] = useState("");
  const [statusBad, setStatusBad] = useState(false);
  const [banner, setBanner] = useState("");
  const [viewerCount, setViewerCount] = useState(0);
  const [busy, setBusy] = useState(false);
  const [waiting, setWaiting] = useState(true);
  const [soundLocked, setSoundLocked] = useState(false);
  const [endedReason, setEndedReason] = useState<EndReason>("stopped");

  const roleRef = useRef<Role>("idle");
  const streamRef = useRef<MediaStream | null>(null);
  const peersRef = useRef<Map<string, PeerEntry>>(new Map());
  const viewerPcRef = useRef<RTCPeerConnection | null>(null);
  const viewerPendingIceRef = useRef<RTCIceCandidateInit[]>([]);
  const viewerRemoteSetRef = useRef(false);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const codeRef = useRef("");
  const tokenRef = useRef("");
  const socketRef = useRef<Socket | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const connectTimerRef = useRef<number | null>(null);
  const genRef = useRef(0);
  const shareLock = useRef(false);
  const joinGen = useRef(0);
  const autoTried = useRef(false);
  const presetRef = useRef(searched);
  const submitJoinRef = useRef<(code: string) => Promise<void>>(async () => {});
  const attachRemoteRef = useRef<(stream: MediaStream) => void>(() => {});
  presetRef.current = searched;

  function showStatus(message: string, bad = false) {
    setStatus(message || "");
    setStatusBad(bad);
  }

  function resetPeers() {
    for (const entry of peersRef.current.values()) entry.pc.close();
    peersRef.current.clear();
  }

  function resetViewerPc() {
    if (viewerPcRef.current) {
      viewerPcRef.current.close();
      viewerPcRef.current = null;
    }
    viewerPendingIceRef.current = [];
    viewerRemoteSetRef.current = false;
    remoteStreamRef.current = null;
  }

  function clearConnectTimer() {
    if (connectTimerRef.current !== null) window.clearTimeout(connectTimerRef.current);
    connectTimerRef.current = null;
  }

  function armConnectTimer() {
    clearConnectTimer();
    connectTimerRef.current = window.setTimeout(() => {
      const video = remoteVideoRef.current;
      if (roleRef.current === "viewer" && (!video || !video.videoWidth)) {
        showStatus(
          "Still connecting. If this stays blank, this network may be blocking a direct video connection."
        );
      }
    }, 12000);
  }

  function attachRemote(stream: MediaStream) {
    remoteStreamRef.current = stream;
    const video = remoteVideoRef.current;
    if (!video) return;
    if (video.srcObject !== stream) video.srcObject = stream;
    setWaiting(false);
    clearConnectTimer();
    const playback = video.play();
    if (!playback) return;
    playback.catch(() => {
      video.muted = true;
      video.play().catch(() => {});
      if (stream.getAudioTracks().length > 0) setSoundLocked(true);
    });
  }
  attachRemoteRef.current = attachRemote;

  function endShare() {
    if (roleRef.current !== "host") return;
    roleRef.current = "idle";
    resetPeers();
    stopStream(streamRef.current);
    streamRef.current = null;
    socketRef.current?.emit("end-room");
    codeRef.current = "";
    tokenRef.current = "";
    setCode("");
    setViewerCount(0);
    setView("home");
    showStatus("Sharing stopped.");
  }

  async function startShare() {
    if (shareLock.current || roleRef.current === "host") return;
    let me: Account | null = null;
    try {
      me = await fetchSession();
    } catch {
      me = null;
    }
    if (me && me.sharesUsed >= FREE_SHARE_LIMIT) {
      showStatus("The free plan includes 3 shares.", true);
      return;
    }
    shareLock.current = true;
    setBusy(true);
    showStatus("");
    const gen = genRef.current;
    try {
      if (!navigator.mediaDevices?.getDisplayMedia) {
        const unsupported = new Error("unsupported");
        unsupported.name = "NotSupportedError";
        throw unsupported;
      }
      const stream = await captureScreen();
      if (gen !== genRef.current) {
        stopStream(stream);
        return;
      }
      const res = await emit(socketRef.current, "create-room", {});
      if (gen !== genRef.current) {
        stopStream(stream);
        return;
      }
      if (!res.code) {
        stopStream(stream);
        showStatus(res.error || "Could not start the share.", true);
        return;
      }
      streamRef.current = stream;
      for (const track of stream.getVideoTracks()) {
        track.onended = () => endShare();
      }
      roleRef.current = "host";
      tokenRef.current = res.token ?? "";
      codeRef.current = res.code;
      setCode(res.code);
      setViewerCount(0);
      setView("host");
      showStatus("");
      if (me) {
        try {
          await recordShare();
        } catch (err) {
          endShare();
          if (gen === genRef.current) {
            showStatus(err instanceof Error ? err.message : "Could not record the share.", true);
          }
          return;
        }
      }
      socketRef.current?.emit("ready-for-viewers");
    } catch (err) {
      if (gen === genRef.current) showStatus(shareErrorMessage(err), true);
    } finally {
      shareLock.current = false;
      if (gen === genRef.current) setBusy(false);
    }
  }

  async function submitJoin(raw: string) {
    const next = normalizeCode(raw);
    if (!CODE_RE.test(next)) {
      setView("join");
      setJoinInput(next);
      showStatus("Enter the 6-character code.", true);
      return;
    }
    setBusy(true);
    showStatus("");
    const gen = genRef.current;
    const joinId = ++joinGen.current;
    // Mark this tab as a viewer before the server replies. The host can send
    // the video offer as soon as the join is registered, which is before this
    // request's reply comes back.
    resetViewerPc();
    roleRef.current = "viewer";
    codeRef.current = next;
    const res = await emit(socketRef.current, "join-room", { code: next });
    if (gen !== genRef.current || joinId !== joinGen.current) return;
    setBusy(false);
    if (!res.ok) {
      roleRef.current = "idle";
      codeRef.current = "";
      resetViewerPc();
      setView("join");
      setJoinInput(next);
      showStatus(res.error || "Could not join.", true);
      return;
    }
    const roomCode = res.code ?? next;
    codeRef.current = roomCode;
    setCode(roomCode);
    setJoinInput(roomCode);
    setSoundLocked(false);
    setWaiting(true);
    setView("watch");
    showStatus("");
    armConnectTimer();
  }
  submitJoinRef.current = submitJoin;

  function openJoin() {
    showStatus("");
    setView("join");
  }

  function goHome() {
    if (roleRef.current === "host") return;
    joinGen.current += 1;
    setBusy(false);
    if (roleRef.current === "viewer") {
      socketRef.current?.emit("leave-room");
      resetViewerPc();
      roleRef.current = "idle";
    }
    clearConnectTimer();
    codeRef.current = "";
    setCode("");
    setBanner("");
    showStatus("");
    if (typeof window !== "undefined" && new URLSearchParams(window.location.search).get("join") === "1") {
      window.history.replaceState({}, "", "/");
    }
    setView("home");
  }

  function retryJoin() {
    const existing = codeRef.current;
    setJoinInput(existing);
    void submitJoin(existing);
  }

  function enableSound() {
    const video = remoteVideoRef.current;
    if (!video) return;
    video.muted = false;
    video.play().then(() => setSoundLocked(false)).catch(() => {});
  }

  useEffect(() => {
    const gen = ++genRef.current;
    const socket = io({ reconnection: true });
    socketRef.current = socket;

    async function connectViewer(viewerId: string) {
      if (roleRef.current !== "host" || !streamRef.current) return;
      const existing = peersRef.current.get(viewerId);
      if (existing) {
        if (existing.pc.connectionState === "connected") return;
        existing.pc.close();
        peersRef.current.delete(viewerId);
      }
      const pc = new RTCPeerConnection(ICE);
      const entry = { pc, pendingIce: [], remoteSet: false };
      peersRef.current.set(viewerId, entry);
      for (const track of streamRef.current.getTracks()) {
        pc.addTrack(track, streamRef.current);
      }
      pc.onicecandidate = (event) => {
        if (event.candidate) socket.emit("ice-candidate", { viewerId, candidate: event.candidate });
      };
      try {
        const offer = await pc.createOffer();
        if (peersRef.current.get(viewerId)?.pc !== pc) return;
        await pc.setLocalDescription(offer);
        socket.emit("offer", { viewerId, offer: pc.localDescription });
      } catch (err) {
        console.error(err);
        pc.close();
        peersRef.current.delete(viewerId);
      }
    }

    async function acceptOffer(offer: RTCSessionDescriptionInit) {
      if (roleRef.current !== "viewer") return;
      if (viewerPcRef.current) {
        viewerPcRef.current.close();
        viewerPcRef.current = null;
      }
      viewerRemoteSetRef.current = false;
      const pc = new RTCPeerConnection(ICE);
      viewerPcRef.current = pc;
      pc.ontrack = (event) => {
        const stream = event.streams[0];
        if (stream) attachRemoteRef.current(stream);
      };
      pc.onicecandidate = (event) => {
        if (event.candidate) socket.emit("ice-candidate", { candidate: event.candidate });
      };
      pc.onconnectionstatechange = () => {
        if (pc.connectionState === "failed" && roleRef.current === "viewer") {
          showStatus("Could not connect to the host. Try the code again.", true);
        }
      };
      try {
        await pc.setRemoteDescription(offer);
        viewerRemoteSetRef.current = true;
        const queued = viewerPendingIceRef.current.splice(0);
        for (const candidate of queued) await addCandidate(pc, candidate);
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit("answer", { answer: pc.localDescription });
      } catch (err) {
        console.error(err);
        showStatus("Could not open the video connection.", true);
      }
    }

    async function keepHostRoom() {
      resetPeers();
      const res = await emit(socket, "create-room", {
        code: codeRef.current,
        token: tokenRef.current,
      });
      if (gen !== genRef.current) return;
      if (!res.code) {
        const oldCode = codeRef.current;
        const oldToken = tokenRef.current;
        roleRef.current = "idle";
        stopStream(streamRef.current);
        streamRef.current = null;
        codeRef.current = "";
        tokenRef.current = "";
        setCode("");
        setView("home");
        showStatus("The share ended because the connection dropped.", true);
        if (oldCode && oldToken) {
          fetch("/api/end", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ code: oldCode, token: oldToken }),
          }).catch(() => {});
        }
        return;
      }
      tokenRef.current = res.token ?? "";
      codeRef.current = res.code ?? codeRef.current;
      setCode(codeRef.current);
      if (!res.reclaimed) showStatus("Connection reset. Share this code if someone is waiting.");
      socket.emit("ready-for-viewers");
    }

    async function rejoinViewer() {
      const roomCode = codeRef.current;
      for (let attempt = 0; attempt < 3; attempt += 1) {
        const res = await emit(socket, "join-room", { code: roomCode });
        if (gen !== genRef.current) return;
        if (res.ok) {
          setWaiting(true);
          setView("watch");
          armConnectTimer();
          return;
        }
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
      if (roleRef.current !== "viewer") return;
      resetViewerPc();
      roleRef.current = "idle";
      setEndedReason("dropped");
      setView("ended");
    }

    socket.on("connect", () => {
      if (gen !== genRef.current) return;
      setBanner("");
      if (roleRef.current === "host" && codeRef.current) {
        if (!socket.recovered) void keepHostRoom();
        else socket.emit("ready-for-viewers");
      } else if (roleRef.current === "viewer" && codeRef.current && !socket.recovered) {
        void rejoinViewer();
      }
    });

    socket.on("disconnect", (reason: string) => {
      if (reason === "io client disconnect") return;
      if (roleRef.current === "host" || roleRef.current === "viewer") setBanner("Reconnecting…");
    });

    socket.on("viewer-joined", (payload: SignalPayload) => {
      if (payload.viewerId) void connectViewer(payload.viewerId);
    });

    socket.on("viewer-left", (payload: SignalPayload) => {
      if (!payload.viewerId) return;
      const entry = peersRef.current.get(payload.viewerId);
      if (!entry) return;
      entry.pc.close();
      peersRef.current.delete(payload.viewerId);
    });

    socket.on("viewer-count", (payload: SignalPayload) => {
      setViewerCount(payload.count ?? 0);
    });

    socket.on("offer", (payload: SignalPayload) => {
      if (payload.offer) void acceptOffer(payload.offer);
    });

    socket.on("answer", async (payload: SignalPayload) => {
      if (!payload.viewerId || !payload.answer) return;
      const entry = peersRef.current.get(payload.viewerId);
      if (!entry) return;
      try {
        await entry.pc.setRemoteDescription(payload.answer);
        entry.remoteSet = true;
        const queued = entry.pendingIce.splice(0);
        for (const candidate of queued) await addCandidate(entry.pc, candidate);
      } catch (err) {
        console.error(err);
      }
    });

    socket.on("ice-candidate", async (payload: SignalPayload) => {
      if (!payload.candidate) return;
      if (roleRef.current === "host") {
        if (!payload.viewerId) return;
        const entry = peersRef.current.get(payload.viewerId);
        if (!entry) return;
        if (!entry.remoteSet) entry.pendingIce.push(payload.candidate);
        else await addCandidate(entry.pc, payload.candidate);
        return;
      }
      if (roleRef.current !== "viewer") return;
      if (!viewerPcRef.current || !viewerRemoteSetRef.current) {
        viewerPendingIceRef.current.push(payload.candidate);
        return;
      }
      await addCandidate(viewerPcRef.current, payload.candidate);
    });

    socket.on("host-left", (payload: SignalPayload = {}) => {
      if (roleRef.current !== "viewer") return;
      resetViewerPc();
      roleRef.current = "idle";
      clearConnectTimer();
      setWaiting(false);
      setBanner("");
      setEndedReason(payload.reason || "stopped");
      setView("ended");
    });

    if (!autoTried.current && CODE_RE.test(presetRef.current)) {
      autoTried.current = true;
      void submitJoinRef.current(presetRef.current);
    }

    return () => {
      genRef.current += 1;
      clearConnectTimer();
      socket.disconnect();
      if (socketRef.current === socket) socketRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (view !== "host") return;
    const video = localVideoRef.current;
    const stream = streamRef.current;
    if (!video || !stream) return;
    video.srcObject = stream;
    video.muted = true;
    video.play().catch(() => {});
  }, [view, code]);

  useEffect(() => {
    if (view === "watch" && remoteStreamRef.current) {
      attachRemoteRef.current(remoteStreamRef.current);
    }
  }, [view]);

  useEffect(() => {
    if (view === "host" && code) document.title = `Hosting ${code} · Screnn`;
    else if ((view === "watch" || view === "ended" || view === "join") && code) {
      document.title = `Watching ${code} · Screnn`;
    } else document.title = "Screnn";
  }, [view, code]);

  useEffect(() => {
    if (keepPath) return;
    if (view === "watch" && code) window.history.replaceState({}, "", `/?code=${code}`);
    else if (view === "home" || view === "host") window.history.replaceState({}, "", "/");
  }, [view, code, keepPath]);

  useEffect(() => {
    function onHide(event: PageTransitionEvent) {
      if (event.persisted || roleRef.current !== "host") return;
      const roomCode = codeRef.current;
      const token = tokenRef.current;
      if (!roomCode || !token) return;
      const body = JSON.stringify({ code: roomCode, token });
      navigator.sendBeacon("/api/end", new Blob([body], { type: "application/json" }));
    }
    window.addEventListener("pagehide", onHide);
    return () => window.removeEventListener("pagehide", onHide);
  }, []);

  return {
    view,
    code,
    joinInput,
    setJoinInput,
    status,
    statusBad,
    banner,
    viewerCount,
    busy,
    waiting,
    soundLocked,
    endedReason,
    localVideoRef,
    remoteVideoRef,
    startShare,
    submitJoin,
    openJoin,
    endShare,
    goHome,
    retryJoin,
    enableSound,
  };
}
