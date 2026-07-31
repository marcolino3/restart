"use server";

import { gql } from "graphql-request";
import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";

export type SetupStepKey =
  | "ORGANIZATION"
  | "GRADE_LEVELS"
  | "SCHOOL_CLASSES"
  | "EMPLOYEES"
  | "CURRICULUM"
  | "CURRICULUM_CYCLE_LINK"
  | "STUDENTS"
  | "EMAIL"
  | "TIME_TRACKING";

export interface SetupStep {
  key: SetupStepKey;
  done: boolean;
  required: boolean;
  count: number;
}

export interface SetupStatus {
  complete: boolean;
  requiredRemaining: number;
  steps: SetupStep[];
}

type Response = { organizationSetupStatus: SetupStatus };

const Document = gql`
  query GetOrganizationSetupStatus {
    organizationSetupStatus {
      complete
      requiredRemaining
      steps {
        key
        done
        required
        count
      }
    }
  }
`;

export const getSetupStatusAction = async () => {
  try {
    const client = await serverCookieGqlClient();
    const { organizationSetupStatus } =
      await client.request<Response>(Document);
    return { success: true as const, data: organizationSetupStatus };
  } catch (error) {
    console.error(error);
    return { success: false as const, error };
  }
};
