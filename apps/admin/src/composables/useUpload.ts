// ============ 文件上传 composable ============
// 抽统一调 POST /api/upload 的逻辑,Packages / Commands / Journal 三处复用
//
// 用法 (template):
//   <el-upload :before-upload="beforeUpload" :http-request="uploadOne" :show-file-list="false">
//     <el-button>选择图片</el-button>
//   </el-upload>
//
// 用法 (script):
//   const { uploadOne, beforeUpload, uploading } = useUpload(url => { form.cover = url });
//
import { ref } from 'vue';
import { ElMessage } from 'element-plus';
import { getAccessToken } from '@cloud-farm/api-client';

export interface UploadResult {
  url: string;
  filename: string;
  size: number;
  mimetype: string;
}

/**
 * @param onSuccess(url) 每次上传成功的回调,业务方决定怎么用(单图直接赋值 / 多图 push 进数组)
 * @param maxSizeMB 单文件最大,默认 5MB(后端硬限制就是 5MB)
 */
export function useUpload(
  onSuccess: (url: string, full: UploadResult) => void,
  maxSizeMB = 5,
) {
  const uploading = ref(false);

  function beforeUpload(file: File): boolean {
    if (!file.type.startsWith('image/')) {
      ElMessage.error('只能上传图片');
      return false;
    }
    if (file.size > maxSizeMB * 1024 * 1024) {
      ElMessage.error(`图片不能超过 ${maxSizeMB}MB`);
      return false;
    }
    return true;
  }

  async function uploadOne(opt: { file: File }) {
    uploading.value = true;
    try {
      const fd = new FormData();
      fd.append('file', opt.file);
      const token = getAccessToken() ?? '';
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: fd,
      });
      const body = await res.json();
      if (!res.ok || body.code !== 0) {
        throw new Error(body.message || `上传失败 (HTTP ${res.status})`);
      }
      const data = body.data as UploadResult;
      onSuccess(data.url, data);
      ElMessage.success(`已上传:${data.filename}`);
      return data;
    } catch (e) {
      ElMessage.error(`上传失败:${(e as Error).message}`);
      throw e;
    } finally {
      uploading.value = false;
    }
  }

  return { uploadOne, beforeUpload, uploading };
}
