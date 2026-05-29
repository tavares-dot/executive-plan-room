import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type Ctx = { meeting: boolean; toggle: () => void; setMeeting: (b: boolean) => void };
const MeetingCtx = createContext<Ctx | null>(null);

export function MeetingModeProvider({ children }: { children: ReactNode }) {
  const [meeting, setMeeting] = useState(false);
  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.classList.toggle("meeting-mode", meeting);
  }, [meeting]);
  return (
    <MeetingCtx.Provider value={{ meeting, setMeeting, toggle: () => setMeeting((v) => !v) }}>
      {children}
    </MeetingCtx.Provider>
  );
}

export function useMeetingMode() {
  const c = useContext(MeetingCtx);
  if (!c) throw new Error("MeetingModeProvider missing");
  return c;
}
