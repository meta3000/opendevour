"""数据源注册表 — 工厂模式，支持动态注册和按名获取适配器实例。

使用方式::

    from devour_service.datasources.registry import DataSourceRegistry
    from devour_service.datasources.tushare_adapter import TushareAdapter

    # 注册（通常在模块导入时自动完成）
    DataSourceRegistry.register("tushare", TushareAdapter)

    # 获取实例
    adapter = DataSourceRegistry.get("tushare")

    # 获取默认数据源
    adapter = DataSourceRegistry.get_default()
"""

from __future__ import annotations

from devour_service.datasources.base import DataSourceAdapter


class DataSourceRegistry:
    """数据源注册表，支持动态注册和获取适配器实例。"""

    _adapters: dict[str, type[DataSourceAdapter]] = {}
    _instances: dict[str, DataSourceAdapter] = {}

    @classmethod
    def register(cls, name: str, adapter_class: type[DataSourceAdapter]) -> None:
        """注册数据源适配器类。

        Args:
            name: 数据源名称，如 'tushare'、'akshare'。
            adapter_class: 适配器类（必须是 DataSourceAdapter 的子类）。
        """
        cls._adapters[name] = adapter_class

    @classmethod
    def get(cls, name: str) -> DataSourceAdapter:
        """按名称获取数据源适配器实例（懒加载单例）。

        Args:
            name: 已注册的数据源名称。

        Returns:
            对应的适配器实例。

        Raises:
            ValueError: 名称未注册时抛出。
        """
        if name not in cls._instances:
            if name not in cls._adapters:
                raise ValueError(
                    f"Unknown datasource: '{name}'. "
                    f"Available: {list(cls._adapters.keys())}"
                )
            cls._instances[name] = cls._adapters[name]()
        return cls._instances[name]

    @classmethod
    def get_default(cls) -> DataSourceAdapter:
        """获取默认数据源适配器（从应用配置读取 DEFAULT_DATASOURCE）。

        Returns:
            默认数据源的适配器实例。
        """
        from devour_service.core.config import get_settings

        settings = get_settings()
        return cls.get(settings.default_datasource)

    @classmethod
    def list_available(cls) -> list[str]:
        """返回所有已注册的数据源名称。"""
        return list(cls._adapters.keys())

    @classmethod
    def reset(cls) -> None:
        """清空所有已注册的适配器类与实例（主要用于测试）。"""
        cls._adapters.clear()
        cls._instances.clear()
