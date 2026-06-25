/** 策略编排 — 占位页面 */

import { SlidersHorizontal } from 'lucide-react';
import { PlaceholderPage } from '../_placeholder/PlaceholderPage';
export default function StrategyBuilder() {
  return <PlaceholderPage title="策略编排" icon={<SlidersHorizontal size={32} color="#6C63FF" />} description="基于条件规则和 @antv/x6 画布构建量化投资策略" />;
}
