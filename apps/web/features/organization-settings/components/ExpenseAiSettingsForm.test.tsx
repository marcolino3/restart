import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import type { ExpenseAiSettings } from "../actions/ai-settings-actions";
import { ExpenseAiSettingsForm } from "./ExpenseAiSettingsForm";

const actions = vi.hoisted(() => ({
  getExpenseAiModelsAction: vi.fn(),
  revealExpenseAiKeyAction: vi.fn(),
  saveExpenseAiSettingsAction: vi.fn(),
}));

vi.mock("../actions/ai-settings-actions", () => actions);
vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));
vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const ORG = "org-1";

const settings = (patch: Partial<ExpenseAiSettings> = {}): ExpenseAiSettings => ({
  provider: "contracts",
  model: "mistral-large-latest",
  apiKeySet: false,
  apiKeyHint: "",
  contractKeySet: true,
  contractKeyHint: "••••••••wxyz",
  contractModel: "mistral-large-latest",
  ...patch,
});

const renderForm = (initial: ExpenseAiSettings, canManage = true) =>
  render(
    <ExpenseAiSettingsForm
      organizationId={ORG}
      initial={initial}
      canManage={canManage}
    />,
  );

describe("ExpenseAiSettingsForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    actions.getExpenseAiModelsAction.mockResolvedValue({
      success: true,
      data: {
        models: [{ id: "mistral-large-latest", displayName: null }],
        errorCode: null,
      },
    });
    actions.revealExpenseAiKeyAction.mockResolvedValue({
      success: true,
      value: "full-secret-key",
    });
    actions.saveExpenseAiSettingsAction.mockResolvedValue({ success: true });
  });

  it("shows only the end of the stored key until it is revealed", async () => {
    renderForm(settings());

    const input = screen.getByLabelText("shiftAiApiKeyLabel");
    expect(input).toHaveAttribute("placeholder", "••••••••wxyz");
    expect(input).toHaveValue("");
    expect(actions.revealExpenseAiKeyAction).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "aiKeyShow" }));

    await waitFor(() => expect(input).toHaveValue("full-secret-key"));
    expect(input).toHaveAttribute("type", "text");
    expect(actions.revealExpenseAiKeyAction).toHaveBeenCalledWith(
      ORG,
      "contracts",
    );

    fireEvent.click(screen.getByRole("button", { name: "aiKeyHide" }));
    expect(input).toHaveValue("");
  });

  it("never saves the revealed key back", async () => {
    renderForm(
      settings({
        provider: "openai",
        model: "gpt-5",
        apiKeySet: true,
        apiKeyHint: "••••••••abcd",
      }),
    );

    fireEvent.click(screen.getByRole("button", { name: "aiKeyShow" }));
    await waitFor(() =>
      expect(screen.getByLabelText("shiftAiApiKeyLabel")).toHaveValue(
        "full-secret-key",
      ),
    );
    fireEvent.click(screen.getByRole("button", { name: "save" }));

    await waitFor(() =>
      expect(actions.saveExpenseAiSettingsAction).toHaveBeenCalledWith({
        organizationId: ORG,
        provider: "openai",
        model: "gpt-5",
        apiKey: "",
      }),
    );
  });

  it("copies the stored key to the clipboard", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });
    renderForm(settings());

    fireEvent.click(screen.getByRole("button", { name: "aiKeyCopy" }));

    await waitFor(() => expect(writeText).toHaveBeenCalledWith("full-secret-key"));
    expect(screen.getByLabelText("shiftAiApiKeyLabel")).toHaveValue("");
  });

  it("loads the models of the contract key into a dropdown", async () => {
    renderForm(settings());

    await waitFor(() =>
      expect(actions.getExpenseAiModelsAction).toHaveBeenCalledWith("contracts"),
    );
    const select = await screen.findByRole("combobox", { name: "aiModelLabel" });
    expect(select).toHaveTextContent("mistral-large-latest");
  });

  it("falls back to a text field while no key is stored", () => {
    renderForm(settings({ contractKeySet: false, contractKeyHint: "" }));

    expect(actions.getExpenseAiModelsAction).not.toHaveBeenCalled();
    expect(screen.getByLabelText("aiModelLabel")).toHaveValue(
      "mistral-large-latest",
    );
    expect(screen.getByText("aiModelsNoKey")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "aiKeyShow" })).toBeDisabled();
  });

  it("offers neither reveal nor copy without the manage right", () => {
    renderForm(settings(), false);

    expect(screen.queryByRole("button", { name: "aiKeyShow" })).toBeNull();
    expect(screen.queryByRole("button", { name: "aiKeyCopy" })).toBeNull();
    expect(actions.getExpenseAiModelsAction).not.toHaveBeenCalled();
  });
});
