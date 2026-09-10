"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { Loader2, SendHorizontal, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

import { getEmployeeFunctionsAction } from "@/features/employee-functions/actions/get-employee-functions.action";
import {
  contractAiChatAction,
  type ContractAiChatMessage,
} from "../actions/contract-ai.action";

/** Guided context questions asked one by one before the AI drafts. */
const WIZARD_STEPS = ["role", "type", "workload", "clauses"] as const;
type WizardStep = (typeof WIZARD_STEPS)[number];

const TYPE_OPTIONS = [
  "aiWizardTypeUnlimited",
  "aiWizardTypeFixed",
  "aiWizardTypeHourly",
  "aiWizardTypeInternship",
  "aiWizardTypeApprenticeship",
  "aiWizardTypeSubstitute",
] as const;

const WORKLOAD_OPTIONS = [
  "aiWizardWorkloadFull",
  "aiWizardWorkloadPart",
  "aiWizardWorkloadHourly",
] as const;

const CLAUSE_OPTIONS = [
  "aiWizardClauseProbation",
  "aiWizardClauseNotice",
  "aiWizardClauseVacation",
  "aiWizardClauseOvertime",
  "aiWizardClauseConfidentiality",
  "aiWizardClauseTraining",
  "aiWizardClauseSideline",
] as const;

interface Props {
  /** Set for contract mode (draft grounded on the contract's facts); omit for template mode. */
  contractId?: string;
  /** Latest editor HTML — sent along so revisions build on the current state. */
  getCurrentHtml: () => string;
  /** Called whenever the assistant returns a (revised) draft. */
  onDraft: (html: string) => void;
  disabled?: boolean;
  className?: string;
}

/**
 * Dialog-driven contract drafting: the assistant first asks scoping questions
 * (contract type by role, clauses, Swiss labor law constraints), then delivers
 * a full draft and revises individual sections on request. History lives only
 * in this component — nothing is persisted.
 */
