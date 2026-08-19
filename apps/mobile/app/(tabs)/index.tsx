import { Redirect } from "expo-router";

/**
 * The tab group's entry point. "Heute" is the first screen of the design, so
 * `/` forwards there rather than rendering a screen of its own.
 */
export default function TabsIndex() {
  return <Redirect href="/(tabs)/employee" />;
}
