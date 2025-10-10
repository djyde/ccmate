import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useClaudeProjects } from "../../lib/query";
import { Alert, AlertDescription } from "../../components/ui/alert";
import { FolderOpenIcon } from "lucide-react";

export function List() {
  const navigate = useNavigate();
  const { data: projects, isLoading, error } = useClaudeProjects();

  useEffect(() => {
    if (projects && projects.length > 0) {
      // Navigate to the first project, URL-encoding the path
      const firstProjectPath = encodeURIComponent(projects[0].path);
      navigate(`/projects/${firstProjectPath}`, { replace: true });
    }
  }, [projects, navigate]);

  if (isLoading) {
    return (
      <div className="">
        <div className="flex items-center p-3 border-b px-3 justify-between sticky top-0 bg-background z-10 mb-4" data-tauri-drag-region>
          <div data-tauri-drag-region>
            <h3 className="font-bold" data-tauri-drag-region>Projects</h3>
          </div>
        </div>
        <div className="space-y-6 px-4">
          <div className="flex items-center justify-center py-8">
            <div className="text-sm text-muted-foreground">Loading projects...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="">
        <div className="flex items-center p-3 border-b px-3 justify-between sticky top-0 bg-background z-10 mb-4" data-tauri-drag-region>
          <div data-tauri-drag-region>
            <h3 className="font-bold" data-tauri-drag-region>Projects</h3>
          </div>
        </div>
        <div className="space-y-6 px-4">
          <Alert>
            <AlertDescription>
              Failed to load projects: {error instanceof Error ? error.message : String(error)}
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  if (!projects || projects.length === 0) {
    return (
      <div className="">
        <div className="flex items-center p-3 border-b px-3 justify-between sticky top-0 bg-background z-10 mb-4" data-tauri-drag-region>
          <div data-tauri-drag-region>
            <h3 className="font-bold" data-tauri-drag-region>Projects</h3>
          </div>
        </div>
        <div className="space-y-6 px-4">
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <FolderOpenIcon className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Projects Found</h3>
            <p className="text-sm text-muted-foreground max-w-md">
              There are no Claude projects configured. Projects appear here when you use Claude Code in different project folders.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // This should not be shown as we redirect to the first project immediately
  // But keeping it as a fallback
  return (
    <div className="">
      <div className="flex items-center p-3 border-b px-3 justify-between sticky top-0 bg-background z-10 mb-4" data-tauri-drag-region>
        <div data-tauri-drag-region>
          <h3 className="font-bold" data-tauri-drag-region>Projects</h3>
        </div>
      </div>
      <div className="space-y-6 px-4">
        <div className="text-sm text-muted-foreground">
          Found {projects.length} project{projects.length === 1 ? '' : 's'}. Redirecting...
        </div>
      </div>
    </div>
  );
}