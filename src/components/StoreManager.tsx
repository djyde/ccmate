import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useStores, useCreateStore, useDeleteStore, useSetUsingStore } from "../lib/query";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ConfigStore } from "@/lib/query";

export function StoreManager() {
  const [newStoreName, setNewStoreName] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const navigate = useNavigate();

  const { data: stores = [], isLoading, error } = useStores();
  const createStoreMutation = useCreateStore();
  const deleteStoreMutation = useDeleteStore();
  const setUsingStoreMutation = useSetUsingStore();

  const handleCreateStore = (settingsContent: string) => {
    if (!newStoreName.trim()) {
      alert("Please enter a store name");
      return;
    }

    try {
      const parsedSettings = JSON.parse(settingsContent);
      createStoreMutation.mutate({
        name: newStoreName.trim(),
        settings: parsedSettings,
      });
      setNewStoreName("");
      setShowCreateForm(false);
    } catch (error) {
      alert("Invalid JSON format. Please fix the errors and try again.");
    }
  };

  const handleDeleteStore = (store: ConfigStore) => {
    if (confirm(`Are you sure you want to delete the store "${store.name}"?`)) {
      deleteStoreMutation.mutate(store.id);
    }
  };

  const handleSetUsingStore = (store: ConfigStore) => {
    setUsingStoreMutation.mutate(store.id);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  // Navigate to edit page after successful store creation
  useEffect(() => {
    if (createStoreMutation.isSuccess && createStoreMutation.data) {
      navigate(`/store/${createStoreMutation.data.id}/edit`);
    }
  }, [createStoreMutation.isSuccess, createStoreMutation.data, navigate]);

  if (isLoading) return <div className="text-sm text-muted-foreground">Loading stores...</div>;
  if (error) return <Alert variant="destructive"><AlertDescription>Error loading stores: {error.message}</AlertDescription></Alert>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Configuration Stores</h3>
        <div className="flex gap-2">
          <Button
            onClick={() => {
              const storeName = prompt("Enter store name:");
              if (storeName && storeName.trim()) {
                // Create store with empty settings first, then navigate to edit
                createStoreMutation.mutate({
                  name: storeName.trim(),
                  settings: {},
                });
              }
            }}
            size="sm"
          >
            Create Store
          </Button>
          <Button
            onClick={() => setShowCreateForm(!showCreateForm)}
            variant="outline"
            size="sm"
          >
            Quick Create
          </Button>
        </div>
      </div>

      {showCreateForm && (
        <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
          <div>
            <label className="text-sm font-medium">Store Name</label>
            <input
              type="text"
              value={newStoreName}
              onChange={(e) => setNewStoreName(e.target.value)}
              className="w-full mt-1 px-3 py-2 border rounded-md text-sm"
              placeholder="Enter store name..."
            />
          </div>
          <div>
            <label className="text-sm font-medium">Settings JSON</label>
            <textarea
              className="w-full mt-1 px-3 py-2 border rounded-md text-sm font-mono min-h-32"
              placeholder="Enter settings JSON..."
              id="create-store-settings"
            />
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => {
                const textarea = document.getElementById('create-store-settings') as HTMLTextAreaElement;
                handleCreateStore(textarea.value);
              }}
              disabled={createStoreMutation.isPending}
              size="sm"
            >
              {createStoreMutation.isPending ? "Creating..." : "Create"}
            </Button>
            <Button
              onClick={() => setShowCreateForm(false)}
              variant="outline"
              size="sm"
            >
              Cancel
            </Button>
          </div>
          {createStoreMutation.error && (
            <Alert variant="destructive" className="text-sm">
              <AlertDescription>{createStoreMutation.error.message}</AlertDescription>
            </Alert>
          )}
        </div>
      )}

      {stores.length === 0 ? (
        <div className="text-sm text-muted-foreground text-center py-8">
          No stores created yet. Create your first store to save configuration presets.
        </div>
      ) : (
        <div className="space-y-2">
          {stores.map((store: ConfigStore) => (
            <div
              key={store.id}
              className={`border rounded-lg p-3 ${
                store.using ? 'border-primary bg-primary/5' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{store.name}</span>
                    {store.using && (
                      <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded">
                        Current
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Created: {formatDate(store.created_at)}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => navigate(`/store/${store.id}/edit`)}
                    variant="outline"
                    size="sm"
                  >
                    Edit
                  </Button>
                  {!store.using && (
                    <Button
                      onClick={() => handleSetUsingStore(store)}
                      disabled={setUsingStoreMutation.isPending}
                      variant="outline"
                      size="sm"
                    >
                      Use
                    </Button>
                  )}
                  <Button
                    onClick={() => handleDeleteStore(store)}
                    disabled={deleteStoreMutation.isPending || store.using}
                    variant="destructive"
                    size="sm"
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {setUsingStoreMutation.error && (
        <Alert variant="destructive" className="text-sm">
          <AlertDescription>{setUsingStoreMutation.error.message}</AlertDescription>
        </Alert>
      )}

      {deleteStoreMutation.error && (
        <Alert variant="destructive" className="text-sm">
          <AlertDescription>{deleteStoreMutation.error.message}</AlertDescription>
        </Alert>
      )}

      {createStoreMutation.isSuccess && (
        <Alert className="text-sm">
          <AlertDescription>Store created successfully!</AlertDescription>
        </Alert>
      )}

      {setUsingStoreMutation.isSuccess && (
        <Alert className="text-sm">
          <AlertDescription>Store activated successfully!</AlertDescription>
        </Alert>
      )}

      {deleteStoreMutation.isSuccess && (
        <Alert className="text-sm">
          <AlertDescription>Store deleted successfully!</AlertDescription>
        </Alert>
      )}
    </div>
  );
}