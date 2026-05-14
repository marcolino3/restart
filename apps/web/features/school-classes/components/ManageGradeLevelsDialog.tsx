"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Settings2, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { GradeLevelItem } from "../actions/get-grade-levels.action";
import { createGradeLevelAction } from "../actions/create-grade-level.action";
import { deleteGradeLevelAction } from "../actions/delete-grade-level.action";
import { handleAction } from "@/lib/actions/handle-action";

interface Props {
  gradeLevels: GradeLevelItem[];
  usedGradeLevelIds: Set<string>;
}

export function ManageGradeLevelsDialog({
  gradeLevels,
  usedGradeLevelIds,
}: Props) {
  const tS = useTranslations("SchoolClasses");
  const [items, setItems] = React.useState<GradeLevelItem[]>(gradeLevels);
  const [newName, setNewName] = React.useState("");
  const [isCreating, setIsCreating] = React.useState(false);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setIsCreating(true);

    await handleAction({
      action: () => createGradeLevelAction(newName.trim()),
      successMessage: tS("gradeLevelCreated"),
      errorMessage: tS("gradeLevelCreateError"),
      onSuccess: (data) => {
        if (data) {
          setItems((prev) => [...prev, { ...data, sortOrder: prev.length }]);
        }
        setNewName("");
      },
    });

    setIsCreating(false);
  };

  const handleDelete = async (id: string) => {
    await handleAction({
      action: () => deleteGradeLevelAction(id),
      successMessage: tS("gradeLevelDeleted"),
      errorMessage: tS("gradeLevelDeleteError"),
      onSuccess: () => {
        setItems((prev) => prev.filter((item) => item.id !== id));
      },
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleCreate();
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Settings2 className="mr-2 h-4 w-4" />
          {tS("manageGradeLevels")}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{tS("manageGradeLevels")}</DialogTitle>
          <DialogDescription>
            {tS("manageGradeLevelsDescription")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Add new */}
          <div className="flex gap-2">
            <Input
              placeholder={tS("gradeLevelNamePlaceholder")}
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <Button
              onClick={handleCreate}
              disabled={isCreating || !newName.trim()}
              size="icon"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* List */}
          <div className="space-y-1">
            {items.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                {tS("noGradeLevelsFound")}
              </p>
            ) : (
              items.map((item) => {
                const isUsed = usedGradeLevelIds.has(item.id);
                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-md border px-3 py-2"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{item.name}</span>
                      {isUsed && (
                        <Badge variant="secondary" className="text-xs">
                          {tS("inUse")}
                        </Badge>
                      )}
                    </div>
                    {isUsed ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              disabled
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          {tS("gradeLevelInUseTooltip")}
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => handleDelete(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
