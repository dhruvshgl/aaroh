"use client";

import { Toaster as Sonner, type ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      position="bottom-center"
      offset={24}
      mobileOffset={{ bottom: 88 }}
      className="toaster group"
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "1rem",
          "--success-bg": "var(--popover)",
          "--success-text": "var(--success-foreground)",
          "--error-bg": "var(--popover)",
          "--error-text": "var(--danger-foreground)",
        } as React.CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };
