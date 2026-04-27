export default {
  pages: [
    'pages/home/index',
    'pages/packages/index',
    'pages/package-detail/index',
    'pages/plot-picker/index',
    'pages/checkout/index',
    'pages/my-plot/index',
    'pages/live/index',
    'pages/profile/index'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#4CA777',
    navigationBarTitleText: '云上田园',
    navigationBarTextStyle: 'white'
  },
  tabBar: {
    color: '#999999',
    selectedColor: '#2E7D32',
    backgroundColor: '#FFFFFF',
    borderStyle: 'black',
    list: [
      { pagePath: 'pages/home/index', text: '首页' },
      { pagePath: 'pages/packages/index', text: '认养' },
      { pagePath: 'pages/my-plot/index', text: '我的田' },
      { pagePath: 'pages/profile/index', text: '我的' }
    ]
  }
};
