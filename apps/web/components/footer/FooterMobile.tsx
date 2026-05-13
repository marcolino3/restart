import React from "react";
import { NewsletterForm } from "./newsletter-form";
import { ContactInfos } from "./contact-infos";
import { SocialMediaButtons } from "./social-media-buttons";
import { QuickLinks } from "./quicklinks";
import Image from "next/image";
import { getTranslations } from "next-intl/server";

export const FooterMobile = async () => {
  const t = await getTranslations("Common");
  return (
    <div className="relative bg-periparto-green-900 w-full md:hidden">
      <div className="max-w-7xl mx-auto px-6 py-16 flex flex-col space-y-8">
        <h2>{t("newletterFooterTitle")}</h2>
        <NewsletterForm slug="" />
        <ContactInfos />
        <SocialMediaButtons iconSize={30} />
        <QuickLinks arrowSize={20} />
      </div>

      {/* Bild IMMER ganz unten rechts im Footer */}
      <div className="absolute bottom-0 right-0 w-1/2 max-w-[300px] aspect-square pointer-events-none">
        <Image
          src="/images/design-elements/design-element-rosa-bottom-right.svg"
          fill
          alt="periparto-icon"
          className="object-contain"
        />
      </div>
    </div>
  );
};
