import { useEditorStore } from '@/domain/store/useEditorStore';
import { useThemeStore } from '@/domain/store/useThemeStore';
import { cn } from '@/lib/utils';
import { forwardRef } from 'react';

export const Preview = forwardRef<HTMLDivElement, { className?: string; id?: string }>(({ className, id }, ref) => {
  const contents = useEditorStore(state => state.contents);
  const { fontSize, fontFamily } = useThemeStore();

  const processMarkdown = (text: string) => {
    if (!text) return '';
    let html = text.replace(/</g, "&lt;").replace(/>/g, "&gt;"); // XSS basic
    
    // Bold
    html = html.replace(/\*\*([\s\S]*?)\*\*/g, '<strong class="font-extrabold mx-[2px] bg-primary/10 px-1 rounded-sm">$1</strong>');
    
    // Colors: [color=#HEX]text[/color]
    html = html.replace(/\[color=(#[0-9a-fA-F]{3,8})\]([\s\S]*?)\[\/color\]/g, '<span style="color:$1">$2</span>');

    return html;
  };

  return (
    <div 
      id={id}
      ref={ref} 
      className={cn(
        "w-[420px] bg-white dark:bg-[#1a1b1e] min-h-[600px] shadow-2xl p-10 flex flex-col gap-6 rounded-sm border border-slate-100 dark:border-slate-800/80 text-left", 
        fontFamily === 'serif' ? 'font-serif' : fontFamily === 'mono' ? 'font-mono' : 'font-sans',
        className
      )}
    >
      {contents.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-muted-foreground">
          无内容可预览 / No Content
        </div>
      ) : (
        contents.map(item => (
          <div key={item.id} className="flex flex-col gap-3 relative break-words" style={{ fontSize: `${fontSize}px` }}>
            {item.type === 'image' ? (
              <div className="flex flex-col items-center gap-2 my-2 w-full">
                <img 
                  src={item.imageUrl} 
                  alt="插图" 
                  className="h-auto rounded-lg shadow-sm border border-slate-200/50 dark:border-slate-800" 
                  style={{ width: `${item.imageScale ?? 100}%` }}
                />
                {item.imageCaption && (
                  <span className="text-[0.75em] text-muted-foreground/60 tracking-wider text-center mt-1">
                    {item.imageCaption}
                  </span>
                )}
              </div>
            ) : (
              <>
                {item.title && (
                  <h2 
                    className={cn("font-black leading-snug whitespace-pre-wrap text-slate-800 dark:text-slate-100")} 
                    style={{ fontSize: '1.4em' }}
                    dangerouslySetInnerHTML={{ __html: processMarkdown(item.title) }}
                  />
                )}
                {item.content && (
                  <div 
                    className={cn("whitespace-pre-wrap leading-[1.8] text-justify text-slate-600 dark:text-slate-300")} 
                    style={{ fontSize: '1em' }}
                    dangerouslySetInnerHTML={{ __html: processMarkdown(item.content) }}
                  />
                )}
              </>
            )}
          </div>
        ))
      )}
    </div>
  );
});
Preview.displayName = 'Preview';
