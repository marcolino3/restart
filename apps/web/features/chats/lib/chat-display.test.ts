import { describe, it, expect } from "vitest";
import {
  initials,
  senderName,
  conversationTitle,
  type Conversation,
} from "./chat-display";

const FALLBACKS = { direct: "Former member", group: "Group", team: "Team" };

function makeParticipant(membershipId: string, first?: string, last?: string) {
  return {
    id: `p-${membershipId}`,
    membershipId,
    role: "MEMBER",
    membership:
      first || last
        ? { id: membershipId, user: { id: "u", firstName: first ?? "", lastName: last ?? "" } }
        : null,
  } as unknown as NonNullable<Conversation["participants"]>[number];
}

describe("initials", () => {
  it("takes first+last initial", () => {
    expect(initials("Mia Keller")).toBe("MK");
  });
  it("handles a single name", () => {
    expect(initials("Sarah")).toBe("SA");
  });
});

describe("senderName", () => {
  it("joins first and last name", () => {
    expect(
      senderName({ user: { firstName: "Mia", lastName: "Keller" } }, "x"),
    ).toBe("Mia Keller");
  });
  it("falls back when the user is gone", () => {
    expect(senderName(null, "Former member")).toBe("Former member");
  });
});

describe("conversationTitle", () => {
  it("uses the group name for GROUP", () => {
    const conv = { type: "GROUP", name: "Sommerfest 2026", participants: [] } as unknown as Conversation;
    expect(conversationTitle(conv, "me", FALLBACKS)).toBe("Sommerfest 2026");
  });

  it("uses the team name for TEAM", () => {
    const conv = {
      type: "TEAM",
      name: null,
      team: { id: "t", name: "Team Unterstufe" },
      participants: [],
    } as unknown as Conversation;
    expect(conversationTitle(conv, "me", FALLBACKS)).toBe("Team Unterstufe");
  });

  it("uses the OTHER participant's name for DIRECT", () => {
    const conv = {
      type: "DIRECT",
      name: null,
      participants: [
        makeParticipant("me", "Me", "Self"),
        makeParticipant("other", "Thomas", "Weber"),
      ],
    } as unknown as Conversation;
    expect(conversationTitle(conv, "me", FALLBACKS)).toBe("Thomas Weber");
  });

  it("falls back to group label when a group has no name", () => {
    const conv = { type: "GROUP", name: null, participants: [] } as unknown as Conversation;
    expect(conversationTitle(conv, "me", FALLBACKS)).toBe("Group");
  });
});
