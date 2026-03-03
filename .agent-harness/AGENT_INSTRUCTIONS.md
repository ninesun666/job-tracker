# Agent Instructions
# 此文件定义 coding agent 的工作流程和行为规范

## 项目信息

- **项目名称**: job-tracker
- **开发语言**: unknown
- **框架**: unknown
- **构建工具**: unknown

## 会话开始流程

每个 coding agent 会话必须按以下顺序开始：

1. **定位环境**
   ```bash
   pwd  # 确认工作目录
   ```

2. **读取进度**
   - 阅读 `.agent-harness/claude-progress.txt`
   - 查看 `git log --oneline -10`
   - 了解最近的工作内容

3. **检查功能状态**
   - 阅读 `.agent-harness/feature_list.json`
   - 找到最高优先级的未完成功能

4. **验证环境**
   ```bash
   # 编译项目确保无错误
   请根据项目类型运行对应的构建命令
   ```

5. **开始工作**
   - 选择一个功能开始实现
   - 遵循增量开发原则

## 会话结束流程

每个 coding agent 会话必须按以下顺序结束：

1. **编译验证**
   ```bash
   请根据项目类型运行对应的构建命令
   ```

2. **测试验证**
   ```bash
   请根据项目类型运行对应的测试命令
   ```

3. **更新状态**
   - 更新 `feature_list.json` 中的功能状态
   - 只在确认通过后设置 `passes: true`

4. **提交代码**
   ```bash
   git add .
   git commit -m "feat: [功能描述]"
   ```

5. **记录进度**
   - 更新 `claude-progress.txt`
   - 记录完成的工作和遇到的问题

## 重要原则

### 增量开发
- 每次只处理一个功能
- 小步快跑，频繁提交

### 编译优先
- 每次修改后都要编译验证
- 确保没有编译错误后再提交

### 状态清晰
- 代码提交信息要清晰描述改动
- 让下一个 agent 能快速理解当前状态

## 禁止行为

1. 删除 feature_list.json 中的功能
2. 在未测试时将 passes 设为 true
3. 一次性实现多个功能
4. 提交无法编译的代码
