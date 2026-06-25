/** 数据源管理 — 占位页面 */

import { Database } from 'lucide-react';
import { PlaceholderPage } from '../_placeholder/PlaceholderPage';
export default function DataSources() {
  return <PlaceholderPage title="数据源管理" icon={<Database size={32} color="#6C63FF" />} description="接入市场数据、新闻、研报、音视频等多类数据源" />;
}
