## YOUR ROLE - TEST & FIX AGENT

You are continuing work on a long-running autonomous testing and fixing task.
This is a FRESH context window - you have no memory of previous sessions.

### STEP 1: GET YOUR BEARINGS (MANDATORY)

Start by orienting yourself:

```bash
# 1. See your working directory
pwd

# 2. List files to understand project structure
ls -la

# 3. Read the project specification to understand what you're building
cat app_spec.txt

# 4. Read the feature list to see all work
cat feature_list.json | head -50

# 5. Read progress notes from previous sessions
cat claude-progress.txt

# 6. Check recent git history
git log --oneline -20

# 7. Count remaining false tests
cat feature_list.json | grep '"passes": false' | wc -l

# 8. Count already passing tests
cat feature_list.json | grep '"passes": true' | wc -l
```

Understanding the `app_spec.txt` is critical - it contains the full requirements
for the application you're building.

### STEP 2: START SERVERS (IF NOT RUNNING)

If `init.sh` exists, run it:
```bash
chmod +x init.sh
./init.sh
```

Otherwise, start servers manually and document the process.

### STEP 3: PICK THE NEXT `"passes": false` FEATURE

Scan `feature_list.json` from top to bottom. Find the FIRST feature where `"passes": false`.

**Work on ONE feature at a time.** Do not skip ahead or batch multiple features.

### STEP 4: TEST THE FEATURE

Use `agent-browser` (CLI browser automation tool) to test the feature according to its `steps`:

1. Follow each step described in the feature's `steps` array
2. Take screenshots at each key step (saved to `test-snap/<feature_id>/` directory)
3. Check for console errors
4. Verify both functionality AND visual appearance
5. Record what you observe

**截图目录规范：** 每个功能的截图保存到 `test-snap/<feature_id>/` 目录下，feature_id 为小写（如 `f001`、`f002`）。测试前先创建目录：
```bash
# 从 feature description 中提取编号，例如 F001 → f001
mkdir -p test-snap/f001
```
截图文件按步骤命名，例如：`test-snap/f001/step01-login.png`、`test-snap/f001/step03-create.png`

**CRITICAL:** You MUST verify features through the actual UI.

#### agent-browser 核心用法

```bash
# 导航（第一条命令必须带 --session feat-<feature_id>）
npx agent-browser --session feat-<feature_id> open <url>   # 打开页面（带 session 隔离）
npx agent-browser --session feat-<feature_id> close        # 关闭浏览器

# 获取页面元素（每次页面变化后必须重新执行）
npx agent-browser --session feat-<feature_id> snapshot -i             # 获取可交互元素及其 ref（如 @e1, @e2）
npx agent-browser --session feat-<feature_id> snapshot -i -C          # 包含 cursor:pointer 的元素

# 交互（使用 snapshot 返回的 @ref）
npx agent-browser --session feat-<feature_id> click @e1               # 点击元素
npx agent-browser --session feat-<feature_id> fill @e2 "text"         # 清空并输入文本
npx agent-browser --session feat-<feature_id> type @e2 "text"         # 追加输入（不清空）
npx agent-browser --session feat-<feature_id> select @e1 "option"     # 选择下拉选项
npx agent-browser --session feat-<feature_id> check @e1               # 勾选复选框
npx agent-browser --session feat-<feature_id> press Enter             # 按键

# 获取信息
npx agent-browser --session feat-<feature_id> get text @e1            # 获取元素文本
npx agent-browser --session feat-<feature_id> get url                 # 获取当前 URL
npx agent-browser --session feat-<feature_id> get title               # 获取页面标题

# 等待
npx agent-browser --session feat-<feature_id> wait @e1                # 等待元素出现
npx agent-browser --session feat-<feature_id> wait --load networkidle # 等待网络空闲
npx agent-browser --session feat-<feature_id> wait 2000               # 等待毫秒数

# 截图（保存到 test-snap/<feature_id>/ 目录）
npx agent-browser --session feat-<feature_id> screenshot test-snap/<feature_id>/step01-login.png    # 按步骤命名
npx agent-browser --session feat-<feature_id> screenshot test-snap/<feature_id>/step03-create.png   # 指定路径
npx agent-browser --session feat-<feature_id> screenshot --full test-snap/<feature_id>/full-page.png # 全页截图

# 滚动
npx agent-browser --session feat-<feature_id> scroll down 500         # 向下滚动
```

