import { ArrowRight } from "lucide-react";
import Link from "next/link";
import React from "react";

interface Props {
  arrowSize?: number;
}

export const QuickLinks = ({ arrowSize = 20 }: Props) => {
  return (
    <div className="flex flex-col space-y-1 md:flex-row md:space-y-0 md:space-x-4">
      <p className="text-base font-bold mb-2 md:mb-0">Quicklinks</p>
      <div className="flex items-center">
        <Link href="#">Sitemap</Link>
        <ArrowRight size={arrowSize} className="ml-2 inline md:hidden" />
      </div>
      <div className="flex items-center">
        <Link href="#">Impressum</Link>
        <ArrowRight size={arrowSize} className="ml-2 inline md:hidden" />
      </div>
      <div className="flex items-center">
        <Link href="#">Datenschutzerklärung</Link>
        <ArrowRight size={arrowSize} className="ml-2 inline md:hidden" />
      </div>
    </div>
  );
};
