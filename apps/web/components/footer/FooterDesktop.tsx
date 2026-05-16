import { NavigationTreeOutput } from "@restart/shared-types/graphql";
import { cn } from "@/lib/utils";
import { getLocale, getTranslations } from "next-intl/server";
import Link from "next/link";
import { NewsletterForm } from "./newsletter-form";
import { Button } from "../ui/button";
import { SocialMediaButtons } from "./social-media-buttons";
import { ContactInfos } from "./contact-infos";
import Image from "next/image";
import { QuickLinks } from "./quicklinks";

interface Props {
  navigation: NavigationTreeOutput[];
}

export const FooterDesktop = async ({ navigation }: Props) => {
  const locale = await getLocale();
  const language = locale.toLocaleLowerCase();
  const t = await getTranslations("Common");
  const footerTitles = t.raw("footerTitles") as string[];

  return (
    <div className="bg-periparto-green-900 h-full w-full relative">
      <div className="max-w-7xl mx-auto py-24">
        <div className="grid grid-cols-5 gap-x-5 gap-y-[52px]">
          {navigation.map((navItem, index) => (
            <div
              key={navItem.id}
              className={cn(
                index === 0 ? "col-start-1 row-start-1" : "",
                index === 1 ? "col-start-2 row-start-1" : "",
                index === 2 ? "col-start-3 row-start-1" : "",
                index === 3 ? "col-start-1 row-start-2" : "",
                index === 4 ? "col-start-2 row-start-2" : ""
              )}
            >
              <Link
                href={`/${language}/${navItem?.categorySlug}`}
                className=""
              >
                <h3 className="min-h-20">
                  {footerTitles[index] || navItem.name}
                </h3>
              </Link>

              <div className="flex flex-col">
                {navItem.children?.map((childNavItem) => (
                  <div key={childNavItem.id}>
                    <Link
                      href={`/${language}/${navItem?.categorySlug}/${childNavItem?.categorySlug}`}
                    >
                      <span>{childNavItem.name}</span>
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          ))}
          <div className="col-start-4 row-start-1">
            <h3 className="min-h-16">{t("aboutUs")}</h3>
            <SocialMediaButtons iconSize={30} />
            <ContactInfos />
          </div>
          <div className="col-start-5 row-start-1">
            <h3 className="min-h-16">{t("facilitateHelp")}</h3>
            <Button className="bg-periparto-rose-900 font-semibold text-[18px] hover:bg-periparto-sand-900">
              {t("donateNow")}
            </Button>
          </div>
          <div className="col-start-3 row-start-2 col-span-2 flex flex-col space-y-3 ">
            <h3 className="min-h-16">{t("newletterFooterTitle")}</h3>
            <NewsletterForm slug="" />
          </div>
        </div>
        <div className="mt-10">
          <QuickLinks arrowSize={20} />
        </div>
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