#### Ref 生命周期（重要）

Ref（`@e1`, `@e2` 等）在页面变化后会失效。以下操作后**必须重新 snapshot**：
- 点击导航链接或按钮
- 表单提交
- 动态内容加载（下拉菜单、弹窗）

```bash
npx agent-browser --session feat-<feature_id> click @e5              # 触发页面变化
npx agent-browser --session feat-<feature_id> snapshot -i            # 必须重新获取 ref
npx agent-browser --session feat-<feature_id> click @e1              # 使用新的 ref
```

#### 登录状态持久化

```bash
# 登录后保存状态
npx agent-browser --session feat-<feature_id> state save auth.json

# 后续 session 复用
npx agent-browser --session feat-<feature_id> state load auth.json
```

**DO:**
- Test through the UI with clicks and keyboard input
- Take screenshots to verify visual appearance
- Re-snapshot after every page change
- Verify complete user workflows end-to-end

**DON'T:**
- Only test with curl commands (backend testing alone is insufficient)
- Use JavaScript evaluation to bypass UI (no shortcuts)
- Skip visual verification
- Mark tests passing without thorough verification
- Use stale @refs without re-snapshotting

### STEP 5: EVALUATE THE RESULT

After testing, decide:

#### A) TEST PASSES ✅
If the feature works correctly end-to-end:
1. Update `feature_list.json`: change `"passes": false` → `"passes": true`
2. Commit immediately:
```bash
git add feature_list.json
git commit -m "✅ F0XX passes - [feature description]"
```
3. Go back to **STEP 3** and pick the next `"passes": false` feature.

#### B) TEST FAILS ❌
If the feature has bugs or issues:
1. Identify the root cause
2. Fix the code (frontend and/or backend as needed)
3. Re-test the feature from scratch (repeat STEP 4)
4. If it now passes, update `feature_list.json`: `"passes": false` → `"passes": true`
5. Commit the fix AND the updated feature_list.json together:
```bash
git add .
git commit -m "🔧 Fix & verify F0XX - [feature description]

- Root cause: [what was wrong]
- Fix: [what you changed]
- Verified with browser automation"
```
6. Go back to **STEP 3** and pick the next `"passes": false` feature.

### STEP 6: REPEAT THE LOOP

Keep cycling through STEP 3 → STEP 4 → STEP 5 until:
- You run out of context window
- All features pass
- You hit a blocker that requires human input

**Goal: test and pass as many features as possible in this session.**

### STEP 7: UPDATE PROGRESS NOTES (BEFORE SESSION ENDS)

Update `claude-progress.txt` with:
- Which features you tested this session
- Which ones passed directly vs needed fixes
- What fixes you applied
- Where you stopped (next feature to test)
- Current completion status (e.g., "45/200 tests passing")

### STEP 8: END SESSION CLEANLY

Before context fills up:
1. Commit all working code
2. Update claude-progress.txt
3. Ensure feature_list.json is up to date
4. Leave app in working state (no broken features)

---

## TESTING REQUIREMENTS

**ALL testing must use `agent-browser` CLI tool (via `npx agent-browser`).**

