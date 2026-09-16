"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlaceOrderSchema = void 0;
const zod_1 = require("zod");
exports.PlaceOrderSchema = zod_1.z
    .object({
    pair: zod_1.z.string().optional().default("ELIXCOIN/ELIXIR"),
    side: zod_1.z.enum(["BUY", "SELL"]),
    type: zod_1.z.enum(["market", "limit"]).optional().default("market"),
    amount: zod_1.z.preprocess((val) => {
        const num = Number(val);
        return isFinite(num) ? Math.floor(num) : val;
    }, zod_1.z
        .number()
        .int("Order amount must be a whole integer")
        .positive("Order amount must be greater than 0")),
    price: zod_1.z.preprocess((val) => (val !== undefined && val !== null && val !== "" ? Number(val) : undefined), zod_1.z.number().positive("Price must be greater than 0").optional()),
    tpPrice: zod_1.z.preprocess((val) => (val !== undefined && val !== null && val !== "" ? Number(val) : undefined), zod_1.z.number().positive("TP Price must be greater than 0").optional()),
    slPrice: zod_1.z.preprocess((val) => (val !== undefined && val !== null && val !== "" ? Number(val) : undefined), zod_1.z.number().positive("SL Price must be greater than 0").optional()),
    iceberg: zod_1.z.boolean().optional(),
    icebergChunkSize: zod_1.z.preprocess((val) => (val !== undefined && val !== null && val !== "" ? Math.floor(Number(val)) : undefined), zod_1.z.number().int().positive().optional()),
})
    .refine((data) => {
    if (data.type === "limit") {
        return data.price !== undefined && isFinite(data.price) && data.price > 0;
    }
    return true;
}, {
    message: "Valid limit price is required for limit orders",
    path: ["price"],
});
//# sourceMappingURL=place-order.dto.js.map