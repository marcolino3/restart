import Link from "next/link";
import React from "react";

export const ContactInfos = () => {
  return (
    <div className="flex flex-col">
      <Link href="mailto:kontakt@periparto.ch">kontakt@periparto.ch</Link>
      <Link href="tel:+41447202555">044 720 25 55</Link>
    </div>
  );
};
