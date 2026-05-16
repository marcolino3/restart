import { notFound } from "next/navigation";

import { getUserByIdAction } from "@/features/users/actions/get-user-by-id.action";
import { getActiveOrganizationAction } from "@/features/organizations/actions/get-active-organization.action";
import UserForm from "@/features/users/components/UserForm";

interface Props {
  params: Promise<{ userId: string }>;
}

const EditUserPage = async ({ params }: Props) => {
  const { userId } = await params;
  const [response, orgResult] = await Promise.all([
    getUserByIdAction(userId),
    getActiveOrganizationAction(),
  ]);

  if (!response.success) {
    notFound();
  }

  const orgCountry = orgResult.success ? (orgResult.data?.country ?? null) : null;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">
        {response.data.firstName} {response.data.lastName}
      </h1>
      <UserForm user={response.data} orgCountry={orgCountry} />
    </div>
  );
};

export default EditUserPage;
