import { graphql } from "@/gql";
import { executeGraphQL } from "@/lib/actions/execute-graphql";
import { CreateOrganizationMutation } from "@/gql/graphql";
import { CreateOrganizationSlugFormType } from "../schemas/create-organization-slug-form.schema";

const CreateOrganizationDocument = graphql(`
  mutation CreateOrganization(
    $createOrganizationInput: CreateOrganizationInput!
  ) {
    createOrganization(createOrganizationInput: $createOrganizationInput) {
      id
    }
  }
`);

export async function createOrganizationAction(
  values: CreateOrganizationSlugFormType
) {
  return executeGraphQL<CreateOrganizationMutation["createOrganization"]>(
    async (client) => {
      const { createOrganization } = await client.request(
        CreateOrganizationDocument,
        {
          createOrganizationInput: values,
        }
      );
      return createOrganization;
    }
  );
}
