# 维护脚本模块

## 职责与边界

`scripts/` 保存构建辅助、内容处理与 Agent 质量检查工具；它们在本地命令行执行，不进入网站客户端。本文记录文档检查器、Stop hook 接口与草甸回归测试。

## 文档检查器

- [check-docs.mjs](../../../scripts/check-docs.mjs) 检查 AI 文件头、文档链接和模块文档漂移；规则来自 [check-docs.config.json](../../../check-docs.config.json)。
- 普通 CLI 输出可读报告，通过退出 `0`，失败退出 `1`；`--strict` 将漂移警告升级为失败。
- `--hook` 由 [.codex/hooks.json](../../../.codex/hooks.json) 和 [.claude/settings.json](../../../.claude/settings.json) 的 Stop 事件调用。

## Stop 输出协议

| 检查结果                   | stdout                              | stderr         | 退出码 |
| -------------------------- | ----------------------------------- | -------------- | ------ |
| 通过                       | 单个 JSON 对象 `{}`                 | 无报告         | `0`    |
| 仅非阻断警告               | JSON 对象，`systemMessage` 包含报告 | 无报告         | `0`    |
| 硬错误，或严格模式下的警告 | 空                                  | 报告与修复说明 | `2`    |

成功的 Stop stdout 不可包含标题、emoji 或其他普通日志。曾直接复用 CLI 报告导致每次收尾都出现 `hook returned invalid stop hook JSON output`。协议依据：[OpenAI Hooks 文档](https://developers.openai.com/zh-Hans/docs/hooks#stop)。检查规则与拦截条件不因输出格式调整而放宽。

## 回归验证

[check-docs.test.mjs](../../../scripts/check-docs.test.mjs) 使用临时文件和实际 Node 子进程验证输出、JSON 可解析性与退出码；通过 `pnpm test:hooks` 执行，已接入 `pnpm check`。更多流程见 [测试策略](../../testing.md) 和 [运行手册](../../run.md)。

[meadow.test.mjs](../../../scripts/meadow.test.mjs) 通过 `pnpm test:meadow` 验证迁入首页后的共享排布与已确认预览相同、90% 株数和固定种子稳定，并检查只有首页接入草甸、通用布局只提供 Footer 后插槽；执行 [ADR-0006](../../decisions/0006-home-meadow.md) 的页面边界。它也接入 `pnpm check`。
