import { ReactNode } from "react";

export default function BuilderProjectLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="h-screen flex flex-col bg-zinc-900 text-white overflow-hidden">
      {children}
    </div>
  );
}
