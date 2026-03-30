import { useEffect, useState } from 'react'
import { useEditorStore } from './domain/store/useEditorStore'
import { useThemeStore } from './domain/store/useThemeStore'
import { Header } from './features/header/Header'
import { Workspace } from './features/workspace/Workspace'
import { Preview } from './features/preview/Preview'
import { PlusIcon, MinusIcon, SunIcon, MoonIcon, PaletteIcon, RotateCcw, ZoomIn, X } from 'lucide-react'
import { Button } from './components/ui/button'

// From Mockup Palette:
const PRESET_COLORS = ['#AC8BFF', '#FF6E8D', '#52C6FF'];

function App() {
  const fetchContents = useEditorStore(state => state.fetchContents)
  const isDarkMode = useThemeStore(state => state.isDarkMode)
  const { 
    fontSize, setFontSize, 
    textColor, setTextColor, 
    customColor, setCustomColor,
    toggleDarkMode, 
    fontFamily, setFontFamily 
  } = useThemeStore()
  
  const [isPreviewExpanded, setIsPreviewExpanded] = useState(false);
  const paletteColors = [...PRESET_COLORS, customColor];

  useEffect(() => {
    fetchContents()
  }, [fetchContents])

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode])

  return (
    <div className="flex flex-col h-screen w-full bg-background text-foreground overflow-hidden">
      <Header previewId="capture-area" />
      <main className="flex flex-1 overflow-hidden min-h-0 w-full">
        
        {/* 左侧垂直边栏工具条 (Sidebar - Expanded Settings Panel) */}
        <aside className="w-[300px] border-r flex flex-col py-6 px-5 gap-6 bg-card/60 shadow-sm z-20 shrink-0 overflow-y-auto hiddenBar">
          
          {/* 1. 字号组 FONT SIZE */}
          <div className="flex flex-col gap-4 p-5 rounded-2xl border bg-card shadow-sm">
            <div className="flex justify-between items-center mb-1">
              <div className="flex items-center px-2.5 py-1 rounded-md bg-secondary/60 border border-border/50">
                <span className="text-[11px] font-black tracking-widest text-foreground">字号</span>
              </div>
              <button 
                onClick={() => setFontSize(17)} 
                className="text-[10px] text-muted-foreground/70 hover:text-foreground font-bold uppercase tracking-wider flex items-center gap-1 transition-colors"
              >
                <RotateCcw className="w-3 h-3" /> 重置
              </button>
            </div>
            <div className="flex items-center justify-between w-full px-1">
              <Button variant="outline" size="icon" className="h-9 w-9 rounded-xl border-muted-foreground/20 hover:bg-secondary" onClick={() => setFontSize(Math.max(12, fontSize - 1))}>
                <MinusIcon className="w-4 h-4 text-muted-foreground" />
              </Button>
              <div className="relative flex items-center justify-center w-16 h-9">
                <input 
                  type="text"
                  inputMode="numeric"
                  value={fontSize || ''}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    setFontSize(isNaN(val) ? 0 : val);
                  }}
                  onBlur={() => setFontSize(Math.min(40, Math.max(12, fontSize || 16)))}
                  className="text-3xl font-black text-primary leading-none bg-transparent outline-none border-none text-center w-full p-0 m-0"
                />
                <span className="text-[9px] text-muted-foreground/70 font-bold tracking-widest uppercase absolute -bottom-4 left-1/2 -translate-x-1/2 pointer-events-none">PX</span>
              </div>
              <Button variant="outline" size="icon" className="h-9 w-9 rounded-xl border-muted-foreground/20 hover:bg-secondary" onClick={() => setFontSize(Math.min(40, fontSize + 1))}>
                <PlusIcon className="w-4 h-4 text-muted-foreground" />
              </Button>
            </div>
          </div>

          {/* 2. 颜色组 */}
          <div className="flex flex-col gap-4 p-5 rounded-2xl border bg-card shadow-sm">
            <div className="flex justify-between items-center">
              <div className="flex items-center px-2.5 py-1 rounded-md bg-secondary/60 border border-border/50">
                <span className="text-[11px] font-black tracking-widest text-foreground">颜色</span>
              </div>
              <button onClick={() => useEditorStore.getState().resetAllColors()} className="text-[10px] text-muted-foreground/70 hover:text-foreground font-bold uppercase tracking-wider flex items-center gap-1 transition-colors">
                <RotateCcw className="w-3 h-3" /> 重置
              </button>
            </div>
            <div className="flex items-center gap-3.5">
              {paletteColors.map((c, idx) => {
                const isSelected = textColor?.toLowerCase() === c.toLowerCase();
                
                return (
                  <button 
                    key={`${idx}-${c}`}
                    onClick={() => {
                      setTextColor(c);
                      useEditorStore.getState().applyColorToSelection(c);
                    }}
                    className={`w-8 h-8 rounded-full border shadow-sm transition-transform hover:scale-110 ${isSelected ? 'ring-2 ring-primary ring-offset-[3px] dark:ring-offset-background' : ''}`}
                    style={{ backgroundColor: c }}
                  />
                );
              })}
              <div className="relative w-8 h-8 rounded-full border-2 border-dashed border-muted-foreground/40 text-muted-foreground/70 flex items-center justify-center cursor-pointer hover:bg-secondary transition-colors hover:text-foreground">
                <PlusIcon className="w-4 h-4" />
                <input 
                  type="color" 
                  value={textColor || (isDarkMode ? '#ffffff' : '#000000')} 
                  onChange={e => {
                    const val = e.target.value;
                    setCustomColor(val);
                    setTextColor(val);
                    useEditorStore.getState().applyColorToSelection(val);
                  }}
                  className="absolute inset-[0px] w-[32px] h-[32px] cursor-pointer opacity-0" 
                />
              </div>
            </div>
            
            <div className="flex items-center justify-between bg-secondary/40 border border-border/50 px-4 py-3 rounded-xl mt-2 relative">
               <span className="text-[10px] font-bold text-muted-foreground tracking-widest flex items-center shrink-0">
                  HEX:
               </span>
               <input 
                  type="text"
                  value={textColor || ''}
                  maxLength={7}
                  spellCheck={false}
                  className="bg-transparent border-none outline-none font-mono text-xs uppercase font-bold text-foreground ml-3 w-full"
                  onChange={(e) => {
                    const val = e.target.value;
                    setTextColor(val);
                    
                    if (/^#([0-9A-Fa-f]{3}){1,2}$/.test(val)) {
                      useEditorStore.getState().applyColorToSelection(val);
                      const isPreset = PRESET_COLORS.some(p => p.toLowerCase() === val.toLowerCase());
                      if (!isPreset) {
                        setCustomColor(val);
                      }
                    }
                  }}
               />
               <PaletteIcon className="w-3.5 h-3.5 text-muted-foreground/50 shrink-0" />
            </div>
          </div>

          {/* 3. 字体与样式组 */}
          <div className="flex flex-col gap-3 p-5 rounded-2xl border bg-card shadow-sm">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center px-2.5 py-1 rounded-md bg-secondary/60 border border-border/50 w-fit">
                <span className="text-[11px] font-black tracking-widest text-foreground">字体与样式</span>
              </div>
              <button 
                onClick={() => {
                  setFontFamily('sans');
                  useEditorStore.getState().resetAllBold();
                }} 
                className="text-[10px] text-muted-foreground/70 hover:text-foreground font-bold uppercase tracking-wider flex items-center gap-1 transition-colors"
                title="恢复默认字体并清除全局加粗"
              >
                <RotateCcw className="w-3 h-3" /> 重置
              </button>
            </div>
            
            <button onClick={() => setFontFamily('sans')} className={`flex items-center gap-4 p-3.5 rounded-xl border transition-all ${fontFamily === 'sans' ? 'bg-primary text-primary-foreground shadow-md' : 'bg-secondary/40 border-transparent hover:bg-secondary text-foreground'}`}>
               <span className="font-sans text-xl font-black w-8 text-center leading-none">Aa</span>
               <span className="font-sans font-bold text-[13px] tracking-widest">无衬线 Sans</span>
            </button>
            
            <button onClick={() => setFontFamily('serif')} className={`flex items-center gap-4 p-3.5 rounded-xl border transition-all ${fontFamily === 'serif' ? 'bg-primary text-primary-foreground shadow-md' : 'bg-secondary/40 border-transparent hover:bg-secondary text-foreground'}`}>
               <span className="font-serif text-2xl font-bold italic w-8 text-center leading-none">Aa</span>
               <span className="font-serif font-bold text-[13px] tracking-widest">有衬线 Serif</span>
            </button>

            <button onClick={() => useEditorStore.getState().applyMarkdownToSelection('**')} className="flex items-center gap-4 p-3.5 rounded-xl border border-transparent bg-secondary/40 hover:bg-secondary text-foreground transition-all">
               <span className="font-sans text-xl font-black w-8 text-center leading-none">B</span>
               <span className="font-sans font-bold text-[13px] tracking-widest">选区加粗 Bold</span>
            </button>
          </div>

          {/* 主题暗黑模式 */}
          <div className="mt-auto pt-6 pb-2 flex justify-between items-center px-2">
             <div className="flex items-center gap-2 text-foreground/70">
               {isDarkMode ? <MoonIcon className="w-4 h-4" /> : <SunIcon className="w-4 h-4" />}
               <span className="text-[11px] font-black tracking-[0.15em] uppercase">{isDarkMode ? '深色模式' : '浅色模式'}</span>
             </div>
             
             <button 
               onClick={toggleDarkMode}
               className={`w-12 h-6 rounded-full p-1 transition-colors flex items-center ${isDarkMode ? 'bg-primary' : 'bg-muted-foreground/30'}`}
             >
                <div className={`w-4 h-4 rounded-full bg-white dark:bg-background transition-transform ${isDarkMode ? 'translate-x-6' : 'translate-x-0'}`} />
             </button>
          </div>
        </aside>

        {/* 编辑区 (Editor Workspace) - Flex 6 */}
        <div className="flex-[6] border-r bg-card/10 overflow-x-hidden overflow-y-auto h-full w-full px-6 py-10 relative">
          <Workspace />
        </div>
        
        {/* 预览区 (Preview Area) - Flex 4 */}
        <div className="flex-[4] bg-secondary/30 shrink-0 border-l overflow-x-hidden overflow-y-auto h-full w-full pt-8 pb-32 flex justify-center items-start content-start relative">
             <div 
               className="relative group cursor-zoom-in shrink-0" 
               onClick={() => setIsPreviewExpanded(true)}
               title="点击放大阅览"
             >
               <Preview id="capture-area" className="shrink-0 shadow-lg group-hover:blur-[2px] transition-all duration-300" />
               <div className="absolute inset-0 transition-opacity duration-300 opacity-0 group-hover:opacity-100 flex items-center justify-center bg-black/5 dark:bg-white/5 rounded-sm">
                 <div className="bg-background/95 backdrop-blur-md px-5 py-3 rounded-full shadow-2xl text-foreground font-black tracking-[0.1em] text-sm flex items-center gap-2.5 scale-90 group-hover:scale-100 transition-transform">
                   <ZoomIn className="w-4 h-4 text-primary" />
                   放大阅览
                 </div>
               </div>
             </div>
        </div>
      </main>

      {/* 大屏阅览弹窗 Modal */}
      {isPreviewExpanded && (
        <div className="fixed inset-0 z-50 bg-background/90 backdrop-blur-sm flex flex-col animate-in fade-in duration-200">
          <div className="flex justify-between items-center p-4 border-b border-border/40 shrink-0 bg-background/80">
            <span className="text-muted-foreground font-bold tracking-widest text-xs ml-4">沉浸式阅览 IMMERSIVE VIEW</span>
            <Button variant="ghost" size="icon" className="rounded-full shadow-none hover:bg-secondary" onClick={() => setIsPreviewExpanded(false)}>
              <X className="w-5 h-5 text-foreground" />
            </Button>
          </div>
          <div className="flex-1 overflow-auto w-full h-full p-8 md:p-12 flex justify-center items-start" onClick={() => setIsPreviewExpanded(false)}>
            <div 
              className="origin-top pb-32 cursor-zoom-out" 
              onClick={(e) => e.stopPropagation()}
              style={{ transform: 'scale(1.25)' }}
            >
              <Preview className="shadow-2xl ring-1 ring-border/20 cursor-auto" />
            </div>
          </div>
        </div>
      )}

      <style>{`
        .hiddenBar::-webkit-scrollbar { display: none; }
        .hiddenBar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  )
}

export default App
