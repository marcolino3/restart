import { getTranslations } from "next-intl/server";
import { getConversationsAction } from "@/features/chats/actions/get-conversations.action";
import { ChatsClient } from "@/features/chats/components/ChatsClient";
import { getCurrentUserAction } from "@/features/users/actions/get-current-user.action";
import { canSeeChats } from "@/lib/navigation/nav-visibility";

const ChatsPage = async () => {
  const t = await getTranslations("Chats");

  // Spiegel der Nav-Sichtbarkeit: ohne aktiviertes Org-Feature auch kein
  // Direktzugriff per URL.
  const userRes = await getCurrentUserAction();
  if (!canSeeChats(userRes?.data)) {
    return <div className="p-6 text-sm text-destructive">{t("loadError")}</div>;
  }

  const res = await getConversationsAction();

  if (!res.success) {
    // A SuperAdmin operating without an org membership has no chat identity —
    // consistent with the admin layout, they may still navigate here, so we
    // render the empty messenger shell instead of a hard error (their chat
    // list is simply empty). Only genuine load failures surface as an error.
    if (/no active membership/i.test(res.error ?? "")) {
      return <ChatsClient initialConversations={[]} selfMembershipId="" />;
    }
    return (
      <div className="p-6 text-sm text-destructive">
        {res.error ?? t("loadError")}
      </div>
    );
  }

  return (
    <ChatsClient
      initialConversations={res.data.conversations}
      selfMembershipId={res.data.selfMembershipId}
    />
  );
};

export default ChatsPage;
