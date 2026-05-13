import { getTranslations } from "next-intl/server";

import { getOrganizationsAction } from "@/features/organizations/actions/get-organizations.action";
import CreateUserPageForm from "@/features/users/components/CreateUserPageForm";

const CreateUserPage = async () => {
  const t = await getTranslations("Common");
  const response = await getOrganizationsAction();

  if (!response.success) {
    return <div>{t("error")}</div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">{t("createUser")}</h1>
      <CreateUserPageForm organizations={response.data} />
    </div>
  );
};

export default CreateUserPage;
