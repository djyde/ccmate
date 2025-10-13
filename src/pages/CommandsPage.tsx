import { useState, Suspense } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TerminalIcon, PlusIcon, SaveIcon, TrashIcon } from "lucide-react";
import { useClaudeCommands, useWriteClaudeCommand, useDeleteClaudeCommand } from "@/lib/query";
import { ask, message } from "@tauri-apps/plugin-dialog";
import CodeMirror, { EditorView } from "@uiw/react-codemirror";
import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import { useCodeMirrorTheme } from "@/lib/use-codemirror-theme";

function CommandsPageContent() {
  const { t } = useTranslation();
  const { data: commands, isLoading, error } = useClaudeCommands();
  const writeCommand = useWriteClaudeCommand();
  const deleteCommand = useDeleteClaudeCommand();
  const [commandEdits, setCommandEdits] = useState<Record<string, string>>({});
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const codeMirrorTheme = useCodeMirrorTheme();

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
              <DialogTitle className="">{t('commands.addCommandTitle')}</DialogTitle>
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
          <ScrollArea className="h-full">
            <div className="">
              <Accordion type="multiple" className="">
                {commands.map((command) => (
                  <AccordionItem key={command.name} value={command.name} className="bg-card">
                    <AccordionTrigger className="hover:no-underline px-4 py-2 bg-card hover:bg-accent duration-150">
                      <div className="flex items-center gap-2">
                        <TerminalIcon size={12} />
                        <span className="font-medium">{command.name}</span>
                        <span className="text-sm text-muted-foreground font-normal">
                          {`~/.claude/commands/${command.name}.md`}
                        </span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-3">
                      <div className="px-3 pt-3 space-y-3">
                        <div className="rounded-lg overflow-hidden border">
                          <CodeMirror
                            value={commandEdits[command.name] !== undefined ? commandEdits[command.name] : command.content}
                            height="180px"
                            theme={codeMirrorTheme}
                            onChange={(value) => handleContentChange(command.name, value)}
                            placeholder={t('commands.contentPlaceholder')}
                            extensions={[
                              markdown({
                                base: markdownLanguage,
                              }),
                              EditorView.lineWrapping
                            ]}
                            basicSetup={{
                              lineNumbers: false,
                              highlightActiveLineGutter: true,
                              foldGutter: false,
                              dropCursor: false,
                              allowMultipleSelections: false,
                              indentOnInput: true,
                              bracketMatching: true,
                              closeBrackets: true,
                              autocompletion: true,
                              highlightActiveLine: true,
                              highlightSelectionMatches: true,
                              searchKeymap: false,
                            }}
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
  const codeMirrorTheme = useCodeMirrorTheme();

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
    <div className="space-y-4 mt-4">
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
        <div className="rounded-lg overflow-hidden border">
          <CodeMirror
            value={commandContent}
            onChange={(value) => setCommandContent(value)}
            height="200px"
            theme={codeMirrorTheme}
            placeholder={t('commands.contentPlaceholder')}
            extensions={[
              markdown({
                base: markdownLanguage,
              }),
              EditorView.lineWrapping
            ]}
            basicSetup={{
              lineNumbers: false,
              highlightActiveLineGutter: true,
              foldGutter: false,
              dropCursor: false,
              allowMultipleSelections: false,
              indentOnInput: true,
              bracketMatching: true,
              closeBrackets: true,
              autocompletion: true,
              highlightActiveLine: true,
              highlightSelectionMatches: true,
              searchKeymap: false,
            }}
          />
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          onClick={handleCreateCommand}
          disabled={!commandName.trim() || !commandContent.trim() || writeCommand.isPending}
        >
          {writeCommand.isPending ? t('commands.creating') : t('commands.create')}
        </Button>
      </div>
    </div>
  );
}
