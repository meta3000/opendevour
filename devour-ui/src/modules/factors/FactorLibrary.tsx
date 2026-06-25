/** 因子管理 — 占位页面 */

import { FunctionSquare } from 'lucide-react';
import { PlaceholderPage } from '../_placeholder/PlaceholderPage';
export default function FactorLibrary() {
  return <PlaceholderPage title="因子管理" icon={<FunctionSquare size={32} color="#6C63FF" />} description="管理日终/实时/自定义因子，Monaco 编辑器编写 Python 公式" />;
}
