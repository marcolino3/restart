"use client";

interface UserFormProps {
  user: {
    id: string;
    email: string;
    description: string;
  };
}

export default function UserForm({ user }: UserFormProps) {
  return (
    <div>
      <h2>Edit User: {user.email}</h2>
      <p>{user.description}</p>
    </div>
  );
}
