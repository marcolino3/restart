import { notFound } from "next/navigation";

import { getUserByIdAction } from "@/features/users/actions/get-user-by-id.action";
import UserForm from "@/features/users/components/UserForm";

interface Props {
  params: Promise<{ userId: string }>;
}

const EditUserPage = async ({ params }: Props) => {
  const { userId } = await params;
  const response = await getUserByIdAction(userId);

  if (!response.success) {
    notFound();
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">
        {response.data.firstName} {response.data.lastName}
      </h1>
      <UserForm user={response.data} />
    </div>
  );
};

export default EditUserPage;
