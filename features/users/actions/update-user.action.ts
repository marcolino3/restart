import { UserFormType } from "../schemas/user-form.schema";

export const updateUserAction = async (
  values: Partial<UserFormType> & { id: string }
) => {
  console.log(values);
  return { success: true };
};
