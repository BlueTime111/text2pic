import { create } from 'zustand';
import type { ContentWithId, Content } from '../types';
import * as storage from '../storage/editorStorage';

let initLock = false;

interface SelectionInfo {
  blockId: string;
  field: 'title' | 'content';
  start: number;
  end: number;
}

interface EditorState {
  contents: ContentWithId[];
  isLoading: boolean;
  error: string | null;
  selection: SelectionInfo | null;
  
  // Actions
  fetchContents: () => Promise<void>;
  addContent: (content: Content) => Promise<string>;
  updateContent: (content: ContentWithId) => void;
  deleteContent: (id: string) => Promise<void>;
  undoDeletedContents: (contents: ContentWithId[]) => Promise<void>;
  resetAllColors: () => void;
  resetAllBold: () => void;
  removeEmptyLines: () => void;
  setSelection: (sel: SelectionInfo | null) => void;
  applyColorToSelection: (color: string) => Promise<void>;
  applyMarkdownToSelection: (syntax: string) => void;
}

const saveTimeouts: Record<string, ReturnType<typeof setTimeout>> = {};

export const useEditorStore = create<EditorState>((set, get) => ({
  contents: [],
  isLoading: false,
  error: null,
  selection: null,

  fetchContents: async () => {
    if (get().isLoading) return;
    set({ isLoading: true, error: null });
    try {
      let contents = await storage.getContents();
      
      // Cleanup bugged empty duplicates from previous strict-mode race conditions
      const emptyBlocks = contents.filter(c => !c.title && !c.content);
      if (emptyBlocks.length > 1) {
        for (let i = 1; i < emptyBlocks.length; i++) {
          await storage.deleteContent(emptyBlocks[i].id);
        }
        contents = await storage.getContents();
      }

      if (contents.length === 0 && !initLock) {
        initLock = true;
        await storage.addContent({ title: '', content: '', type: 'normal_content' });
        contents = await storage.getContents();
      }
      set({ contents, isLoading: false });
    } catch (e: any) {
      set({ error: e.message, isLoading: false });
    }
  },

  addContent: async (content: Content) => {
    const id = await storage.addContent(content);
    const newContent = { ...content, id } as ContentWithId;
    set((state) => ({ contents: [...state.contents, newContent] }));
    return id;
  },

  updateContent: (content: ContentWithId) => {
    set((state) => ({
      contents: state.contents.map(c => c.id === content.id ? content : c)
    }));
    
    if (saveTimeouts[content.id]) {
      clearTimeout(saveTimeouts[content.id]);
    }
    
    saveTimeouts[content.id] = setTimeout(() => {
      const latest = get().contents.find(c => c.id === content.id);
      if (latest) storage.updateContent(latest).catch(console.error);
    }, 500);
  },

  deleteContent: async (id: string) => {
    const { contents } = get();
    // Delete children logic similar to text2img parentId
    const toDelete = contents.filter(c => c.id === id || c.parentId === id);
    for (const item of toDelete) {
      await storage.deleteContent(item.id);
    }
    const toDeleteIds = new Set(toDelete.map(d => d.id));
    set((state) => ({
      contents: state.contents.filter(c => !toDeleteIds.has(c.id))
    }));
  },
  
  undoDeletedContents: async (deletedContents: ContentWithId[]) => {
    for (const item of deletedContents) {
      await storage.updateContent(item); // Restores back the exact data with original ID
    }
    await get().fetchContents(); // Refresh
  },

  setSelection: (sel) => set({ selection: sel }),

  applyColorToSelection: async (color: string) => {
    const { selection, contents, updateContent } = get();
    if (!selection || selection.start === selection.end) return;

    const textareaId = `textarea-${selection.field}-${selection.blockId}`;
    const textarea = document.getElementById(textareaId) as HTMLTextAreaElement | null;
    
    if (textarea) {
      textarea.focus();
      textarea.setSelectionRange(selection.start, selection.end);
      
      const selected = textarea.value.substring(selection.start, selection.end);
      const newText = `[color=${color}]${selected}[/color]`;
      
      // Native insertion maintains the browser's native Ctrl+Z history stack!
      // This will trigger the native 'input' event, which naturally triggers our onChange!
      const success = document.execCommand('insertText', false, newText);
      
      if (success) {
        set({ selection: { ...selection, end: selection.start + newText.length } });
        return;
      }
    }

    // Fallback if browser blocks execCommand or element missing (loses native undo)
    const block = contents.find(c => c.id === selection.blockId);
    if (!block) return;
    
    const text = block[selection.field] || '';
    const selected = text.substring(selection.start, selection.end);
    const newText = text.substring(0, selection.start) + `[color=${color}]${selected}[/color]` + text.substring(selection.end);
    updateContent({ ...block, [selection.field]: newText });
  },

  resetAllColors: () => {
    const { contents } = get();
    // Recursively strip all [color=#...] and [/color] tags, case insensitive
    const stripTags = (text?: string) => text ? text.replace(/\[\/?color(?:=#[0-9a-fA-F]{3,8})?\]/gi, '') : (text || '');
    
    const strippedContents = contents.map(item => ({
      ...item,
      title: stripTags(item.title),
      content: stripTags(item.content)
    }));
    
    set({ contents: strippedContents });
    
    // Save to IndexedDB
    strippedContents.forEach(c => {
      if (saveTimeouts[c.id]) clearTimeout(saveTimeouts[c.id]);
      saveTimeouts[c.id] = setTimeout(() => {
        storage.updateContent(c).catch(console.error);
      }, 500);
    });
  },

  resetAllBold: () => {
    const { contents } = get();
    // Strip all markdown bold syntax (**)
    const stripTags = (text?: string) => text ? text.replace(/\*\*/g, '') : (text || '');
    
    const strippedContents = contents.map(item => ({
      ...item,
      title: stripTags(item.title),
      content: stripTags(item.content)
    }));
    
    set({ contents: strippedContents });
    
    // Save to IndexedDB
    strippedContents.forEach(c => {
      if (saveTimeouts[c.id]) clearTimeout(saveTimeouts[c.id]);
      saveTimeouts[c.id] = setTimeout(() => {
        storage.updateContent(c).catch(console.error);
      }, 500);
    });
  },

  removeEmptyLines: () => {
    const { contents } = get();
    // Split by new lines, filter out empty/whitespace lines, then join.
    const strippedContents = contents.map(item => {
      if (item.type !== 'normal_content') return item;
      return {
        ...item,
        content: item.content ? item.content.split('\n').filter(line => line.trim().length > 0).join('\n') : item.content
      };
    });
    
    set({ contents: strippedContents });
    
    // Save to IndexedDB
    strippedContents.forEach(c => {
      if (saveTimeouts[c.id]) clearTimeout(saveTimeouts[c.id]);
      saveTimeouts[c.id] = setTimeout(() => {
        storage.updateContent(c).catch(console.error);
      }, 500);
    });
  },

  applyMarkdownToSelection: (syntax: string) => {
    const { selection, contents, updateContent } = get();
    if (!selection || selection.start === selection.end) return;

    const textareaId = `textarea-${selection.field}-${selection.blockId}`;
    const textarea = document.getElementById(textareaId) as HTMLTextAreaElement | null;
    
    if (textarea) {
      textarea.focus();
      textarea.setSelectionRange(selection.start, selection.end);
      
      const selected = textarea.value.substring(selection.start, selection.end);
      const syntaxLen = syntax.length;
      let newText = `${syntax}${selected}${syntax}`;
      
      // Basic toggle logic
      if (selected.startsWith(syntax) && selected.endsWith(syntax)) {
        newText = selected.substring(syntaxLen, selected.length - syntaxLen);
      }
      
      const success = document.execCommand('insertText', false, newText);
      if (success) {
        set({ selection: { ...selection, end: selection.start + newText.length } });
        return;
      }
    }

    const block = contents.find(c => c.id === selection.blockId);
    if (!block) return;
    
    const text = block[selection.field] || '';
    const selected = text.substring(selection.start, selection.end);
    const syntaxLen = syntax.length;
    let newTextInner = `${syntax}${selected}${syntax}`;
    
    if (selected.startsWith(syntax) && selected.endsWith(syntax)) {
      newTextInner = selected.substring(syntaxLen, selected.length - syntaxLen);
    }
    
    const newText = text.substring(0, selection.start) + newTextInner + text.substring(selection.end);
    updateContent({ ...block, [selection.field]: newText });
  }
}));
