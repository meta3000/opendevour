/**
 * 相关性矩阵 - CSS Grid 热力图
 * 展示前6支持仓之间的相关系数矩阵，颜色表示相关性强弱
 */
import { Tooltip } from 'antd';
import { mockCorrelationMatrix, mockCorrelationSymbols } from '../../mock/portfolio.mock';

/** 相关系数 → 背景色 */
function corrToColor(corr: number): string {
  if (corr === 1) return 'rgba(100, 180, 255, 0.35)';
  if (corr >= 0.6) return 'rgba(0, 200, 150, 0.25)';
  if (corr >= 0.3) return 'rgba(0, 200, 150, 0.10)';
  if (corr >= -0.1) return 'rgba(255,255,255,0.04)';
  if (corr >= -0.4) return 'rgba(255, 77, 106, 0.10)';
  return 'rgba(255, 77, 106, 0.25)';
}

function corrToTextColor(corr: number): string {
  if (corr >= 0.6) return '#00C896';
  if (corr <= -0.4) return '#FF4D6A';
  return 'rgba(255,255,255,0.65)';
}

const n = mockCorrelationSymbols.length; // 6

export default function CorrelationMatrix() {
  const cellSize = 42;

  return (
    <div>
      {/* 列头 */}
      <div style={{ display: 'grid', gridTemplateColumns: `40px repeat(${n}, ${cellSize}px)`, marginBottom: 2 }}>
        <div />
        {mockCorrelationSymbols.map((s) => (
          <div
            key={s.symbol}
            style={{
              fontSize: 10,
              textAlign: 'center',
              color: 'rgba(255,255,255,0.45)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              padding: '0 2px',
            }}
          >
            {s.name}
          </div>
        ))}
      </div>

      {/* 行 */}
      {mockCorrelationSymbols.map((rowS, i) => (
        <div
          key={rowS.symbol}
          style={{ display: 'grid', gridTemplateColumns: `40px repeat(${n}, ${cellSize}px)`, marginBottom: 2 }}
        >
          {/* 行头 */}
          <div
            style={{
              fontSize: 10,
              color: 'rgba(255,255,255,0.45)',
              display: 'flex',
              alignItems: 'center',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {rowS.name}
          </div>
          {/* 格子 */}
          {mockCorrelationSymbols.map((colS, j) => {
            const cell = mockCorrelationMatrix.find(
              (c) => c.rowSymbol === rowS.symbol && c.colSymbol === colS.symbol
            );
            const corr = cell?.correlation ?? 0;
            return (
              <Tooltip
                key={colS.symbol}
                title={`${rowS.name} vs ${colS.name}: ${corr.toFixed(2)}`}
              >
                <div
                  style={{
                    height: cellSize - 2,
                    borderRadius: 4,
                    background: corrToColor(corr),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'default',
                    border: i === j ? '1px solid rgba(100,180,255,0.3)' : '1px solid transparent',
                  }}
                >
                  <span
                    style={{
                      fontSize: 10,
                      fontFamily: "'JetBrains Mono', monospace",
                      color: corrToTextColor(corr),
                      fontWeight: i === j ? 700 : 400,
                    }}
                  >
                    {corr.toFixed(2)}
                  </span>
                </div>
              </Tooltip>
            );
          })}
        </div>
      ))}

      {/* 图例 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, justifyContent: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <div style={{ width: 10, height: 10, borderRadius: 2, background: 'rgba(255, 77, 106, 0.25)' }} />
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>负相关</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <div style={{ width: 10, height: 10, borderRadius: 2, background: 'rgba(255,255,255,0.06)' }} />
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>低相关</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <div style={{ width: 10, height: 10, borderRadius: 2, background: 'rgba(0, 200, 150, 0.25)' }} />
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>正相关</span>
        </div>
      </div>
    </div>
  );
}
