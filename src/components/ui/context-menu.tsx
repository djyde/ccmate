import React, { createContext, useContext, useState, useEffect, ReactNode, useRef, useCallback } from 'react';
import { Copy, Scissors, CheckSquare } from 'lucide-react';

interface ContextMenuItem {
  id: string;
  label?: string;
  icon?: React.ReactNode;
  action?: () => void;
  separator?: boolean;
  disabled?: boolean;
}

interface ContextMenuPosition {
  x: number;
  y: number;
}

interface ContextMenuContextType {
  showContextMenu: (items: ContextMenuItem[], position: ContextMenuPosition) => void;
  hideContextMenu: () => void;
  isContextMenuVisible: boolean;
}

const ContextMenuContext = createContext<ContextMenuContextType | undefined>(undefined);

export const useContextMenu = () => {
  const context = useContext(ContextMenuContext);
  if (!context) {
    throw new Error('useContextMenu must be used within a ContextMenuProvider');
  }
  return context;
};

interface ContextMenuProviderProps {
  children: ReactNode;
}

export const ContextMenuProvider: React.FC<ContextMenuProviderProps> = ({ children }) => {
  const [isContextMenuVisible, setIsContextMenuVisible] = useState(false);
  const [contextMenuItems, setContextMenuItems] = useState<ContextMenuItem[]>([]);
  const menuRef = useRef<HTMLDivElement>(null);

  const showContextMenu = useCallback((items: ContextMenuItem[], position: ContextMenuPosition) => {
    setContextMenuItems(items);
    setIsContextMenuVisible(true);

    // Defer position update to allow the menu to render first
    setTimeout(() => {
      if (menuRef.current) {
        const menuHeight = menuRef.current.offsetHeight;
        const menuWidth = menuRef.current.offsetWidth;

        const adjustedX = Math.min(position.x, window.innerWidth - menuWidth - 5);
        const adjustedY = Math.min(position.y, window.innerHeight - menuHeight - 5);

        menuRef.current.style.left = `${adjustedX}px`;
        menuRef.current.style.top = `${adjustedY}px`;
        menuRef.current.style.opacity = '1';
      }
    }, 0);
  }, []);

  const hideContextMenu = useCallback(() => {
    if (menuRef.current) {
      menuRef.current.style.opacity = '0';
    }
    setIsContextMenuVisible(false);
    setContextMenuItems([]);
  }, []);

  const handleMenuItemClick = (item: ContextMenuItem) => {
    if (item.disabled) return;
    if (item.action) {
      item.action();
    }
    hideContextMenu();
  };

  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      // Ignore if the click is inside the context menu
      if (menuRef.current && menuRef.current.contains(e.target as Node)) {
        return;
      }
      hideContextMenu();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        hideContextMenu();
      }
    };

    if (isContextMenuVisible) {
      document.addEventListener('click', handleGlobalClick, { capture: true });
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('click', handleGlobalClick, { capture: true });
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isContextMenuVisible, hideContextMenu]);

  return (
    <ContextMenuContext.Provider value={{ showContextMenu, hideContextMenu, isContextMenuVisible }}>
      {children}

      {isContextMenuVisible && (
        <div
          ref={menuRef}
          className="fixed z-50 min-w-48 py-1 bg-popover border border-border rounded-md shadow-lg transition-opacity duration-100"
          style={{ opacity: 0, top: -9999, left: -9999 }} // Initially hidden and off-screen
          onClick={(e) => e.stopPropagation()}
        >
          {contextMenuItems.map((item, index) => {
            if (item.separator) {
              return (
                <div key={index} className="h-px bg-border my-1 mx-2" />
              );
            }

            return (
              <button
                key={item.id}
                className={`
                  w-full px-3 py-2 text-left text-sm flex items-center gap-2
                  hover:bg-accent hover:text-accent-foreground
                  focus:bg-accent focus:text-accent-foreground focus:outline-none
                  ${item.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                `}
                onClick={() => handleMenuItemClick(item)}
                disabled={item.disabled}
              >
                {item.icon && (
                  <span className="w-4 h-4 flex items-center justify-center">
                    {item.icon}
                  </span>
                )}
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </ContextMenuContext.Provider>
  );
};

// Default context menu items for text inputs
export const getDefaultTextContextMenu = (element: HTMLInputElement | HTMLTextAreaElement): ContextMenuItem[] => {
  const canCut = element.selectionStart !== element.selectionEnd;
  const canCopy = element.selectionStart !== element.selectionEnd;
  const canPaste = navigator.clipboard && element.value.length >= 0; // Basic paste check

  return [
    {
      id: 'undo',
      label: 'Undo',
      disabled: true, // Would need more complex implementation
    },
    {
      id: 'redo',
      label: 'Redo',
      disabled: true, // Would need more complex implementation
    },
    { id: 'sep1', separator: true },
    {
      id: 'cut',
      label: 'Cut',
      icon: <Scissors className="w-4 h-4" />,
      action: () => {
        document.execCommand('cut');
      },
      disabled: !canCut,
    },
    {
      id: 'copy',
      label: 'Copy',
      icon: <Copy className="w-4 h-4" />,
      action: () => {
        document.execCommand('copy');
      },
      disabled: !canCopy,
    },
    {
      id: 'paste',
      label: 'Paste',
      icon: <CheckSquare className="w-4 h-4" />,
      action: () => {
        document.execCommand('paste');
      },
      disabled: !canPaste,
    },
    {
      id: 'delete',
      label: 'Delete',
      disabled: !canCut,
    },
    { id: 'sep2', separator: true },
    {
      id: 'select-all',
      label: 'Select All',
      icon: <CheckSquare className="w-4 h-4" />,
      action: () => {
        element.select();
      },
    },
  ];
};
