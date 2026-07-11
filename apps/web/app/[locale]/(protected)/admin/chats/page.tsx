import { getTranslations } from "next-intl/server";
import { getConversationsAction } from "@/features/chats/actions/get-conversations.action";
import { ChatsClient } from "@/features/chats/components/ChatsClient";

const ChatsPage = async () => {
  const t = await getTranslations("Chats");
  const res = await getConversationsAction();

  if (!res.success) {
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
