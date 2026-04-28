<template>
  <view class="page">
    <!-- 顶部 -->
    <view class="head">
      <text class="title">田主照片墙</text>
      <text class="sub">{{ photos.length }} 位田主已晒图 · 总 {{ totalLikes }} 点赞</text>
    </view>

    <!-- 模式切换 -->
    <view class="modes">
      <view :class="['mode', mode === 'grid' && 'active']" @tap="mode = 'grid'">
        <text>⊞</text><text>瀑布流</text>
      </view>
      <view :class="['mode', mode === 'feed' && 'active']" @tap="mode = 'feed'">
        <text>☰</text><text>大图模式</text>
      </view>
      <view class="mode-spacer" />
      <view class="post-btn" @tap="post">＋ 发图</view>
    </view>

    <!-- 瀑布流模式 -->
    <view v-if="mode === 'grid'" class="grid">
      <view class="g-card" v-for="p in photos" :key="p.id" @tap="openFeed(p)">
        <image :src="p.photo" mode="aspectFill" class="g-img" />
        <view class="g-overlay">
          <view class="g-avatar">{{ p.user.avatar }}</view>
          <text class="g-name">{{ p.user.nickname }}</text>
          <view class="g-likes">
            <text>👍</text>
            <text>{{ p.likes }}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 大图模式 -->
    <view v-else class="feed">
      <view class="f-card" v-for="p in photos" :key="p.id">
        <view class="f-h">
          <view class="f-avatar">{{ p.user.avatar }}</view>
          <view class="f-meta">
            <text class="f-name">{{ p.user.nickname }}</text>
            <text class="f-loc">{{ p.plotId }} · {{ p.crop }}</text>
          </view>
          <text class="f-time">{{ p.at }}</text>
        </view>
        <image :src="p.photo" mode="aspectFill" class="f-img" @tap="preview(p)" />
        <view class="f-body">
          <text class="f-cap">{{ p.caption }}</text>
          <view class="f-acts">
            <view class="f-act" @tap="like(p)">
              <text>👍</text><text>{{ p.likes }}</text>
            </view>
            <view class="f-act" @tap="comment(p)">
              <text>💬</text><text>{{ p.comments }}</text>
            </view>
            <view class="f-act" @tap="share(p)">
              <text>🔗</text><text>分享</text>
            </view>
          </view>
        </view>
      </view>
    </view>

    <view style="height: 40px" />
  </view>
</template>

<script setup>
import Taro from '@tarojs/taro';
import { ref, computed } from 'vue';
import { PHOTO_WALL } from '../../stores/mock';

const photos = PHOTO_WALL;
const mode = ref('grid');

const totalLikes = computed(() => photos.reduce((s, p) => s + (p.likes || 0), 0));

const openFeed = (p) => {
  mode.value = 'feed';
  Taro.showToast({ title: `来自 ${p.user.nickname}`, icon: 'none' });
};
const preview = (p) => {
  if (Taro.previewImage) {
    Taro.previewImage({ urls: [p.photo], current: p.photo });
  } else {
    Taro.showToast({ title: '查看大图（mock）', icon: 'none' });
  }
};
const like = (p) => Taro.showToast({ title: '已点赞 +1', icon: 'success' });
const comment = (p) => Taro.showToast({ title: '评论功能（待开放）', icon: 'none' });
const share = (p) => Taro.showToast({ title: '分享卡片（待开放）', icon: 'none' });
const post = () => Taro.showToast({ title: '发图功能（待开放）', icon: 'none' });
</script>

<style lang="scss" scoped>
.page { padding-bottom: 32px; background: var(--color-surface-alt); min-height: 100vh; }

.head {
  background: linear-gradient(135deg, #4CA777 0%, #2E7D32 100%);
  color: #fff; padding: 22px 18px;
}
.title { font-size: 22px; font-weight: 700; display: block; }
.sub { font-size: 12px; opacity: 0.88; margin-top: 4px; display: block; }

.modes {
  display: flex; align-items: center; gap: 8px;
  padding: 10px 12px; background: #fff;
  border-bottom: 1px solid var(--color-divider);
}
.mode {
  display: flex; align-items: center; gap: 4px;
  padding: 5px 12px; border-radius: 999px;
  background: var(--color-surface-alt); color: var(--color-text-sub);
  font-size: 12px; cursor: pointer;
}
.mode.active { background: var(--color-primary); color: #fff; }
.mode-spacer { flex: 1; }
.post-btn {
  background: var(--color-accent); color: #8D6E00;
  font-size: 12px; font-weight: 600;
  padding: 5px 14px; border-radius: 999px; cursor: pointer;
}

/* 瀑布流模式 */
.grid {
  padding: 8px;
  display: grid; gap: 8px;
  grid-template-columns: 1fr 1fr;
}
@media (min-width: 720px) {
  .grid { grid-template-columns: 1fr 1fr 1fr; }
}
.g-card {
  position: relative; border-radius: 12px; overflow: hidden;
  background: var(--color-primary-light); cursor: pointer;
  aspect-ratio: 1;
}
.g-img { width: 100%; height: 100%; display: block; object-fit: cover; }
.g-overlay {
  position: absolute; left: 0; right: 0; bottom: 0;
  background: linear-gradient(to top, rgba(0,0,0,0.7), transparent);
  padding: 10px 8px 6px; color: #fff;
  display: flex; align-items: center; gap: 6px;
}
.g-avatar {
  width: 22px; height: 22px; border-radius: 50%;
  background: rgba(255,255,255,0.3);
  display: flex; align-items: center; justify-content: center;
  font-size: 12px;
}
.g-name { flex: 1; font-size: 11px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.g-likes { display: flex; gap: 2px; font-size: 11px; }

/* 大图模式 */
.feed { padding: 12px; display: flex; flex-direction: column; gap: 12px; }
.f-card {
  background: #fff; border-radius: 14px; overflow: hidden;
  box-shadow: var(--shadow-sm);
}
.f-h {
  display: flex; align-items: center; gap: 10px;
  padding: 12px 14px;
}
.f-avatar {
  width: 36px; height: 36px; border-radius: 50%;
  background: var(--color-primary-light);
  display: flex; align-items: center; justify-content: center;
  font-size: 18px;
}
.f-meta { flex: 1; display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.f-name { font-size: 13px; font-weight: 600; }
.f-loc { font-size: 11px; color: var(--color-text-mute); }
.f-time { font-size: 11px; color: var(--color-text-mute); }

.f-img {
  width: 100%; height: 280px; display: block;
  background: var(--color-primary-light); object-fit: cover;
}

.f-body { padding: 12px 14px; }
.f-cap { font-size: 13px; color: var(--color-text); line-height: 1.55; display: block; }

.f-acts {
  display: flex; gap: 22px; padding-top: 10px; margin-top: 10px;
  border-top: 1px solid var(--color-divider);
}
.f-act {
  display: flex; align-items: center; gap: 4px;
  font-size: 12px; color: var(--color-text-mute); cursor: pointer;
}
</style>
