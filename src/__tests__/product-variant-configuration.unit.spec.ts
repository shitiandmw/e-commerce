import { Modules } from "@medusajs/framework/utils"
import {
  PRODUCT_VARIANT_DELETE_ERROR_CODES,
  prepareProductVariantConfiguration,
  sendProductVariantConfigurationError,
  validateVariantConfigurationShape,
  type SyncProductVariantConfigurationInput,
} from "../lib/product-variant-configuration"
import { RESTOCK_DEMAND_MODULE } from "../modules/restock-demand"

function buildInput(): SyncProductVariantConfigurationInput {
  return {
    product_id: "product_1",
    options: [{
      key: "option_size",
      id: "option_size",
      title: "Size",
      values: [
        { key: "value_small", id: "value_small", value: "Small" },
        { key: "value_large", id: "value_large", value: "Large" },
      ],
    }],
    variants: [
      {
        key: "variant_delete",
        id: "variant_delete",
        title: "Small",
        sku: "SKU-S",
        prices: [{ amount: 1000, currency_code: "usd" }],
        manage_inventory: true,
        option_values: { option_size: "value_small" },
        status: "delete",
      },
      {
        key: "variant_keep",
        id: "variant_keep",
        title: "Large",
        sku: "SKU-L",
        prices: [{ amount: 1200, currency_code: "usd" }],
        manage_inventory: true,
        option_values: { option_size: "value_large" },
        status: "active",
      },
    ],
  }
}

function buildContainer(options: {
  inventory?: number
  orderItems?: unknown[]
  restockRounds?: unknown[]
} = {}) {
  const product = {
    id: "product_1",
    options: [{
      id: "option_size",
      title: "Size",
      values: [
        { id: "value_small", value: "Small" },
        { id: "value_large", value: "Large" },
      ],
    }],
    variants: [
      {
        id: "variant_delete",
        title: "Small",
        sku: "SKU-S",
        inventory_quantity: options.inventory ?? 0,
        inventory_items: [],
      },
      {
        id: "variant_keep",
        title: "Large",
        sku: "SKU-L",
        inventory_quantity: 0,
        inventory_items: [],
      },
    ],
  }
  return {
    resolve(key: string) {
      if (key === "query") {
        return { graph: async () => ({ data: [product] }) }
      }
      if (key === Modules.ORDER) {
        return { listOrderLineItems: async () => options.orderItems ?? [] }
      }
      if (key === RESTOCK_DEMAND_MODULE) {
        return { listRestockRounds: async () => options.restockRounds ?? [] }
      }
      throw new Error(`Unexpected dependency: ${key}`)
    },
  } as any
}

describe("product variant configuration", () => {
  it("rejects duplicate option combinations", () => {
    const input = buildInput()
    input.variants[0].status = "active"
    input.variants[1].option_values = { option_size: "value_small" }

    expect(() => validateVariantConfigurationShape(input)).toThrow(
      "选项组合重复"
    )
  })

  it("rejects permanent deletion when inventory exists", async () => {
    await expect(prepareProductVariantConfiguration(
      buildContainer({ inventory: 2 }),
      buildInput()
    )).rejects.toMatchObject({
      code: PRODUCT_VARIANT_DELETE_ERROR_CODES.HAS_INVENTORY,
      variant_id: "variant_delete",
      sku: "SKU-S",
    })
  })

  it("rejects permanent deletion after any order", async () => {
    await expect(prepareProductVariantConfiguration(
      buildContainer({ orderItems: [{ id: "item_1" }] }),
      buildInput()
    )).rejects.toMatchObject({ code: "PRODUCT_VARIANT_DELETE_HAS_ORDERS" })
  })

  it("rejects permanent deletion after historical restock demand", async () => {
    await expect(prepareProductVariantConfiguration(
      buildContainer({ restockRounds: [{ id: "round_1", status: "discontinued" }] }),
      buildInput()
    )).rejects.toMatchObject({
      code: "PRODUCT_VARIANT_DELETE_HAS_RESTOCK_DEMAND",
    })
  })

  it("serializes structured product variant errors", async () => {
    let error: unknown
    try {
      await prepareProductVariantConfiguration(
        buildContainer({ inventory: 2 }),
        buildInput()
      )
    } catch (caught) {
      error = caught
    }
    const response = {
      statusCode: 0,
      body: undefined as Record<string, unknown> | undefined,
      status(code: number) {
        this.statusCode = code
        return this
      },
      json(body: Record<string, unknown>) {
        this.body = body
        return this
      },
    }

    expect(sendProductVariantConfigurationError(response, error)).toBe(true)
    expect(response.statusCode).toBe(400)
    expect(response.body).toMatchObject({
      code: PRODUCT_VARIANT_DELETE_ERROR_CODES.HAS_INVENTORY,
      type: "invalid_data",
      variant_id: "variant_delete",
      sku: "SKU-S",
    })
  })
})