export function ContractAiChat({
  contractId,
  getCurrentHtml,
  onDraft,
  disabled,
  className,
}: Props) {
  const t = useTranslations("ContractTemplates");
  const locale = useLocale();
  const [messages, setMessages] = useState<ContractAiChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [wizardStep, setWizardStep] = useState<WizardStep | null>(null);
  const [orgFunctions, setOrgFunctions] = useState<string[]>([]);
  const [clauseSel, setClauseSel] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, loading, wizardStep]);

  const callAi = async (history: ContractAiChatMessage[]) => {
    const previous = messages;
    setMessages(history);
    setLoading(true);
    const res = await contractAiChatAction(history, {
      currentHtml: getCurrentHtml(),
      contractId,
    });
    setLoading(false);
    if (!res.success) {
      toast.error(res.error?.split("{")[0].trim() || t("aiDraftError"));
      // Drop the unanswered user message so a retry doesn't duplicate it.
      setMessages(previous);
      return false;
    }
    const reply = res.reply || (res.html ? t("aiChatDraftApplied") : "");
    setMessages([...history, { role: "assistant", content: reply }]);
    if (res.html) {
      onDraft(res.html);
      toast.success(t("aiChatDraftApplied"));
    }
    return true;
  };

  const wizardQuestion = (step: WizardStep) =>
    t(
      {
        role: "aiWizardRoleQ",
        type: "aiWizardTypeQ",
        workload: "aiWizardWorkloadQ",
        clauses: "aiWizardClausesQ",
      }[step] as Parameters<typeof t>[0],
    );

  /** Records the answer for the current wizard step; the Q&A becomes part of
   * the chat history the AI later receives. Last step hands over to the AI. */
  const answerWizard = (answer: string) => {
    if (!wizardStep || loading) return;
    const stepIndex = WIZARD_STEPS.indexOf(wizardStep);
    const isLast = stepIndex === WIZARD_STEPS.length - 1;
    const history: ContractAiChatMessage[] = [
      ...messages,
      { role: "assistant", content: wizardQuestion(wizardStep) },
      {
        role: "user",
        content: isLast ? `${answer}. ${t("aiWizardFinalize")}` : answer,
      },
    ];
    if (isLast) {
      setWizardStep(null);
      void callAi(history);
    } else {
      setMessages(history);
      setWizardStep(WIZARD_STEPS[stepIndex + 1]);
    }
  };

  const startWizard = async () => {
    setMessages([{ role: "user", content: t("aiChatStartMessage") }]);
    setClauseSel([]);
    setWizardStep("role");
    const res = await getEmployeeFunctionsAction();
    if (res.success) {
      setOrgFunctions(
        res.data
          .filter((f) => f.isActive && !f.isArchived)
          .map(
            (f) =>
              f.translations?.find((tr) => tr.locale === locale)?.name ??
              f.name,
          ),
      );
    }
  };

  const send = async (forcedContent?: string) => {
    const content = (forcedContent ?? input).trim();
    if (!content || loading) return;
    setInput("");
    if (wizardStep) {
      // Typed text answers the current wizard question (custom option).
      answerWizard(content);
      return;
    }
    const ok = await callAi([...messages, { role: "user", content }]);
    if (!ok && !forcedContent) setInput(content);
  };

  const wizardOptions: string[] =
    wizardStep === "role"
      ? orgFunctions
      : wizardStep === "type"
        ? TYPE_OPTIONS.map((k) => t(k))
        : wizardStep === "workload"
          ? WORKLOAD_OPTIONS.map((k) => t(k))
          : wizardStep === "clauses"
            ? CLAUSE_OPTIONS.map((k) => t(k))
            : [];

  // Untouched editor + no dialog yet: offer a start button instead of a
  // bare textarea; the kick-off message makes the AI ask its questions first.
  // Parse instead of regex-stripping tags: the browser parser is the only
  // reliable way to get the visible text of arbitrary editor HTML.
  const htmlEmpty = !new DOMParser()
    .parseFromString(getCurrentHtml(), "text/html")
    .body.textContent?.trim();
  const showStart =
    messages.length === 0 && !wizardStep && !loading && htmlEmpty;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-1.5">
          <Sparkles className="h-4 w-4" />
          {t("aiSectionTitle")}
        </CardTitle>
        <CardDescription>{t("aiChatHint")}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
      {showStart ? (
        // Untouched template: one explicit entry point — the AI opens the
        // dialog with its scoping questions.
        <div className="flex flex-col items-center gap-3 py-4 text-center">
          <p className="max-w-md text-xs text-muted-foreground">
            {t("aiChatIntro")}
          </p>
          <Button
            type="button"
            className="gap-1.5"
            onClick={() => void startWizard()}
            disabled={disabled}
          >
            <Sparkles className="h-4 w-4" />
            {t("aiChatStart")}
          </Button>
        </div>
      ) : (
      <>
      <div
        ref={scrollRef}
        className="flex max-h-[40vh] min-h-24 flex-col gap-2 overflow-y-auto pr-1"
      >
        {messages.length === 0 && (
          <p className="text-xs text-muted-foreground">{t("aiChatIntro")}</p>
        )}
        {messages.map((message, index) => (
          <div
            key={index}
            className={cn(
              "max-w-[92%] whitespace-pre-wrap rounded-md px-2.5 py-1.5 text-xs",
              message.role === "user"
                ? "self-end bg-primary text-primary-foreground"
                : "self-start bg-muted",
            )}
          >
            {message.content}
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-1.5 self-start rounded-md bg-muted px-2.5 py-1.5 text-xs text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" />
            {t("aiChatThinking")}
          </div>
        )}
        {wizardStep && !loading && (
          <div className="flex max-w-[92%] flex-col gap-2 self-start rounded-md bg-muted px-2.5 py-2 text-xs">
            <span>{wizardQuestion(wizardStep)}</span>
            <div className="flex flex-wrap gap-1.5">
              {wizardOptions.map((option) =>
                wizardStep === "clauses" ? (
                  <Button
                    key={option}
                    type="button"
                    size="sm"
                    variant={
                      clauseSel.includes(option) ? "default" : "outline"
                    }
                    className="h-7 px-2 text-xs"
                    onClick={() =>
                      setClauseSel((sel) =>
                        sel.includes(option)
                          ? sel.filter((s) => s !== option)
                          : [...sel, option],
                      )
                    }
                  >
                    {option}
                  </Button>
                ) : (
                  <Button
                    key={option}
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-7 px-2 text-xs"
                    onClick={() => answerWizard(option)}
                  >
                    {option}
                  </Button>
                ),
              )}
            </div>
            {wizardStep === "clauses" && (
              <Button
                type="button"
                size="sm"
                className="h-7 self-start px-3 text-xs"
                onClick={() =>
                  answerWizard(clauseSel.join(", ") || t("aiWizardStandard"))
                }
              >
                {t("aiWizardContinue")}
              </Button>
            )}
          </div>
        )}
      </div>

      <div className="flex items-end gap-1.5">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void send();
            }
          }}
          placeholder={t("aiChatPlaceholder")}
          rows={2}
          className="min-h-0 flex-1 text-xs"
          disabled={disabled || loading}
        />
        <Button
          type="button"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={() => void send()}
          disabled={disabled || loading || !input.trim()}
          aria-label={t("aiChatSend")}
        >
          <SendHorizontal className="h-3.5 w-3.5" />
        </Button>
      </div>
      </>
      )}
      </CardContent>
    </Card>
  );
}
