import UserForm from "@/features/users/components/UserForm";
import React from "react";

interface Props {
  params: Promise<{ userId: string }>;
}

const EditUser = async ({ params }: Props) => {
  const { userId } = await params;

  const user = {
    id: userId,
    email: "marco.marranchelli@me.com",
    description: "Hello World",
  };
  return (
    <div>
      <UserForm user={user} />
    </div>
  );
};

export default EditUser;
