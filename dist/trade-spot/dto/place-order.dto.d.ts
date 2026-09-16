import { z } from "zod";
export declare const PlaceOrderSchema: z.ZodObject<{
    pair: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    side: z.ZodEnum<{
        BUY: "BUY";
        SELL: "SELL";
    }>;
    type: z.ZodDefault<z.ZodOptional<z.ZodEnum<{
        limit: "limit";
        market: "market";
    }>>>;
    amount: z.ZodPreprocess<z.ZodNumber, unknown>;
    price: z.ZodPreprocess<z.ZodOptional<z.ZodNumber>, unknown>;
    tpPrice: z.ZodPreprocess<z.ZodOptional<z.ZodNumber>, unknown>;
    slPrice: z.ZodPreprocess<z.ZodOptional<z.ZodNumber>, unknown>;
    iceberg: z.ZodOptional<z.ZodBoolean>;
    icebergChunkSize: z.ZodPreprocess<z.ZodOptional<z.ZodNumber>, unknown>;
}, z.core.$strip>;
export type PlaceOrderDto = z.infer<typeof PlaceOrderSchema>;
