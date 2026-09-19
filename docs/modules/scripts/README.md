# 维护脚本模块

## 职责与边界

`scripts/` 保存构建辅助、内容处理与 Agent 质量检查工具；它们在本地命令行执行，不进入网站客户端。本文记录文档检查器与 Stop hook 的接口。

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
