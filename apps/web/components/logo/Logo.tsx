import { RocketIcon } from "lucide-react";
import React from "react";

export const Logo = () => {
  return (
    <div className="flex items-center justify-center gap-x-5">
      <RocketIcon className="size-10 inline font-bold" />
      <span className="text-5xl font-bold">Restart</span>
    </div>
  );
};
