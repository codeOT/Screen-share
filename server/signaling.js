"use strict";

const { randomBytes, randomInt } = require("crypto");

const GRACE_MS = 20000;
const MAX_VIEWERS = 8;
const MAX_ROOMS = 500;
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const CODE_RE = /^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$/;
const TOKEN_RE = /^[a-f0-9]{32}$/;

function log(message) {
  console.log(`[screnn] ${message}`);
}

function normalizeCode(value) {
  return String(value || "")
    .toUpperCase()
    .replace(/[^ABCDEFGHJKLMNPQRSTUVWXYZ23456789]/g, "");
}

function isSdp(desc, type) {
  return Boolean(
    desc &&
      desc.type === type &&
      typeof desc.sdp === "string" &&
      desc.sdp.length > 0 &&
      desc.sdp.length < 100000
  );
}

function isId(id) {
  return typeof id === "string" && id.length > 0 && id.length < 200;
}

function isCandidate(candidate) {
  if (!candidate || typeof candidate !== "object") return false;
  if (candidate.candidate !== undefined && typeof candidate.candidate !== "string") return false;
  try {
    return JSON.stringify(candidate).length < 4000;
  } catch {
    return false;
  }
}

function attachSignaling(io) {
  const rooms = new Map();
  const pendingEnd = new Map();

  function makeToken() {
    return randomBytes(16).toString("hex");
  }

  function makeCode() {
    for (let attempt = 0; attempt < 10; attempt += 1) {
      let code = "";
      for (let i = 0; i < 6; i += 1) code += ALPHABET[randomInt(ALPHABET.length)];
      if (!rooms.has(code)) return code;
    }
    return null;
  }

  function cancelPending(id) {
    clearTimeout(pendingEnd.get(id));
    pendingEnd.delete(id);
  }

  function hostRoom(socket) {
    const room = rooms.get(socket.data.roomCode);
    if (!room || room.hostId !== socket.id || socket.data.role !== "host") return null;
    return room;
  }

  function closeRoom(code, reason) {
    const room = rooms.get(code);
    if (!room) return;
    rooms.delete(code);
    cancelPending(room.hostId);
    const host = io.sockets.sockets.get(room.hostId);
    if (host && host.data.roomCode === code) {
      host.leave(code);
      host.data.roomCode = null;
      host.data.role = null;
    }
    for (const id of room.viewers) {
      cancelPending(id);
      const viewer = io.sockets.sockets.get(id);
      if (viewer && viewer.data.roomCode === code) {
        viewer.leave(code);
        viewer.data.roomCode = null;
        viewer.data.role = null;
      }
      io.to(id).emit("host-left", { reason });
    }
    log(`room ${code} ended (${reason})`);
  }

  function leaveViewer(socket) {
    if (socket.data.role !== "viewer") return;
    const code = socket.data.roomCode;
    socket.data.roomCode = null;
    socket.data.role = null;
    if (!code) return;
    socket.leave(code);
    const room = rooms.get(code);
    if (room && room.viewers.delete(socket.id)) {
      io.to(room.hostId).emit("viewer-left", { viewerId: socket.id });
      io.to(room.hostId).emit("viewer-count", { count: room.viewers.size });
    }
  }

  function endByToken(raw) {
    let body = {};
    try {
      body = JSON.parse(raw || "{}");
    } catch {
      body = {};
    }
    const code = normalizeCode(body.code);
    const room = rooms.get(code);
    if (room && body.token === room.token) closeRoom(code, "stopped");
  }

  function on(socket, event, handler) {
    socket.on(event, (...args) => {
      try {
        handler(...args);
      } catch (err) {
        console.error(`[screnn] ${event}`, err);
        const cb = args.find((arg) => typeof arg === "function");
        if (cb) cb({ error: "Something went wrong. Try again." });
      }
    });
  }

  io.on("connection", (socket) => {
    cancelPending(socket.id);

    on(socket, "create-room", (payload = {}, cb) => {
      if (typeof cb !== "function") return;
      const preferred = normalizeCode(payload.code);
      const givenToken = typeof payload.token === "string" ? payload.token : "";

      if (CODE_RE.test(preferred) && TOKEN_RE.test(givenToken)) {
        const existing = rooms.get(preferred);
        if (existing && existing.token === givenToken) {
          existing.hostId = socket.id;
          socket.data.roomCode = preferred;
          socket.data.role = "host";
          socket.join(preferred);
          cancelPending(socket.id);
          cb({ code: preferred, token: givenToken, reclaimed: true });
          return;
        }
      }

      if (socket.data.role === "host" && socket.data.roomCode) {
        closeRoom(socket.data.roomCode, "stopped");
      }

      if (rooms.size >= MAX_ROOMS) {
        cb({ error: "The server is full. Try again in a minute." });
        return;
      }

      const reuse = CODE_RE.test(preferred) && !rooms.has(preferred);
      const code = reuse ? preferred : makeCode();
      if (!code) {
        cb({ error: "Could not start a share. Try again." });
        return;
      }
      const token = TOKEN_RE.test(givenToken) ? givenToken : makeToken();
      rooms.set(code, { code, hostId: socket.id, token, viewers: new Set() });
      socket.data.roomCode = code;
      socket.data.role = "host";
      socket.join(code);
      log(`room ${code} created`);
      cb({ code, token, reclaimed: false });
    });

    on(socket, "ready-for-viewers", () => {
      const room = hostRoom(socket);
      if (!room) return;
      for (const viewerId of room.viewers) {
        socket.emit("viewer-joined", { viewerId });
      }
      socket.emit("viewer-count", { count: room.viewers.size });
    });

    on(socket, "join-room", (payload = {}, cb) => {
      if (typeof cb !== "function") return;
      const code = normalizeCode(payload.code);
      if (!CODE_RE.test(code)) {
        cb({ error: "Enter the 6-character code." });
        return;
      }
      const room = rooms.get(code);
      if (!room) {
        cb({ error: "That code isn't live. Check it with the host." });
        return;
      }
      if (room.hostId === socket.id) {
        cb({ error: "Open this code on another device or another browser tab." });
        return;
      }
      if (room.viewers.has(socket.id)) {
        socket.data.roomCode = code;
        socket.data.role = "viewer";
        socket.join(code);
        io.to(room.hostId).emit("viewer-joined", { viewerId: socket.id });
        cb({ ok: true, code });
        return;
      }
      if (room.viewers.size >= MAX_VIEWERS) {
        cb({ error: "This share already has 8 viewers." });
        return;
      }

      leaveViewer(socket);
      room.viewers.add(socket.id);
      socket.join(code);
      socket.data.roomCode = code;
      socket.data.role = "viewer";
      io.to(room.hostId).emit("viewer-joined", { viewerId: socket.id });
      io.to(room.hostId).emit("viewer-count", { count: room.viewers.size });
      log(`room ${code} joined (${room.viewers.size})`);
      cb({ ok: true, code });
    });

    on(socket, "leave-room", () => {
      if (socket.data.role !== "viewer") return;
      cancelPending(socket.id);
      leaveViewer(socket);
    });

    on(socket, "offer", (payload = {}) => {
      const room = hostRoom(socket);
      if (!room || !isId(payload.viewerId) || !room.viewers.has(payload.viewerId)) return;
      if (!isSdp(payload.offer, "offer")) return;
      io.to(payload.viewerId).emit("offer", { offer: payload.offer });
    });

    on(socket, "answer", (payload = {}) => {
      const room = rooms.get(socket.data.roomCode);
      if (!room || socket.data.role !== "viewer" || !room.viewers.has(socket.id)) return;
      if (!isSdp(payload.answer, "answer")) return;
      io.to(room.hostId).emit("answer", { viewerId: socket.id, answer: payload.answer });
    });

    on(socket, "ice-candidate", (payload = {}) => {
      if (!isCandidate(payload.candidate)) return;
      const room = rooms.get(socket.data.roomCode);
      if (!room) return;
      if (socket.id === room.hostId && socket.data.role === "host") {
        if (!isId(payload.viewerId) || !room.viewers.has(payload.viewerId)) return;
        io.to(payload.viewerId).emit("ice-candidate", { candidate: payload.candidate });
        return;
      }
      if (socket.data.role === "viewer" && room.viewers.has(socket.id)) {
        io.to(room.hostId).emit("ice-candidate", {
          viewerId: socket.id,
          candidate: payload.candidate,
        });
      }
    });

    on(socket, "end-room", () => {
      if (socket.data.role !== "host") return;
      cancelPending(socket.id);
      closeRoom(socket.data.roomCode, "stopped");
    });

    socket.on("disconnect", () => {
      const code = socket.data.roomCode;
      const role = socket.data.role;
      const id = socket.id;
      if (!code || !role) return;
      cancelPending(id);
      const timer = setTimeout(() => {
        pendingEnd.delete(id);
        const live = io.sockets.sockets.get(id);
        if (live && live.connected) return;
        if (role === "host") {
          const room = rooms.get(code);
          if (room && room.hostId === id) closeRoom(code, "dropped");
        } else if (role === "viewer") {
          const room = rooms.get(code);
          if (room && room.viewers.delete(id)) {
            io.to(room.hostId).emit("viewer-left", { viewerId: id });
            io.to(room.hostId).emit("viewer-count", { count: room.viewers.size });
          }
        }
      }, GRACE_MS);
      pendingEnd.set(id, timer);
    });
  });

  return { endByToken };
}

module.exports = { attachSignaling, GRACE_MS };
