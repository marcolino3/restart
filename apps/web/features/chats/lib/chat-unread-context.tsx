"use client";

import { createContext, useContext } from "react";

/**
 * Total unread chat message count for the current user, surfaced to the
 * sidebar badge. The ChatRealtimeProvider (rendered inside the chats feature)
 * keeps this live via the messageAdded subscription; outside the provider it
 * defaults to 0 so the sidebar renders without a badge.
 */
const ChatUnreadContext = createContext<number>(0);

export const ChatUnreadProvider = ChatUnreadContext.Provider;

export function useChatUnread(): number {
  return useContext(ChatUnreadContext);
}
