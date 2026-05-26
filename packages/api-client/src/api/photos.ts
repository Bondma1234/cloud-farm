// ============ 照片墙 API ============
import { get, patch, del } from '../http';

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

export interface AdminPhotoPost extends PhotoPost {
  status: 'active' | 'removed';
  atIso: string;
}

export function listPhotos(): Promise<PhotoPost[]> {
  return get<PhotoPost[]>('/photos');
}

// ============ Admin · 审核 ============
export function listAdminPhotos(status?: 'active' | 'removed'): Promise<AdminPhotoPost[]> {
  const qs = status ? `?status=${status}` : '';
  return get<AdminPhotoPost[]>(`/admin/photos${qs}`);
}

export function setPhotoStatus(id: string, status: 'active' | 'removed'): Promise<AdminPhotoPost> {
  return patch<AdminPhotoPost>(`/admin/photos/${id}/status`, { status });
}

export function deletePhoto(id: string): Promise<{ ok: true }> {
  return del<{ ok: true }>(`/admin/photos/${id}`);
}
