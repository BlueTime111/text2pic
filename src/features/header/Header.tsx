import { Button } from '@/components/ui/button';
import { captureToPng } from '@/core/renderer/imageGenerator';
import { DownloadIcon } from 'lucide-react';

import { useState } from 'react';

export function Header({ previewId }: { previewId: string }) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      const el = document.getElementById(previewId);
      if (!el) throw new Error('Preview element not found');
      
      const dataUrl = await captureToPng(el, 3);
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `text2img-export-${Date.now()}.png`;
      a.click();
    } catch (err) {
      console.error(err);
      alert('导出图片失败，可能存在跨域或不兼容的渲染资源。');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <header className="h-14 border-b flex items-center justify-between px-6 bg-card text-card-foreground shadow-sm z-10 shrink-0">
      <h1 className="font-bold text-lg tracking-tight">Text2Pic</h1>
      <Button onClick={handleExport} size="sm" disabled={isExporting} className="transition-all">
        {isExporting ? (
          <>
            <div className="w-4 h-4 mr-2 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
            正在生成渲染...
          </>
        ) : (
          <>
            <DownloadIcon className="w-4 h-4 mr-2" />
            导出高清长图
          </>
        )}
      </Button>
    </header>
  );
}
