# Storefront V2（主力开发）

新版店铺前端，正在积极开发中。所有新的店铺功能都应在此实现。

## 技术栈

- Next.js 16 + React 19 + TypeScript
- Radix UI + shadcn/ui 组件体系（`components/ui/`）
- Tailwind CSS 4 + tw-animate-css
- Zustand 5（状态管理）
- React Hook Form + Zod（表单）
- Lucide Icons
- Sonner（toast 通知）
- Embla Carousel（轮播）

## 开发命令

```bash
npm run dev     # 启动开发服务器
npm run build
npm run lint
```

## 当前状态

数据层尚未接入 Medusa 后端 API，当前使用本地 mock 数据（`lib/data/`）。接入后端时：
- 后端地址：`http://localhost:9000`
- Store API 前缀：`/store/`
- 内容 API：`/store/content/{resource}`
- 多语言：请求时传 `x-medusa-locale` header 或 `?locale=` 参数

## 项目结构

```
app/                    # Next.js App Router 页面
  page.tsx              # 首页
  product/[id]/         # 商品详情
  category/[slug]/      # 分类页
  articles/             # 文章列表 & 详情
  cart/                 # 购物车
  checkout/             # 结账流程
components/
  home/                 # 首页区块组件
  layout/               # Header, Footer, LayoutShell
  product/              # 商品卡片、详情、分类页
  articles/             # 文章列表
  ui/                   # shadcn/ui 基础组件（勿手动修改）
hooks/                  # 自定义 hooks
lib/
  data/                 # Mock 数据（待替换为 API 调用）
  cart-store.ts         # Zustand 购物车状态
  utils.ts              # cn() 等工具函数
```

## 代码模式

### 状态管理

全局状态用 Zustand store（`lib/cart-store.ts` 为参考），派生数据用纯函数 selector：

```ts
export const useCart = create<CartState>((set, get) => ({ ... }))
export function selectTotalItems(state: CartState) { ... }
```

### UI 组件

`components/ui/` 下是 shadcn/ui 生成的组件，样式通过 `cn()` 工具函数合并（clsx + tailwind-merge）。新增 UI 组件优先用 `npx shadcn@latest add <component>`。

### 多语言（待实现）

v1 使用 `[locale]` 动态路由 + next-intl，v2 尚未集成。实现时参考 v1 的 `storefront/src/app/[locale]/` 结构。
