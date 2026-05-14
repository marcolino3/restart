import Link from "next/link";
import React from "react";
import {
  FaFacebookSquare,
  FaInstagramSquare,
  FaLinkedin,
} from "react-icons/fa";

interface Props {
  iconSize: number;
}

export const SocialMediaButtons = ({ iconSize }: Props) => {
  return (
    <div className="flex space-x-2">
      <Link href="https://facebook.com">
        <FaFacebookSquare size={iconSize} />
      </Link>

      <Link href="https://facebook.com">
        <FaInstagramSquare size={iconSize} />
      </Link>
      <Link href="https://facebook.com">
        <FaLinkedin size={iconSize} />
      </Link>
    </div>
  );
};
