import localforage from 'localforage';
import type { ContentWithId, Content } from '../types';

const store = localforage.createInstance({
  name: "text2pic",
  storeName: "contents"
});

export const getContents = async (): Promise<ContentWithId[]> => {
  const keys = await store.keys();
  const contents = await Promise.all(keys.map(k => store.getItem<ContentWithId>(k)));
  return contents.filter(Boolean) as ContentWithId[];
}

export const addContent = async (content: Content): Promise<string> => {
  const id = crypto.randomUUID();
  const newContent: ContentWithId = { ...content, id };
  await store.setItem(id, newContent);
  return id;
}

export const updateContent = async (content: ContentWithId): Promise<void> => {
  await store.setItem(content.id, content);
}

export const deleteContent = async (id: string): Promise<void> => {
  await store.removeItem(id);
}
