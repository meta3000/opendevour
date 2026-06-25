/**
 * AlphaAgent · Ant Design 暗色主题配置
 * 基于 antd v5 dark algorithm，覆盖所有设计系统 token
 * @see spec/01-design-system.md Section 3–5
 */
import { theme } from 'antd';
import type { ThemeConfig } from 'antd';

export const antdTheme: ThemeConfig = {
  algorithm: theme.darkAlgorithm,
  token: {
    // ---- 品牌色 ----
    colorPrimary:        '#6C63FF',
    colorLink:           '#6C63FF',
    colorLinkHover:      '#8179FF',

    // ---- 背景层级 ----
    colorBgBase:         '#0F1117',
    colorBgContainer:    '#171B26',
    colorBgElevated:     '#1E2335',
    colorBgLayout:       '#0F1117',
    colorBgSpotlight:    '#252A3D',

    // ---- 边框 ----
    colorBorder:         'rgba(255,255,255,0.12)',
    colorBorderSecondary:'rgba(255,255,255,0.06)',

    // ---- 文字 ----
    colorText:           '#F0F2F7',
    colorTextSecondary:  '#8B92A5',
    colorTextTertiary:   '#4E5568',
    colorTextQuaternary: '#343A4D',

    // ---- 金融语义色（覆盖 antd 默认） ----
    colorSuccess:        '#00C896',   // 盈利/买入
    colorWarning:        '#F5A623',   // 持有/警告
    colorError:          '#FF4D6A',   // 亏损/卖出

    // ---- 字体 ----
    fontFamily:          "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    fontSize:            13,
    fontSizeHeading1:    24,
    fontSizeHeading2:    20,
    fontSizeHeading3:    16,
    lineHeight:          1.6,

    // ---- 圆角 ----
    borderRadius:        6,
    borderRadiusLG:      10,
    borderRadiusSM:      4,

    // ---- 动效 ----
    motionDurationFast:  '0.12s',
    motionDurationMid:   '0.2s',
    motionDurationSlow:  '0.35s',

    // ---- 间距 ----
    padding:             16,
    paddingLG:           24,
    paddingSM:           12,
    paddingXS:           8,
  },
  components: {
    Layout: {
      siderBg:           '#171B26',
      headerBg:          '#171B26',
      bodyBg:            '#0F1117',
    },
    Menu: {
      darkItemBg:             '#171B26',
      darkSubMenuItemBg:      '#171B26',
      darkItemSelectedBg:     '#1E2335',
      darkItemSelectedColor:  '#F0F2F7',
      darkItemColor:          '#8B92A5',
      darkItemHoverBg:        '#1E2335',
      darkItemHoverColor:     '#F0F2F7',
      itemBorderRadius:       6,
      collapsedWidth:         56,
    },
    Table: {
      headerBg:          '#1E2335',
      headerColor:       '#8B92A5',
      rowHoverBg:        '#1E2335',
      borderColor:       'rgba(255,255,255,0.06)',
    },
    Card: {
      colorBgContainer:  '#171B26',
    },
    Collapse: {
      colorBgContainer:  '#171B26',
      headerBg:          '#171B26',
    },
    Modal: {
      contentBg:         '#1E2335',
      headerBg:          '#1E2335',
    },
    Select: {
      optionSelectedBg:  '#1E2335',
    },
  },
};
