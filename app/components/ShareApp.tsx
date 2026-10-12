"use client";

import { normalizeCode } from "../lib/codes";
import { useShareSession } from "../hooks/useShareSession";
import { EndedScreen, HomeScreen, HostScreen, JoinScreen, WatchScreen } from "./screens";

export default function ShareApp() {
  const session = useShareSession();

  return (
    <>
      {session.banner ? (
        <div className="sticky top-0 z-30 bg-ink px-4 py-2 text-center text-sm font-semibold text-white">
          {session.banner}
        </div>
      ) : null}
      {session.view === "home" ? (
        <HomeScreen
          onShare={session.startShare}
          onJoin={session.openJoin}
          busy={session.busy}
          status={session.status}
          statusBad={session.statusBad}
        />
      ) : null}
      {session.view === "join" ? (
        <JoinScreen
          value={session.joinInput}
          onChange={(value) => session.setJoinInput(normalizeCode(value))}
          onSubmit={session.submitJoin}
          onBack={session.goHome}
          busy={session.busy}
          status={session.status}
          statusBad={session.statusBad}
        />
      ) : null}
      {session.view === "host" ? (
        <HostScreen
          code={session.code}
          viewerCount={session.viewerCount}
          localVideoRef={session.localVideoRef}
          onStop={session.endShare}
          status={session.status}
          statusBad={session.statusBad}
        />
      ) : null}
      {session.view === "watch" ? (
        <WatchScreen
          code={session.code}
          remoteVideoRef={session.remoteVideoRef}
          waiting={session.waiting}
          soundLocked={session.soundLocked}
          onSound={session.enableSound}
          onLeave={session.goHome}
          status={session.status}
          statusBad={session.statusBad}
        />
      ) : null}
      {session.view === "ended" ? (
        <EndedScreen reason={session.endedReason} onRetry={session.retryJoin} onHome={session.goHome} />
      ) : null}
    </>
  );
}
