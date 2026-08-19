/**
 * "Organisation" — screen 0b of the design, shown after signing in when the
 * account has more than one membership. Substitute teachers work across
 * schools, so the org cannot be inferred.
 *
 * The same surfaces as the login screen: wordmark, greeting, the choices as
 * `.orgpick` rows, and the account line at the foot.
 */
import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import { useSession } from "@/lib/auth-client";
import { ensureActiveOrg, switchOrg } from "@/lib/active-org";
import {
  OrgRow,
  PrimaryButton,
  Separator,
  Wordmark,
} from "@/features/auth/login-ui";
import { PickRow } from "@/features/time-tracking/sheet-ui";
import { t } from "@/lib/i18n";

type Org = { id: string; name?: string | null };

/** "Montessori Zürich" → "MZ", the design's two-letter tile. */
const initialsOf = (name: string): string =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("") || "?";

export default function SelectOrgScreen() {
  const router = useRouter();
  const { data: session, refetch } = useSession();

  const [choices, setChoices] = useState<Org[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const result = await ensureActiveOrg(null);
        if (cancelled) return;
        // A single membership switches itself; nothing left to choose.
        if (result.activeOrgId) {
          await refetch();
          router.replace("/");
          return;
        }
        setChoices(result.choices);
        setSelected(result.choices[0]?.id ?? null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router, refetch]);

  const proceed = async (orgId: string) => {
    setBusy(true);
    try {
      await switchOrg(orgId);
      // The root layout routes on `session.activeOrganizationId`, so the
      // session has to be re-read before leaving — otherwise the redirect
      // sends us straight back here.
      await refetch();
      router.replace("/");
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator />
      </SafeAreaView>
    );
  }

  const selectedOrg = choices.find((o) => o.id === selected);
  const greeting = session?.user?.name
    ? `${t("MobileNav.greetingMorning")}\n${session.user.name}.`
    : t("MobileNav.greetingMorning");

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top", "bottom"]}>
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-[26px] pb-8"
        keyboardShouldPersistTaps="handled"
      >
        <View className="mt-[34px]">
          <Wordmark />
        </View>

        <Text className="mt-[22px] text-[27px] font-semibold leading-tight tracking-tight text-foreground">
          {greeting}
        </Text>
        <Text className="mt-2 text-[13.5px] leading-[1.5] text-muted-foreground">
          {t("SelectOrg.subtitle")}
        </Text>

        {choices.length === 0 ? (
          <Text className="mt-5 text-sm text-muted-foreground">
            {t("SelectOrg.noOrganizations")}
          </Text>
        ) : (
          <View className="mt-5 gap-2.5">
            {choices.map((org) => {
              const name = org.name ?? org.id;
              return (
                <OrgRow
                  key={org.id}
                  initials={initialsOf(name)}
                  caption={
                    org.id === selected
                      ? t("SelectOrg.activeOrganization")
                      : t("SelectOrg.otherOrganization")
                  }
                  name={name}
                  active={org.id === selected}
                  onPress={() => setSelected(org.id)}
                />
              );
            })}
          </View>
        )}

        {selectedOrg ? (
          <PrimaryButton
            className="mt-[22px]"
            label={t("SelectOrg.continueTo", {
              name: selectedOrg.name ?? selectedOrg.id,
            })}
            onPress={() => void proceed(selectedOrg.id)}
            loading={busy}
          />
        ) : null}

        <Separator label={t("SelectOrg.signedInAs")} />

        <PickRow
          icon="face"
          caption={t("SelectOrg.account")}
          value={session?.user?.email ?? "–"}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
