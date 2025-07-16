export abstract class BaseModel {
    coanstructor() {}

    public abstract generateImage(prompt: string, tensorPath: string): Promise<{ request_id: string; response_url: string }>;

    public abstract trainModel(zipUrl: string  , tiggerWord : string) : Promise<{ request_id: string; response_url: string }>;
}

/// Straetgy Design for the BaseModel class: