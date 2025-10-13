import { useState, Suspense } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { TerminalIcon, ExternalLinkIcon, PlusIcon, SaveIcon, TrashIcon, EditIcon } from "lucide-react";
import { useClaudeCommands, useWriteClaudeCommand, useDeleteClaudeCommand, type CommandFile } from "@/lib/query";
import { openUrl } from "@tauri-apps/plugin-opener";
import { ask, message } from "@tauri-apps/plugin-dialog";

function CommandsPageContent() {
  const { t } = useTranslation();
  const { data: commands, isLoading, error } = useClaudeCommands();
  const writeCommand = useWriteClaudeCommand();
  const deleteCommand = useDeleteClaudeCommand();
  const [commandEdits, setCommandEdits] = useState<Record<string, string>>({});
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">{t('loading')}</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center text-red-500">
          {t('commands.error', { error: error.message })}
        </div>
      </div>
    );
  }

  const handleContentChange = (commandName: string, content: string) => {
    setCommandEdits(prev => ({
      ...prev,
      [commandName]: content
    }));
  };

  const handleSaveCommand = async (commandName: string) => {
    const content = commandEdits[commandName];
    if (content === undefined) return;

    writeCommand.mutate({
      commandName,
      content
    });
  };

  const handleDeleteCommand = async (commandName: string) => {
    const confirmed = await ask(
      t('commands.deleteConfirm', { commandName }),
      { title: t('commands.deleteTitle'), kind: "warning" }
    );

    if (confirmed) {
      deleteCommand.mutate(commandName);
    }
  };

  return (
    <div className="">
      <div className="flex items-center p-3 border-b px-3 justify-between sticky top-0 bg-background z-10" data-tauri-drag-region>
        <div data-tauri-drag-region>
          <h3 className="font-bold" data-tauri-drag-region>{t('commands.title')}</h3>
          <p className="text-sm text-muted-foreground" data-tauri-drag-region>
            {t('commands.description')}
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" className="text-muted-foreground" size="sm">
              <PlusIcon size={14} />
              {t('commands.addCommand')}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-[600px]">
            <DialogHeader>
              <DialogTitle className="text-primary text-sm">{t('commands.addCommandTitle')}</DialogTitle>
              <DialogDescription className="text-muted-foreground text-sm">
                {t('commands.addCommandDescription')}
              </DialogDescription>
            </DialogHeader>
            <CreateCommandPanel onClose={() => setIsDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>
      <div className="">
        {!commands || commands.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            {t('commands.noCommands')}
          </div>
        ) : (
          <ScrollArea className="h-[calc(100vh-8rem)]">
            <div className="p-4">
              <Accordion type="multiple" className="space-y-2">
                {commands.map((command) => (
                  <AccordionItem key={command.name} value={command.name} className="bg-card">
                    <AccordionTrigger className="hover:no-underline px-4 py-2 bg-card hover:bg-accent duration-150">
                      <div className="flex items-center gap-2">
                        <TerminalIcon size={12} />
                        <span className="font-medium">{command.name}</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-3">
                      <div className="px-3 pt-3 space-y-3">
                        <div className="rounded-lg overflow-hidden border">
                          <Textarea
                            value={commandEdits[command.name] !== undefined ? commandEdits[command.name] : command.content}
                            onChange={(e) => handleContentChange(command.name, e.target.value)}
                            className="min-h-[180px] font-mono text-sm border-0 focus-visible:ring-0"
                            placeholder={t('commands.contentPlaceholder')}
                          />
                        </div>
                        <div className="flex justify-between bg-card">
                          <Button
                            variant="outline"
                            onClick={() => handleSaveCommand(command.name)}
                            disabled={writeCommand.isPending || commandEdits[command.name] === undefined}
                            size="sm"
                          >
                            <SaveIcon size={14} className="" />
                            {writeCommand.isPending ? t('commands.saving') : t('commands.save')}
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteCommand(command.name)}
                            disabled={deleteCommand.isPending}
                          >
                            <TrashIcon size={14} className="" />
                          </Button>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </ScrollArea>
        )}
      </div>
    </div>
  );
}

export function CommandsPage() {
  const { t } = useTranslation();
  
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">{t('loading')}</div>
      </div>
    }>
      <CommandsPageContent />
    </Suspense>
  );
}

function CreateCommandPanel({ onClose }: { onClose?: () => void }) {
  const { t } = useTranslation();
  const [commandName, setCommandName] = useState("");
  const [commandContent, setCommandContent] = useState("");
  const writeCommand = useWriteClaudeCommand();
  const { data: commands } = useClaudeCommands();

  const handleCreateCommand = async () => {
    // Validate command name
    if (!commandName.trim()) {
      await message(t('commands.emptyNameError'), {
        title: t('commands.validationError'),
        kind: "error"
      });
      return;
    }

    // Check if command already exists
    const exists = commands && commands.some(cmd => cmd.name === commandName);
    if (exists) {
      await message(t('commands.commandExistsError', { commandName }), {
        title: t('commands.commandExistsTitle'),
        kind: "info"
      });
      return;
    }

    // Validate content
    if (!commandContent.trim()) {
      await message(t('commands.emptyContentError'), {
        title: t('commands.validationError'),
        kind: "error"
      });
      return;
    }

    writeCommand.mutate({
      commandName,
      content: commandContent
    }, {
      onSuccess: () => {
        setCommandName("");
        setCommandContent("");
        onClose?.();
      }
    });
  };

  return (
    <div className="space-y-4 py-3">
      <div className="space-y-2">
        <Label htmlFor="command-name">{t('commands.commandName')}</Label>
        <Input
          id="command-name"
          value={commandName}
          onChange={(e) => setCommandName(e.target.value)}
          placeholder={t('commands.commandNamePlaceholder')}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="command-content">{t('commands.commandContent')}</Label>
        <Textarea
          id="command-content"
          value={commandContent}
          onChange={(e) => setCommandContent(e.target.value)}
          className="min-h-[200px] font-mono text-sm"
          placeholder={t('commands.contentPlaceholder')}
        />
      </div>

      <div className="flex justify-end">
        <Button
          onClick={handleCreateCommand}
          disabled={!commandName.trim() || !commandContent.trim() || writeCommand.isPending}
          size="sm"
        >
          {writeCommand.isPending ? t('commands.creating') : t('commands.create')}
        </Button>
      </div>
    </div>
  );
}