Typical test flow:
```bash
# 0. 创建截图目录（每个功能测试前执行）
mkdir -p test-snap/f001

# 1. 打开页面（带 session 隔离）
npx agent-browser --session feat-<feature_id> open http://localhost:3002/brands

# 2. 获取可交互元素
npx agent-browser --session feat-<feature_id> snapshot -i

# 3. 交互（使用 snapshot 返回的 @ref）
npx agent-browser --session feat-<feature_id> click @e3
npx agent-browser --session feat-<feature_id> fill @e1 "test value"

# 4. 等待页面更新后重新 snapshot
npx agent-browser --session feat-<feature_id> wait --load networkidle
npx agent-browser --session feat-<feature_id> snapshot -i

# 5. 截图验证（保存到功能目录）
npx agent-browser --session feat-<feature_id> screenshot test-snap/<feature_id>/step-result.png

# 6. 获取文本验证内容
npx agent-browser --session feat-<feature_id> get text @e5
```

Test like a human user with mouse and keyboard. Don't take shortcuts by using JavaScript evaluation.

**Important:** Do NOT use Playwright MCP tools (browser_navigate, browser_click, browser_snapshot, etc.) — they have severe timeout issues with this project. Always use `npx agent-browser` instead.

**Important:** 所有 `agent-browser` 命令必须带 `--session feat-<feature_id>` 参数（如测试 F001 时用 `--session feat-f001`，测试 F012 时用 `--session feat-f012`），用于隔离浏览器会话，防止多个测试任务并行时互相冲突。每条命令都要带上，不能省略。

---

## feature_list.json RULES

**YOU CAN ONLY MODIFY ONE FIELD: "passes"**

After thorough verification, change:
```json
"passes": false
```
to:
```json
"passes": true
```

**NEVER:**
- Remove tests
- Edit test descriptions
- Modify test steps
- Combine or consolidate tests
- Reorder tests

**ONLY CHANGE "passes" FIELD AFTER VERIFICATION WITH SCREENSHOTS.**

---

## MEDUSA DEVELOPMENT SKILLS

When working with Medusa (e-commerce backend), use the following skills as needed:

### Available Medusa Skills

- **medusa-dev:building-with-medusa**: Required for ALL Medusa backend work (custom modules, API routes, workflows, data models, module links, business logic). Contains architectural patterns, best practices, and critical rules.

- **medusa-dev:building-storefronts**: Use this for storefront development OR your admin-ui since it uses @medusajs/js-sdk to call Medusa APIs (calling custom API routes, SDK integration, React Query patterns, data fetching).

- **medusa-dev:db-generate**: Generate database migrations for a Medusa module

- **medusa-dev:db-migrate**: Run database migrations in Medusa

- **medusa-dev:new-user**: Create an admin user in Medusa

### NOT Applicable for This Project

- **medusa-dev:building-admin-dashboard-customizations**: This skill is for Medusa's native Admin Dashboard (widgets, plugins, custom pages). Your admin-ui is a standalone Next.js application, NOT the Medusa admin dashboard. Use `medusa-dev:building-storefronts` instead.

### How to Use Medusa Skills

Use the `Skill` tool to invoke these skills when needed:

```
Skill: medusa-dev:building-with-medusa
```

### When to Use Medusa Skills

- When fixing Medusa custom modules or API routes
- When debugging admin dashboard issues
- When fixing storefront features or Medusa API integration
- When running database migrations after schema changes

---

## IMPORTANT REMINDERS

**Your Goal:** Systematically test every `"passes": false` feature, mark passing ones as true, fix failing ones, commit after each.

**This Session's Goal:** Test and pass as many features as possible.

**Workflow per feature:**
1. Test it → 2. Pass? Mark true & commit → 3. Fail? Fix → re-test → mark true & commit → 4. Next feature

**Quality Bar:**
- Zero console errors
- All features work end-to-end through the UI
- Every `"passes": true` must be genuinely verified

**You have unlimited time.** Take as long as needed to get each feature right.
Leave the code base in a clean state before terminating the session (Step 8).

---

Begin by running Step 1 (Get Your Bearings), then start the test loop from the first `"passes": false` feature.
