export interface ImageFile {
  uid: number;
  name: string;
  dataUrl: string;
  type?: string;
}

export interface Content {
  title?: string;
  content?: string;
  uploadFiles?: ImageFile[];
  parentId?: string | null;
  childOrder?: number;
  type?: 'theme_content' | 'normal_content' | 'image';
  
  // Image specific
  imageUrl?: string;
  imageCaption?: string;
  imageScale?: number;

  // Theme specific additions
  template?: string;
  theme?: string;
}

export interface ContentWithId extends Content {
  id: string; 
}

export interface Size {
  width: number;
  height: number | 'auto';
}
