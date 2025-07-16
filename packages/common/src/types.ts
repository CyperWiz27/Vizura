import z from "zod";

export const TrainModelSchema = z.object({
    modelName : z.string().min(1, "Model name is required"),
    modelType:  z.enum(["Man", "Woman", "Other"]),
    age : z.number(),
    ethnicity: z.enum(["White",
        "Black",
        "Asian_American",
        "East_Asian",
        "South_East_Asian",
        "South_Asian",
        "Hispanic",
        "Middle_Eastern",
        "Pacific"
    ]),
    eyecolor: z.enum(["Brown", "Blue", "Green", "Hazel", "Gray", "Other"]),
    bald : z.boolean().optional(),
    zipUrl: z.string().url("Invalid URL for training data").min(1, "Training data URL is required"),
}); 

export const GenerateImageSchema = z.object({
    prompt: z.string().min(1, "Prompt is required"),    
    modelId: z.string().min(1, "Model name is required"),
    numberOfImages: z.number().min(1, "At least one image is required").max(10, "Maximum 10 images can be generated"),
});

export const GenerateFromPackSchema = z.object({
    packId: z.string().min(1, "Pack ID is required"),   
    modelId : z.string().min(1, "Model ID is required"),}
);





