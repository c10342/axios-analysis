
module.exports = {
  title: "axios源码深入解读",
  description: "逐行剖析 axios 源码",
  plugins: {
    "@vuepress/back-to-top": true,
    "@vuepress/pwa": {
      serviceWorker: true,
      updatePopup: {
        "/": {
          message: "发现新内容可用",
          buttonText: "刷新"
        }
      }
    }
  },
  // head: [["link", { rel: "icon", href: `/images/wxlogo.png` }]],
  themeConfig: {
    repo: "c10342/axios-analysis",
    editLinks: true,
    docsDir: "docs",
    editLinkText: "帮助我们改善此页面！",
    nav: [
      { text: "首页", link: "/" },
      { text: "源码分析", link: "/analysis/01-prepare" },
      {
        text: "其他",
        items: [
          { text: "vue2组件库", link: "http://ui.linjiafu.top/" },
          { text: "视频播放器", link: "http://player.linjiafu.top/" },
          { text: "微信小程序组件库", link: "http://wxui.linjiafu.top/" }
        ]
      }
    ],
    displayAllHeaders: true,
    sidebar: [
      '/analysis/01-prepare',
      '/analysis/02-instance-create',
      '/analysis/03-axios-form',
      '/analysis/04-buildURL',
      '/analysis/05-request',
      '/analysis/06-interceptors',
      '/analysis/07-dispatchRequest',
      '/analysis/08-transformData',
      '/analysis/09-xhr',
      '/analysis/10-authentication',
      '/analysis/11-XSRF',
      '/analysis/12-isURLSameOrigin',
      '/analysis/13-cancel-request',
      '/analysis/14-http',
      '/analysis/15-createError',
      '/analysis/16-config',
      '/analysis/17-summary',
    ]
  }
};
