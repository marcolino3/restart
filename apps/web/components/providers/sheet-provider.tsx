// components/providers/sheet-provider.tsx
"use client";

import * as React from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useTranslations } from "next-intl";

interface SheetProviderContextType {
  open: (options: {
    title?: string;
    description?: string;
    content: React.ReactNode;
    side?: "left" | "right" | "top" | "bottom";
  }) => void;
  close: () => void;
}

const SheetProviderContext =
  React.createContext<SheetProviderContextType | null>(null);

export const useSheet = () => {
  const context = React.useContext(SheetProviderContext);
  if (!context) throw new Error("useSheet must be used within a SheetProvider");
  return context;
};

export const SheetProvider = ({ children }: { children: React.ReactNode }) => {
  const t = useTranslations("Common");

  const [isOpen, setIsOpen] = React.useState(false);
  const [content, setContent] = React.useState<React.ReactNode>(null);
  const [title, setTitle] = React.useState<string | undefined>();
  const [description, setDescription] = React.useState<string | undefined>();
  const [side, setSide] = React.useState<"left" | "right" | "top" | "bottom">(
    "right"
  );

  const open = ({
    content,
    title,
    description,
    side = "right",
  }: {
    title?: string;
    description?: string;
    content: React.ReactNode;
    side?: "left" | "right" | "top" | "bottom";
  }) => {
    setTitle(title);
    setDescription(description);
    setContent(content);
    setSide(side);
    setIsOpen(true);
  };

  const close = () => {
    setIsOpen(false);
    setTimeout(() => {
      setContent(null);
      setTitle(undefined);
      setDescription(undefined);
    }, 300); // delay until animation ends
  };

  return (
    <SheetProviderContext.Provider value={{ open, close }}>
      {children}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent side={side}>
          {(title || description) && (
            <SheetHeader>
              {title && (
                <SheetTitle className="text-2xl">{t(title)}</SheetTitle>
              )}
              {description && (
                <SheetDescription>{t(description)}</SheetDescription>
              )}
            </SheetHeader>
          )}
          <div className="m-4">{content}</div>
        </SheetContent>
      </Sheet>
    </SheetProviderContext.Provider>
  );
};
