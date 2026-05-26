import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { FolderIcon, CheckIcon, ChevronRightIcon, FolderOpenIcon } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { useFolderStore, buildFolderTree, FolderTreeNode } from '../../stores/folder.store';
import { usePromptStore } from '../../stores/prompt.store';
import { useToast } from '../ui/Toast';
import type { Prompt, Folder } from '@prompthub/shared/types';

interface QuickMoveFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  prompt: Prompt | null;
}

export function QuickMoveFolderModal({ isOpen, onClose, prompt }: QuickMoveFolderModalProps) {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const folders = useFolderStore((state) => state.folders);
  const updatePrompt = usePromptStore((state) => state.updatePrompt);

  const [selectedFolderId, setSelectedFolderId] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  // Build folder tree
  const folderTree = useMemo(() => buildFolderTree(folders), [folders]);

  // Set initial selected folder when modal opens
  useEffect(() => {
    if (isOpen && prompt) {
      setSelectedFolderId(prompt.folderId);
      // Expand the path to current folder
      if (prompt.folderId) {
        const expandPath = (folderId: string, tree: FolderTreeNode[]): boolean => {
          for (const node of tree) {
            if (node.id === folderId) {
              return true;
            }
            if (node.children.length > 0) {
              const found = expandPath(folderId, node.children);
              if (found) {
                setExpandedFolders((prev) => new Set([...prev, node.id]));
                return true;
              }
            }
          }
          return false;
        };
        expandPath(prompt.folderId, folderTree);
      }
    }
  }, [isOpen, prompt, folderTree]);

  // Get current folder name
  const currentFolderName = useMemo(() => {
    if (!prompt?.folderId) return t('folder.root', '根目录');
    const folder = folders.find((f) => f.id === prompt.folderId);
    return folder?.name || t('folder.unknown', '未知文件夹');
  }, [prompt, folders, t]);

  const handleToggleExpand = (folderId: string) => {
    setExpandedFolders((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(folderId)) {
        newSet.delete(folderId);
      } else {
        newSet.add(folderId);
      }
      return newSet;
    });
  };

  const handleMove = async () => {
    if (!prompt) return;

    // Check if actually moved
    if (selectedFolderId === prompt.folderId) {
      showToast(t('prompt.sameFolder', '未更改文件夹'), 'info');
      onClose();
      return;
    }

    setIsLoading(true);
    try {
      await updatePrompt(prompt.id, { folderId: selectedFolderId });
      const targetName = selectedFolderId
        ? folders.find((f) => f.id === selectedFolderId)?.name || t('folder.unknown')
        : t('folder.root');
      showToast(t('prompt.movedToFolder', '已移动到 {{folder}}', { folder: targetName }), 'success');
      onClose();
    } catch (error) {
      showToast(t('common.error', '移动失败'), 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Recursive folder tree render
  const renderFolderTree = (nodes: FolderTreeNode[], level: number = 0): JSX.Element[] => {
    return nodes.map((node) => {
      const isExpanded = expandedFolders.has(node.id);
      const isSelected = selectedFolderId === node.id;
      const hasChildren = node.children.length > 0;

      return (
        <div key={node.id}>
          <button
            onClick={() => setSelectedFolderId(node.id)}
            className={`
              w-full flex items-center gap-2 px-3 py-2 text-left text-sm rounded-md transition-colors
              ${isSelected
                ? 'bg-primary/10 text-primary'
                : 'hover:bg-accent/50 text-foreground'
              }
            `}
            style={{ paddingLeft: `${12 + level * 20}px` }}
          >
            {/* Expand/collapse button */}
            {hasChildren ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggleExpand(node.id);
                }}
                className="w-4 h-4 flex items-center justify-center rounded hover:bg-accent"
              >
                <ChevronRightIcon
                  className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                />
              </button>
            ) : (
              <span className="w-4" />
            )}

            {/* Folder icon */}
            {isSelected ? (
              <FolderOpenIcon className="w-4 h-4 text-primary" />
            ) : (
              <FolderIcon className="w-4 h-4 text-muted-foreground" />
            )}

            {/* Folder name */}
            <span className="flex-1 truncate">{node.name}</span>

            {/* Selected indicator */}
            {isSelected && <CheckIcon className="w-4 h-4 text-primary" />}
          </button>

          {/* Children */}
          {isExpanded && hasChildren && (
            <div className="mt-1">
              {renderFolderTree(node.children, level + 1)}
            </div>
          )}
        </div>
      );
    });
  };

  if (!prompt) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('prompt.quickMoveFolder', '移动到文件夹')}
    >
      <div className="space-y-4 w-[400px]">
        {/* Prompt info */}
        <div className="text-sm">
          <span className="text-muted-foreground">{t('prompt.currentFolder', '当前')}:</span>{' '}
          <span className="font-medium">{currentFolderName}</span>
        </div>

        {/* Folder tree */}
        <div className="space-y-2">
          <label className="text-sm font-medium">{t('prompt.selectTargetFolder', '选择目标文件夹')}</label>
          <div className="border border-border rounded-lg max-h-[300px] overflow-y-auto">
            {/* Root folder option */}
            <button
              onClick={() => setSelectedFolderId(undefined)}
              className={`
                w-full flex items-center gap-2 px-3 py-2 text-left text-sm border-b border-border/50 transition-colors
                ${selectedFolderId === undefined
                  ? 'bg-primary/10 text-primary'
                  : 'hover:bg-accent/50 text-foreground'
                }
              `}
            >
              <span className="w-4" />
              <FolderIcon className="w-4 h-4 text-muted-foreground" />
              <span className="flex-1">{t('folder.root', '根目录')}</span>
              {selectedFolderId === undefined && <CheckIcon className="w-4 h-4 text-primary" />}
            </button>

            {/* Folder tree */}
            <div className="py-1">
              {folderTree.length === 0 ? (
                <div className="px-3 py-4 text-sm text-muted-foreground text-center">
                  {t('folder.noFolders', '暂无文件夹')}
                </div>
              ) : (
                renderFolderTree(folderTree)
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 pt-2">
          <Button onClick={onClose} variant="ghost">
            {t('common.cancel', '取消')}
          </Button>
          <Button
            onClick={handleMove}
            disabled={isLoading || selectedFolderId === prompt.folderId}
          >
            {isLoading ? t('common.moving', '移动中...') : t('common.move', '移动')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
