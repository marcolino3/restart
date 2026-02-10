"use client";

import { createContext, useContext } from "react";

export type CurrentUser = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
};

const UserContext = createContext<CurrentUser | null>(null);

export function useUser() {
  return useContext(UserContext);
}

type Props = {
  user: CurrentUser | null;
  children: React.ReactNode;
};

export const UserProvider = ({ user, children }: Props) => {
  return <UserContext.Provider value={user}>{children}</UserContext.Provider>;
};
