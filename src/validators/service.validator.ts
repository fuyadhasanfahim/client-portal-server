import { z } from "zod";

const ComplexitySchema = z.object({
    name: z.string(),
    price: z.number(),
});

const TypeSchema = z.object({
    name: z.string(),
    price: z.number().optional(),
    complexities: z.array(ComplexitySchema).optional(),
});

const ServiceSchema = z.object({
    name: z.string(),
    price: z.number().optional(),
    complexities: z.array(ComplexitySchema).optional(),
    types: z.array(TypeSchema).optional(),
    options: z.boolean().optional(),
    inputs: z.boolean().optional(),
    instruction: z.string().optional(),
    disabledOptions: z.array(z.string()).optional(),
});

export const AddServiceSchema = ServiceSchema;
