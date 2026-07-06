import {
  PostAdminCreateMenuItem,
  PostAdminReorderMenuItems,
} from "../api/admin/menu-items/validators"

describe("admin menu item validators", () => {
  it("accepts null parent_id when creating a top-level menu item", () => {
    const result = PostAdminCreateMenuItem.safeParse({
      label: "Hong Kong Pick-up Station",
      url: "/category/Hong%20Kong%20Pick-up%20Station",
      is_enabled: true,
      parent_id: null,
    })

    expect(result.success).toBe(true)
  })

  it("accepts null parent_id when saving top-level item order", () => {
    const result = PostAdminReorderMenuItems.safeParse({
      items: [
        {
          id: "item_1",
          sort_order: 0,
          parent_id: null,
        },
      ],
    })

    expect(result.success).toBe(true)
  })

  it("still rejects non-string parent_id values", () => {
    const createResult = PostAdminCreateMenuItem.safeParse({
      label: "Hong Kong Pick-up Station",
      parent_id: 123,
    })
    const reorderResult = PostAdminReorderMenuItems.safeParse({
      items: [
        {
          id: "item_1",
          sort_order: 0,
          parent_id: 123,
        },
      ],
    })

    expect(createResult.success).toBe(false)
    expect(reorderResult.success).toBe(false)
  })
})
