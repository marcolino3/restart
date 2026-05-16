import { NavigationTreeOutput } from "@restart/shared-types/graphql";
import { FooterDesktop } from "./FooterDesktop";
import { FooterMobile } from "./FooterMobile";

interface Props {
  navigation: NavigationTreeOutput[];
}

export const Footer = ({ navigation }: Props) => {
  return (
    <>
      <div className="md:hidden">
        <FooterMobile />
      </div>
      <div className="hidden md:block">
        <FooterDesktop navigation={navigation} />
      </div>
    </>
  );
};
