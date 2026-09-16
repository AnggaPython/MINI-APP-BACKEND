import { z } from "zod";

/**
 * Zod Schema for Place Order validation.
 * Accepts any flexible positive integer amount (e.g. 51, 52, 53, 100, 102, 1000, 1002, 1992873).
 * String numbers like "51" or "1002" are automatically coerced to integer numbers.
 */
export const PlaceOrderSchema = z
  .object({
    pair: z.string().optional().default("ELIXCOIN/ELIXIR"),
    side: z.enum(["BUY", "SELL"]),
    type: z.enum(["market", "limit"]).optional().default("market"),
    amount: z.preprocess(
      (val) => {
        const num = Number(val);
        return isFinite(num) ? Math.floor(num) : val;
      },
      z
        .number()
        .int("Order amount must be a whole integer")
        .positive("Order amount must be greater than 0"),
    ),
    price: z.preprocess(
      (val) => (val !== undefined && val !== null && val !== "" ? Number(val) : undefined),
      z.number().positive("Price must be greater than 0").optional(),
    ),
    tpPrice: z.preprocess(
      (val) => (val !== undefined && val !== null && val !== "" ? Number(val) : undefined),
      z.number().positive("TP Price must be greater than 0").optional(),
    ),
    slPrice: z.preprocess(
      (val) => (val !== undefined && val !== null && val !== "" ? Number(val) : undefined),
      z.number().positive("SL Price must be greater than 0").optional(),
    ),
    iceberg: z.boolean().optional(),
    icebergChunkSize: z.preprocess(
      (val) => (val !== undefined && val !== null && val !== "" ? Math.floor(Number(val)) : undefined),
      z.number().int().positive().optional(),
    ),
  })
  .refine(
    (data) => {
      if (data.type === "limit") {
        return data.price !== undefined && isFinite(data.price) && data.price > 0;
      }
      return true;
    },
    {
      message: "Valid limit price is required for limit orders",
      path: ["price"],
    },
  );

export type PlaceOrderDto = z.infer<typeof PlaceOrderSchema>;
