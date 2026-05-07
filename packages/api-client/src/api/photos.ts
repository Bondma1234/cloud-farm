// ============ 照片墙 API ============
import { get } from '../http';

export interface PhotoPost {
  id: string;
  user: { nickname: string; avatar: string };
  photo: string;
  caption: string;
  plotId?: string | null;
  crop?: string | null;
  likes: number;
  comments: number;
  at: string; // 已格式化好的相对时间
}

export function listPhotos(): Promise<PhotoPost[]> {
  return get<PhotoPost[]>('/photos');
}
