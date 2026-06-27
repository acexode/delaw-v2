"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

type RightPanelContextValue = {
  content: ReactNode;
  setContent: (node: ReactNode) => void;
};

const RightPanelContext = createContext<RightPanelContextValue | null>(null);

export function RightPanelProvider({ children }: { children: ReactNode }) {
  const [content, setContent] = useState<ReactNode>(null);
  return (
    <RightPanelContext.Provider value={{ content, setContent }}>
      {children}
    </RightPanelContext.Provider>
  );
}

function useRightPanelContext(): RightPanelContextValue {
  const ctx = useContext(RightPanelContext);
  if (!ctx) {
    throw new Error("useRightPanel must be used within RightPanelProvider");
  }
  return ctx;
}

/** Read the current right-panel content (used by the AppShell to render it). */
export function useRightPanelContent(): ReactNode {
  return useRightPanelContext().content;
}

/**
 * Mount content into the AppShell's right panel (320px) for the lifetime of
 * the calling component. The panel is empty until a page fills it.
 */
export function useRightPanel(node: ReactNode): void {
  const { setContent } = useRightPanelContext();
  useEffect(() => {
    setContent(node);
    return () => setContent(null);
  }, [node, setContent]);
}
