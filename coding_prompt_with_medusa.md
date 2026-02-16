## YOUR ROLE - CODING AGENT

You are continuing work on a long-running autonomous development task.
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

# 7. Count remaining tests
cat feature_list.json | grep '"passes": false' | wc -l
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

### STEP 3: VERIFICATION TEST (CRITICAL!)

**MANDATORY BEFORE NEW WORK:**

The previous session may have introduced bugs. Before implementing anything
new, you MUST run verification tests.

Run 1-2 of the feature tests marked as `"passes": true` that are most core to the app's functionality to verify they still work.
For example, if this were a chat app, you should perform a test that logs into the app, sends a message, and gets a response.

**If you find ANY issues (functional or visual):**
- Mark that feature as "passes": false immediately
- Add issues to a list
- Fix all issues BEFORE moving to new features
- This includes UI bugs like:
  * White-on-white text or poor contrast
  * Random characters displayed
  * Incorrect timestamps
  * Layout issues or overflow
  * Buttons too close together
  * Missing hover states
  * Console errors

### STEP 4: CHOOSE ONE FEATURE TO IMPLEMENT

Look at feature_list.json and find the highest-priority feature with "passes": false.

Focus on completing one feature perfectly and completing its testing steps in this session before moving on to other features.
It's ok if you only complete one feature in this session, as there will be more sessions later that continue to make progress.

### STEP 5: IMPLEMENT THE FEATURE

Implement the chosen feature thoroughly:
1. Write the code (frontend and/or backend as needed)
2. Test manually using browser automation (see Step 6)
3. Fix any issues discovered
4. Verify the feature works end-to-end

### STEP 6: VERIFY WITH BROWSER AUTOMATION

**CRITICAL:** You MUST verify features through the actual UI.

Use `agent-browser` (CLI browser automation tool) to test:

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

### STEP 7: UPDATE feature_list.json (CAREFULLY!)

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

### STEP 8: COMMIT YOUR PROGRESS

Make a descriptive git commit:
```bash
git add .
git commit -m "Implement [feature name] - verified end-to-end

- Added [specific changes]
- Tested with browser automation
- Updated feature_list.json: marked test #X as passing
- Screenshots in verification/ directory
"
```

### STEP 9: UPDATE PROGRESS NOTES

Update `claude-progress.txt` with:
- What you accomplished this session
- Which test(s) you completed
- Any issues discovered or fixed
- What should be worked on next
- Current completion status (e.g., "45/200 tests passing")

### STEP 10: END SESSION CLEANLY

Before context fills up:
1. Commit all working code
2. Update claude-progress.txt
3. Update feature_list.json if tests verified
4. Ensure no uncommitted changes
5. Leave app in working state (no broken features)

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

This will load the skill's knowledge and guidelines for your current task.

### When to Use Medusa Skills

- When implementing Medusa custom modules or API routes
- When creating admin dashboard widgets or custom pages
- When building storefront features or integrating with Medusa APIs
- When generating or running database migrations
- When setting up admin users

---

## IMPORTANT REMINDERS

**Your Goal:** Production-quality application with all 200+ tests passing

**This Session's Goal:** Complete at least one feature perfectly

**Priority:** Fix broken tests before implementing new features

**Quality Bar:**
- Zero console errors
- Polished UI matching the design specified in app_spec.txt
- All features work end-to-end through the UI
- Fast, responsive, professional

**You have unlimited time.** Take as long as needed to get it right. The most important thing is that you
leave the code base in a clean state before terminating the session (Step 10).

---

Begin by running Step 1 (Get Your Bearings).
