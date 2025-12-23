import { useEffect, useCallback } from 'react';
import { useContextMenu, getDefaultTextContextMenu } from '@/components/ui/context-menu';

interface UseGlobalContextMenuOptions {
  preventDefault?: boolean;
}

export const useGlobalContextMenu = (options: UseGlobalContextMenuOptions = {}) => {
  const { preventDefault = true } = options;
  const { showContextMenu, hideContextMenu } = useContextMenu();

  const handleContextMenu = useCallback((event: MouseEvent) => {
    if (preventDefault) {
      event.preventDefault();
    }

    // Hide any existing menu to ensure it disappears before a new one appears.
    hideContextMenu();

    const showNewMenu = () => {
      const target = event.target as HTMLElement;
      let contextMenuItems: any[] = [];

      // Check if target is an input or textarea
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        const textElement = target as HTMLInputElement | HTMLTextAreaElement;
        contextMenuItems = getDefaultTextContextMenu(textElement);
      }
      // Check if target is within a contenteditable element
      else if (target.closest('[contenteditable="true"]')) {
        const editableElement = target.closest('[contenteditable="true"]') as HTMLElement;
        if (editableElement) {
          contextMenuItems = getDefaultTextContextMenu(editableElement as any);
        }
      }
      // Check if target is within a CodeMirror editor
      else if (target.closest('.cm-editor')) {
        const cmElement = target.closest('.cm-editor');
        const selection = window.getSelection();
        const hasSelection = selection && selection.toString().length > 0;

        contextMenuItems = [
          {
            id: 'undo',
            label: 'Undo',
            disabled: true, // Would need access to CM view for this
          },
          {
            id: 'redo',
            label: 'Redo',
            disabled: true, // Would need access to CM view for this
          },
          { id: 'sep1', separator: true },
          {
            id: 'cut',
            label: 'Cut',
            disabled: !hasSelection,
            action: () => {
              if (hasSelection) {
                document.execCommand('cut');
              }
            },
          },
          {
            id: 'copy',
            label: 'Copy',
            disabled: !hasSelection,
            action: () => {
              if (hasSelection) {
                document.execCommand('copy');
              }
            },
          },
          {
            id: 'paste',
            label: 'Paste',
            action: () => {
              document.execCommand('paste');
            },
          },
          { id: 'sep2', separator: true },
          {
            id: 'select-all',
            label: 'Select All',
            action: () => {
              if (cmElement) {
                const selection = window.getSelection();
                const range = document.createRange();
                range.selectNodeContents(cmElement.querySelector('.cm-scroller') || cmElement);
                selection?.removeAllRanges();
                selection?.addRange(range);
              }
            },
          },
        ];
      }
      // Default context menu for general content
      else {
        // For non-input elements, provide basic navigation options
        contextMenuItems = [
          {
            id: 'back',
            label: 'Back',
            action: () => {
              window.history.back();
            },
            disabled: window.history.length <= 1,
          },
          {
            id: 'reload',
            label: 'Reload',
            action: () => {
              window.location.reload();
            },
          },
        ];

        // Add copy option if there's text selection
        const selection = window.getSelection();
        if (selection && selection.toString().trim().length > 0) {
          contextMenuItems.push(
            { id: 'sep1', separator: true },
            {
              id: 'copy-selection',
              label: 'Copy Selection',
              action: () => {
                document.execCommand('copy');
              },
            }
          );
        }
      }

      // Filter out disabled items and separators at the beginning/end
      let filteredItems = contextMenuItems.filter((item, index, array) => {
        if (item.disabled) return false;
        if (item.separator) {
          // Keep separator if it's not at beginning or end and previous item is not a separator
          return index > 0 && index < array.length - 1 && !array[index - 1].separator;
        }
        return true;
      });

      // Remove trailing separators
      while (filteredItems.length > 0 && filteredItems[filteredItems.length - 1].separator) {
        filteredItems = filteredItems.slice(0, -1);
      }

      if (filteredItems.length > 0) {
        showContextMenu(filteredItems, { x: event.clientX, y: event.clientY });
      }
    };

    // Use a timeout to allow the UI to update after hiding the menu
    setTimeout(showNewMenu, 10);

  }, [preventDefault, showContextMenu, hideContextMenu]);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Hide context menu on Escape key
    if (event.key === 'Escape') {
      hideContextMenu();
    }
  }, [hideContextMenu]);

  useEffect(() => {
    // Add global context menu listener
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleContextMenu, handleKeyDown]);
};

// Hook for handling context menu on specific elements
export const useElementContextMenu = (
  elementRef: React.RefObject<HTMLElement>,
  getMenuItems: (target: HTMLElement) => any[],
  options: UseGlobalContextMenuOptions = {}
) => {
  const { preventDefault = true } = options;
  const { showContextMenu, hideContextMenu } = useContextMenu();

  const handleContextMenu = useCallback((event: MouseEvent) => {
    if (preventDefault) {
      event.preventDefault();
    }

    // Hide any existing menu to ensure it disappears before a new one appears.
    hideContextMenu();

    const showNewMenu = () => {
      const target = event.target as HTMLElement;
      const contextMenuItems = getMenuItems(target);

      if (contextMenuItems.length > 0) {
        showContextMenu(contextMenuItems, { x: event.clientX, y: event.clientY });
      }
    }

    // Use a timeout to allow the UI to update after hiding the menu
    setTimeout(showNewMenu, 10);

  }, [preventDefault, getMenuItems, showContextMenu, hideContextMenu]);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    element.addEventListener('contextmenu', handleContextMenu);

    return () => {
      element.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [elementRef, handleContextMenu]);
};
