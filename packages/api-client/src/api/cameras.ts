// ============ 摄像头 API (JWT) ============
import { get, post } from '../http';

export interface CameraUrl {
  url: string;
  vendor: string;
  online: boolean;
  ptzSupported: boolean;
  ttl: number;
}

export type PtzDirection = 'up' | 'down' | 'left' | 'right' | 'zoom-in' | 'zoom-out' | 'reset';

/** 拉地块摄像头播放地址(用户必须是该地块认养人,否则 403) */
export function getCameraUrl(plotId: string): Promise<CameraUrl> {
  return get<CameraUrl>(`/cameras/${plotId}/url`);
}

/** PTZ 云台控制 */
export function cameraPtz(plotId: string, direction: PtzDirection) {
  return post<{ ok: true; direction: string }>(`/cameras/${plotId}/ptz`, { direction });
}

/** 抓拍(后端自动写一条 JournalEntry) */
export function cameraSnapshot(plotId: string) {
  return post<{ url: string; at: string }>(`/cameras/${plotId}/snapshot`);
}
