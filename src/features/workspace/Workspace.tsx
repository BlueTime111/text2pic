import { useEditorStore } from '@/domain/store/useEditorStore';
import { Button } from '@/components/ui/button';
import { PlusIcon, Trash2, Image as ImageIcon, AlignJustify } from 'lucide-react';
import TextareaAutosize from 'react-textarea-autosize';
import React, { memo, useCallback } from 'react';

const ParagraphBlock = memo(({ id }: { id: string }) => {
  const item = useEditorStore(useCallback(state => state.contents.find(c => c.id === id), [id]));
  const { updateContent, deleteContent, setSelection } = useEditorStore();

  if (!item) return null;

  const handleSelect = (field: 'title' | 'content', e: React.SyntheticEvent<HTMLTextAreaElement>) => {
    const target = e.target as HTMLTextAreaElement;
    setSelection({
      blockId: item.id,
      field,
      start: target.selectionStart,
      end: target.selectionEnd,
    });
  };

  return (
    <div className="p-4 border border-transparent rounded-xl shadow-sm bg-card relative group transition-all hover:border-border/60 hover:shadow-md">
      <TextareaAutosize 
        id={`textarea-title-${item.id}`}
        className="text-xl font-bold w-full bg-transparent outline-none mb-2 placeholder:text-muted resize-none overflow-hidden"
        value={item.title || ''}
        minRows={1}
        onChange={(e) => updateContent({ ...item, title: e.target.value })}
        onSelect={(e) => handleSelect('title', e)}
        onMouseUp={(e) => handleSelect('title', e)}
        onKeyUp={(e) => handleSelect('title', e)}
        placeholder="段落标题 (可选) / Title..."
      />
      <TextareaAutosize
        id={`textarea-content-${item.id}`}
        className="w-full bg-transparent outline-none resize-none placeholder:text-muted text-base overflow-hidden"
        value={item.content || ''}
        minRows={4}
        onChange={(e) => updateContent({ ...item, content: e.target.value })}
        onSelect={(e) => handleSelect('content', e)}
        onMouseUp={(e) => handleSelect('content', e)}
        onKeyUp={(e) => handleSelect('content', e)}
        placeholder="正文内容 / Post content..."
      />
      <Button 
        variant="destructive" size="icon" 
        className="absolute -right-3 -top-3 opacity-0 group-hover:opacity-100 transition-opacity z-10 shadow-sm"
        onClick={() => deleteContent(item.id)}
      >
        <Trash2 className="w-3.5 h-3.5" />
      </Button>
    </div>
  );
});
ParagraphBlock.displayName = 'ParagraphBlock';

const ImageBlock = memo(({ id }: { id: string }) => {
  const item = useEditorStore(useCallback(state => state.contents.find(c => c.id === id), [id]));
  const { updateContent, deleteContent } = useEditorStore();

  if (!item) return null;

  const scale = item.imageScale ?? 100;

  return (
    <div className="p-4 border border-transparent rounded-xl shadow-sm bg-card relative group transition-all hover:border-border/60 hover:shadow-md flex flex-col gap-3">
       
       <div className="flex flex-col items-center justify-center bg-secondary/5 relative rounded-md border border-dashed border-border/40 p-1 min-h-[60px]">
          <img 
            src={item.imageUrl} 
            className="h-auto rounded-sm shadow-sm transition-all object-contain" 
            style={{ width: `${scale}%` }} 
            alt="插图" 
          />
       </div>

       <div className="flex items-center gap-3 px-2 mt-1">
         <span className="text-[10px] font-bold text-muted-foreground whitespace-nowrap">大小缩放</span>
         <input 
           type="range" 
           min="10" 
           max="100" 
           value={scale}
           className="flex-1 h-1 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
           onChange={(e) => updateContent({ ...item, imageScale: parseInt(e.target.value) })}
         />
         <span className="text-[10px] font-mono font-bold text-muted-foreground w-8 text-right">{scale}%</span>
       </div>
       
       <div className="px-2 mt-2">
         <TextareaAutosize
            className="w-full bg-transparent outline-none resize-none placeholder:text-muted/40 text-sm text-center text-muted-foreground"
            value={item.imageCaption || ''}
            minRows={1}
            onChange={(e) => updateContent({ ...item, imageCaption: e.target.value })}
            placeholder="填写图片下划线说明 (可选)..."
          />
       </div>

       <Button 
        variant="destructive" size="icon" 
        className="absolute -right-3 -top-3 opacity-0 group-hover:opacity-100 transition-opacity z-10 shadow-sm"
        onClick={() => deleteContent(item.id)}
      >
        <Trash2 className="w-3.5 h-3.5" />
      </Button>
    </div>
  );
});
ImageBlock.displayName = 'ImageBlock';

export function Workspace() {
  const contents = useEditorStore(state => state.contents);
  const addContent = useEditorStore(state => state.addContent);

  return (
    <div className="w-full max-w-xl mx-auto flex flex-col gap-8 py-4">
      <div className="flex justify-end mb-[-1rem]">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => useEditorStore.getState().removeEmptyLines()} 
          className="text-muted-foreground hover:text-foreground hover:bg-secondary/50 h-8 text-xs font-bold"
        >
          <AlignJustify className="w-3.5 h-3.5 mr-1.5" />
          一键删除空行
        </Button>
      </div>

      {contents.map((item) => (
        item.type === 'image' ? 
          <ImageBlock key={item.id} id={item.id} /> : 
          <ParagraphBlock key={item.id} id={item.id} />
      ))}

      <div className="grid grid-cols-2 gap-4 mt-2">
        <Button 
          variant="outline" 
          className="h-20 border-2 border-dashed text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors bg-card/50"
          onClick={() => addContent({ title: '', content: '', type: 'normal_content' })}
        >
          <PlusIcon className="w-5 h-5 mr-2"/> 添加文字段落
        </Button>

        <div className="relative h-20 group">
           <Button 
             variant="outline" 
             className="w-full h-full border-2 border-dashed text-muted-foreground group-hover:text-foreground group-hover:border-primary/50 transition-colors bg-card/50 pointer-events-none"
           >
             <ImageIcon className="w-5 h-5 mr-2"/> 插入长图插图
           </Button>
           <input 
              type="file" 
              accept="image/*"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                   const reader = new FileReader();
                   reader.onload = (event) => {
                      const base64 = event.target?.result as string;
                      addContent({ type: 'image', imageUrl: base64, imageCaption: '', imageScale: 100 });
                   };
                   reader.readAsDataURL(file);
                }
                e.target.value = '';
              }}
           />
        </div>
      </div>
    </div>
  );
}
