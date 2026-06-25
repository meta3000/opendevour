/**
 * SchedulerPanel — 定时任务管理面板
 *
 * 功能：
 * - 任务列表表格：名称、描述、触发规则、启用/禁用开关、上次执行、执行状态、下次执行、操作
 * - 立即执行按钮
 * - 修改调度时间（Modal）
 * - 状态颜色编码：success=绿色 failed=红色 running=蓝色
 */

import React, { useState, useCallback } from 'react';
import {
  Table,
  Switch,
  Button,
  Tag,
  Modal,
  Form,
  Select,
  InputNumber,
  Space,
  Tooltip,
  message,
  Typography,
  Empty,
  Spin,
} from 'antd';
import {
  PlayCircleOutlined,
  EditOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  SyncOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getScheduledTasks,
  runTaskNow,
  enableTask,
  disableTask,
  updateTaskSchedule,
  type ScheduledTask,
  type UpdateSchedulePayload,
} from '../../api/scheduler.api';

const { Text } = Typography;

// --------------------------------------------------------------------------
// 工具函数
// --------------------------------------------------------------------------

function formatDatetime(iso: string | null): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return iso;
  }
}

function formatTrigger(task: ScheduledTask): string {
  if (task.trigger_type === 'cron') {
    const { hour = '*', minute = 0 } = task.trigger_args;
    return `每天 ${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
  }
  if (task.trigger_type === 'interval') {
    const { minutes, hours } = task.trigger_args;
    if (hours) return `每 ${hours} 小时`;
    if (minutes) return `每 ${minutes} 分钟`;
  }
  return JSON.stringify(task.trigger_args);
}

// --------------------------------------------------------------------------
// 状态标签
// --------------------------------------------------------------------------

const StatusTag: React.FC<{ status: ScheduledTask['last_status'] }> = ({ status }) => {
  if (!status) return <Text type="secondary">—</Text>;
  const config = {
    success: { color: 'success', icon: <CheckCircleOutlined />, label: '成功' },
    failed:  { color: 'error',   icon: <CloseCircleOutlined />, label: '失败' },
    running: { color: 'processing', icon: <SyncOutlined spin />, label: '运行中' },
  } as const;
  const c = config[status];
  if (!c) return <Tag>{status}</Tag>;
  return (
    <Tag color={c.color} icon={c.icon}>
      {c.label}
    </Tag>
  );
};

// --------------------------------------------------------------------------
// 修改调度 Modal
// --------------------------------------------------------------------------

interface EditScheduleModalProps {
  task: ScheduledTask | null;
  onClose: () => void;
  onSave: (payload: UpdateSchedulePayload) => Promise<void>;
  loading: boolean;
}

const EditScheduleModal: React.FC<EditScheduleModalProps> = ({
  task,
  onClose,
  onSave,
  loading,
}) => {
  const [form] = Form.useForm();
  const [triggerType, setTriggerType] = useState<'cron' | 'interval'>(
    task?.trigger_type ?? 'cron',
  );

  React.useEffect(() => {
    if (task) {
      setTriggerType(task.trigger_type);
      form.setFieldsValue({
        trigger_type: task.trigger_type,
        ...task.trigger_args,
      });
    }
  }, [task, form]);

  const handleOk = async () => {
    const values = await form.validateFields();
    const { trigger_type, ...rest } = values;
    await onSave({ trigger_type, trigger_args: rest });
  };

  return (
    <Modal
      title={`修改调度规则 — ${task?.name ?? ''}`}
      open={!!task}
      onCancel={onClose}
      onOk={handleOk}
      confirmLoading={loading}
      okText="保存"
      cancelText="取消"
      width={440}
    >
      <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
        <Form.Item name="trigger_type" label="触发类型" rules={[{ required: true }]}>
          <Select
            options={[
              { value: 'cron', label: 'Cron（指定时刻）' },
              { value: 'interval', label: 'Interval（间隔执行）' },
            ]}
            onChange={(v) => setTriggerType(v)}
          />
        </Form.Item>

        {triggerType === 'cron' && (
          <Space>
            <Form.Item
              name="hour"
              label="小时（0-23）"
              rules={[{ required: true }]}
            >
              <InputNumber min={0} max={23} style={{ width: 120 }} />
            </Form.Item>
            <Form.Item
              name="minute"
              label="分钟（0-59）"
              rules={[{ required: true }]}
            >
              <InputNumber min={0} max={59} style={{ width: 120 }} />
            </Form.Item>
          </Space>
        )}

        {triggerType === 'interval' && (
          <Space>
            <Form.Item name="hours" label="小时间隔">
              <InputNumber min={0} style={{ width: 120 }} placeholder="0" />
            </Form.Item>
            <Form.Item name="minutes" label="分钟间隔">
              <InputNumber min={0} style={{ width: 120 }} placeholder="0" />
            </Form.Item>
          </Space>
        )}
      </Form>
    </Modal>
  );
};

// --------------------------------------------------------------------------
// SchedulerPanel
// --------------------------------------------------------------------------

export const SchedulerPanel: React.FC = () => {
  const queryClient = useQueryClient();
  const [editTarget, setEditTarget] = useState<ScheduledTask | null>(null);
  const [messageApi, contextHolder] = message.useMessage();

  const { data: tasks = [], isLoading, refetch } = useQuery({
    queryKey: ['scheduler-tasks'],
    queryFn: getScheduledTasks,
    refetchInterval: 30_000, // 每 30s 自动刷新
  });

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['scheduler-tasks'] });
  }, [queryClient]);

  // 切换启用/禁用
  const toggleMutation = useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      if (enabled) await enableTask(id);
      else await disableTask(id);
    },
    onSuccess: (_, { enabled }) => {
      messageApi.success(enabled ? '任务已启用' : '任务已禁用');
      invalidate();
    },
    onError: (e: Error) => messageApi.error(e.message),
  });

  // 立即执行
  const runMutation = useMutation({
    mutationFn: (id: string) => runTaskNow(id),
    onSuccess: () => {
      messageApi.success('任务已触发执行');
      setTimeout(invalidate, 2000); // 2s 后刷新状态
    },
    onError: (e: Error) => messageApi.error(e.message),
  });

  // 更新调度
  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateSchedulePayload }) =>
      updateTaskSchedule(id, payload),
    onSuccess: () => {
      messageApi.success('调度规则已更新');
      setEditTarget(null);
      invalidate();
    },
    onError: (e: Error) => messageApi.error(e.message),
  });

  const columns: ColumnsType<ScheduledTask> = [
    {
      title: '任务名称',
      dataIndex: 'name',
      width: 160,
      render: (name, record) => (
        <Space direction="vertical" size={2}>
          <Text strong>{name}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {record.description}
          </Text>
        </Space>
      ),
    },
    {
      title: '触发规则',
      width: 140,
      render: (_, record) => (
        <Space>
          <ClockCircleOutlined style={{ color: '#6C63FF' }} />
          <Text>{formatTrigger(record)}</Text>
        </Space>
      ),
    },
    {
      title: '启用',
      dataIndex: 'enabled',
      width: 80,
      align: 'center',
      render: (enabled, record) => (
        <Switch
          checked={enabled}
          size="small"
          loading={toggleMutation.isPending}
          onChange={(checked) =>
            toggleMutation.mutate({ id: record.id, enabled: checked })
          }
        />
      ),
    },
    {
      title: '上次执行',
      dataIndex: 'last_run',
      width: 150,
      render: (v) => <Text style={{ fontSize: 12 }}>{formatDatetime(v)}</Text>,
    },
    {
      title: '执行状态',
      dataIndex: 'last_status',
      width: 100,
      align: 'center',
      render: (v) => <StatusTag status={v} />,
    },
    {
      title: '下次执行',
      dataIndex: 'next_run',
      width: 150,
      render: (v, record) =>
        record.enabled ? (
          <Text style={{ fontSize: 12 }}>{formatDatetime(v)}</Text>
        ) : (
          <Text type="secondary" style={{ fontSize: 12 }}>
            已暂停
          </Text>
        ),
    },
    {
      title: '操作',
      width: 120,
      align: 'center',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="立即执行">
            <Button
              type="text"
              icon={<PlayCircleOutlined />}
              size="small"
              loading={runMutation.isPending && runMutation.variables === record.id}
              onClick={() => runMutation.mutate(record.id)}
            />
          </Tooltip>
          <Tooltip title="修改调度">
            <Button
              type="text"
              icon={<EditOutlined />}
              size="small"
              onClick={() => setEditTarget(record)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <>
      {contextHolder}
      <div style={{ padding: '0 0 16px' }}>
        <Space style={{ marginBottom: 12 }}>
          <Button
            icon={<SyncOutlined />}
            size="small"
            onClick={() => refetch()}
            loading={isLoading}
          >
            刷新
          </Button>
          <Text type="secondary" style={{ fontSize: 12 }}>
            自动每 30 秒刷新一次
          </Text>
        </Space>

        <Spin spinning={isLoading}>
          {tasks.length === 0 && !isLoading ? (
            <Empty description="暂无定时任务" />
          ) : (
            <Table<ScheduledTask>
              dataSource={tasks}
              columns={columns}
              rowKey="id"
              pagination={false}
              size="middle"
              bordered={false}
            />
          )}
        </Spin>
      </div>

      <EditScheduleModal
        task={editTarget}
        onClose={() => setEditTarget(null)}
        onSave={(payload) =>
          updateMutation.mutateAsync({ id: editTarget!.id, payload })
        }
        loading={updateMutation.isPending}
      />
    </>
  );
};

export default SchedulerPanel;
