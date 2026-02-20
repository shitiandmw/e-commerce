# Admin UI

独立 Next.js 14 管理后台，通过 REST API 与 Medusa 后端通信。

## 技术栈

- Next.js 14 + React 18 + TypeScript
- TanStack React Query（数据获取）+ TanStack React Table（表格）
- React Hook Form + Zod（表单验证）
- Tiptap（富文本编辑器）
- Tailwind CSS 3 + Lucide Icons
- next-intl（UI 国际化）

## 开发命令

```bash
npm run dev     # 启动开发服务器 (port 3002)
npm run build
npm run lint
```

## 代码模式

### API 调用

统一使用 `adminFetch`（`src/lib/admin-api.ts`），不要创建新的 fetch wrapper：

```ts
import { adminFetch } from "@/lib/admin-api"
const data = await adminFetch<ResponseType>("/admin/resource", { params, method, body })
```

### 数据 Hooks

每个资源一个 hook 文件 `src/hooks/use-{resource}.ts`，遵循统一模式：
- `use{Resource}s(params)` — 列表查询（useQuery）
- `use{Resource}(id)` — 单条查询（useQuery）
- `useCreate{Resource}()` — 创建（useMutation + invalidateQueries）
- `useUpdate{Resource}(id)` — 更新（useMutation + invalidateQueries）
- `useDelete{Resource}()` — 删除（useMutation + invalidateQueries）

queryKey 约定：列表用 `["{resource}s", params]`，单条用 `["{resource}", id]`。

### 页面结构

每个资源在 `src/app/(dashboard)/{resource}/` 下有：
- `page.tsx` — 列表页
- `[id]/page.tsx` — 详情页
- `[id]/edit/page.tsx` — 编辑页
- `new/page.tsx` — 新建页

### 组件

- 资源组件：`src/components/{resource}/`（form, table, detail 等）
- UI 基础组件：`src/components/ui/`（button, dialog, rich-text-editor, seo-editor 等）
- 富文本编辑用 Tiptap（`rich-text-editor.tsx`），SEO 字段用 `seo-editor.tsx`

### 认证

JWT token 存储在 localStorage（`medusa_admin_token`），401 时自动清除并跳转登录页。
