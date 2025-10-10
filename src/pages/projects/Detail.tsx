import { useParams, useNavigate } from "react-router-dom";
import { useClaudeProjects } from "../../lib/query";
import { Alert, AlertDescription } from "../../components/ui/alert";
import { Button } from "../../components/ui/button";
import { ArrowLeftIcon, FolderIcon, FileJsonIcon } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { ScrollArea } from "../../components/ui/scroll-area";
import { toast } from "sonner";

export function Detail() {
  const { path } = useParams<{ path: string }>();
  const navigate = useNavigate();
  const { data: projects, isLoading, error } = useClaudeProjects();

  if (isLoading) {
    return (
      <div className="">
        <div className="flex items-center p-3 border-b px-3 justify-between sticky top-0 bg-background z-10 mb-4" data-tauri-drag-region>
          <div data-tauri-drag-region>
            <h3 className="font-bold" data-tauri-drag-region>Project Details</h3>
          </div>
        </div>
        <div className="space-y-6 px-4">
          <div className="flex items-center justify-center py-8">
            <div className="text-sm text-muted-foreground">Loading project...</div>
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
            <h3 className="font-bold" data-tauri-drag-region>Project Details</h3>
          </div>
        </div>
        <div className="space-y-6 px-4">
          <Alert>
            <AlertDescription>
              Failed to load project: {error instanceof Error ? error.message : String(error)}
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  if (!path || !projects || projects.length === 0) {
    return (
      <div className="">
        <div className="flex items-center p-3 border-b px-3 justify-between sticky top-0 bg-background z-10 mb-4" data-tauri-drag-region>
          <div data-tauri-drag-region>
            <h3 className="font-bold" data-tauri-drag-region>Project Details</h3>
          </div>
        </div>
        <div className="space-y-6 px-4">
          <Alert>
            <AlertDescription>
              Project not found or no projects available.
            </AlertDescription>
          </Alert>
          <Button onClick={() => navigate("/projects")} variant="outline">
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to Projects
          </Button>
        </div>
      </div>
    );
  }

  // Decode the URL-encoded path
  const decodedPath = decodeURIComponent(path);

  // Find the project with matching path
  const project = projects.find(p => p.path === decodedPath);

  if (!project) {
    return (
      <div className="">
        <div className="flex items-center p-3 border-b px-3 justify-between sticky top-0 bg-background z-10 mb-4" data-tauri-drag-region>
          <div data-tauri-drag-region>
            <h3 className="font-bold" data-tauri-drag-region>Project Details</h3>
          </div>
        </div>
        <div className="space-y-6 px-4">
          <Alert>
            <AlertDescription>
              Project with path "{decodedPath}" not found.
            </AlertDescription>
          </Alert>
          <Button onClick={() => navigate("/projects")} variant="outline">
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to Projects
          </Button>
        </div>
      </div>
    );
  }

  const handleCopyPath = () => {
    navigator.clipboard.writeText(project.path).then(() => {
      toast.success("Project path copied to clipboard");
    }).catch(() => {
      toast.error("Failed to copy project path");
    });
  };

  const handleCopyConfig = () => {
    navigator.clipboard.writeText(JSON.stringify(project.config, null, 2)).then(() => {
      toast.success("Project configuration copied to clipboard");
    }).catch(() => {
      toast.error("Failed to copy project configuration");
    });
  };

  return (
    <div className="">
      <div className="flex items-center p-3 border-b px-3 justify-between sticky top-0 bg-background z-10 mb-4" data-tauri-drag-region>
        <div className="flex items-center gap-3" data-tauri-drag-region>
          <Button
            onClick={() => navigate("/projects")}
            variant="ghost"
            size="sm"
            className="p-1"
          >
            <ArrowLeftIcon className="h-4 w-4" />
          </Button>
          <div data-tauri-drag-region>
            <h3 className="font-bold" data-tauri-drag-region>Project Details</h3>
          </div>
        </div>
      </div>

      <div className="space-y-6 px-4">
        {/* Project Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FolderIcon className="h-5 w-5" />
              Project Information
            </CardTitle>
            <CardDescription>
              Details about this Claude project
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="text-sm font-medium mb-2">Project Path</h4>
              <div className="flex items-center gap-2">
                <code className="bg-muted px-2 py-1 rounded text-sm flex-1 truncate">
                  {project.path}
                </code>
                <Button onClick={handleCopyPath} variant="outline" size="sm">
                  Copy
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Project Configuration Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileJsonIcon className="h-5 w-5" />
              Project Configuration
            </CardTitle>
            <CardDescription>
              The configuration settings for this project
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">JSON Configuration</h4>
                <Button onClick={handleCopyConfig} variant="outline" size="sm">
                  Copy JSON
                </Button>
              </div>
              <ScrollArea className="h-[400px] w-full rounded-md border">
                <pre className="p-4 text-xs overflow-x-auto">
                  <code>{JSON.stringify(project.config, null, 2)}</code>
                </pre>
              </ScrollArea>
            </div>
          </CardContent>
        </Card>

        {/* Other Projects */}
        {projects.length > 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Other Projects</CardTitle>
              <CardDescription>
                Navigate to other configured projects
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {projects
                  .filter(p => p.path !== project.path)
                  .map((otherProject) => (
                    <Button
                      key={otherProject.path}
                      onClick={() => {
                        const encodedPath = encodeURIComponent(otherProject.path);
                        navigate(`/projects/${encodedPath}`);
                      }}
                      variant="ghost"
                      className="w-full justify-start text-left h-auto p-3"
                    >
                      <div className="flex flex-col items-start">
                        <div className="font-medium text-sm truncate max-w-full">
                          {otherProject.path}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {Object.keys(otherProject.config || {}).length} configuration properties
                        </div>
                      </div>
                    </Button>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}