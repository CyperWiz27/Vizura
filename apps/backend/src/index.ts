import express from 'express';
import cors from 'cors';
import {TrainModelSchema, GenerateImageSchema, GenerateFromPackSchema} from '@repo/common/types';
import {prisma} from '@repo/db';
import dotenv from 'dotenv';
import { FalAIModel } from './models/FalAIModel';
import { fal } from '@fal-ai/client';
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";   
dotenv.config();



const PORT = process.env.PORT;
const app = express();
app.use(cors());

app.use(express.json());

// const FAL_KEY = process.env.FAL_KEY ; // Replace with your actual FAL key

const USER_ID = "user-id-123"; // TODO : Replace with actual user ID logic
const BUCKET_NAME = process.env.BUCKET_NAME!;

const falaiclient = new FalAIModel();

// Initialize S3 client for R2
const r2 = new S3Client({
  region: "auto", // Cloudflare R2 uses "auto"
  endpoint: process.env.ENDPOINT_URL, // Your R2 endpoint
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});


// TODO : presigned url endpoint for training images from r2 object storage
app.get('/presigned-url', async (req, res) => {
    try {
    const fileName = `training-data-${Date.now()}_${Math.random()}.zip`; // Generate a unique file name

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileName
    });

    const url = await getSignedUrl(r2, command, { expiresIn: 60*5 }); // expires in 5 minutes

    res.json({
      url,
      key: fileName,
    });
  } catch (err) {
    console.error("Error generating pre-signed URL:", err);
    res.status(500).json({ error: "Failed to generate pre-signed URL" });
  }

});


app.post('/ai/training',async (req, res) => {

    const parsedData = TrainModelSchema.safeParse(req.body);

    if(!parsedData.success) {
        return res.status(400).json({
            error: parsedData.error.errors.map(err => err.message).join(', ')
        });
    }

    const {request_id, response_url} = await falaiclient.trainModel(parsedData.data.zipUrl, parsedData.data.modelName)

    const data = await prisma.model.create({
        data: {
            name: parsedData.data.modelName,
            type: parsedData.data.modelType,
            age: parsedData.data.age,
            ethnicity: parsedData.data.ethnicity,
            eyeColor : parsedData.data.eyecolor,
            bald: parsedData.data.bald || false,
            userId: USER_ID,
            falaiRequestId: request_id,
            zipUrl: parsedData.data.zipUrl,

        }
    }); 

    res.json({
        modelId: data.id
     });



});


app.post('/ai/generate', async (req, res) => {
    const parsedData = GenerateImageSchema.safeParse(req.body);

    if (!parsedData.success) {
        return res.status(400).json({
            error: parsedData.error.errors.map(err => err.message).join(', ')
        });
    }

    const model = await prisma.model.findUnique({
        where: {
            id: parsedData.data.modelId,
        }
    });

    if(!model || !model.tensorPath){
        res.status(411).json({
            error: "Model not found or tensor path is missing"  
        });
        return;
    }

    const {request_id, response_url} = await falaiclient.generateImage(parsedData.data.prompt, model.tensorPath);

    const data = await prisma.outputImage.create({
        data: {
            modelId: parsedData.data.modelId,
            prompt: parsedData.data.prompt,
            userId: USER_ID,
            imageurl : "",
            falaiRequestId : request_id
        }
    });

    res.json({
        imageId: data.id
    });



});


app.post('/pack/generate', async (req, res) => {

    const parsedData = GenerateFromPackSchema.safeParse(req.body);

    if (!parsedData.success) {
        return res.status(400).json({
            error: parsedData.error.errors.map(err => err.message).join(', ')
        });
    }

    const prompts = await prisma.packPrompts.findMany({
        where: {    
            packId: parsedData.data.packId
        }
    });

    let requestIds : { request_id : string}[] = await Promise.all(prompts.map((prompt) => falaiclient.generateImage(prompt.prompt, parsedData.data.modelId)));

    const images = await prisma.outputImage.createManyAndReturn({
        data: prompts.map((prompt,index) => ({
            modelId: parsedData.data.modelId,
            prompt: prompt.prompt,
            userId: USER_ID,
            imageurl: "",
            falaiRequestId: requestIds[index]?.request_id,

        })),
        skipDuplicates: true
    });

    res.json({
        imageIds: images.map(image => image.id)
    });


});

app.get('/pack/bulk', async (req, res) => {

   const packs = await prisma.packs.findMany();
   const packIds = await prisma.packPrompts.findMany();

   res.json({
         packs: packs.map(pack => ({
              id: pack.id,
              name: pack.name,
              prompts: packIds.filter(prompt => prompt.packId === pack.id).map(prompt => prompt.prompt)
         }))  

   })
}
);   


app.get('/image/bulk', async(req, res) => {
     const ids = req.query.images as string[];
     const limit= req.query.limit as string ?? "10";
     const offset = req.query.offset as string ?? "0";

     const imagesData = await prisma.outputImage.findMany({
         where: {
            id:{ in: ids},
            userId: USER_ID
         },
         skip: parseInt(offset),
         take: parseInt(limit)

         });

         res.json({
            images : imagesData
         });

});

app.post(".fal-ai/webhook/train", async (req, res) => {
    console.log("Webhook received:", req.body);
    //upadate the status of the image in the database
    const requestId = req.body.request_id;

    await prisma.model.updateMany({ 
        where: { 
            falaiRequestId: requestId 
        },
        data: {
            status: "Generated",
            tensorPath: req.body.tensor_path // Assuming the response URL contains the tensor path
        }
    });

    res.json({
        message: "Webhook received successfully"
    })
});

app.post(".fal-ai/webhook/generateImage", async (req, res) => {
    console.log("Webhook received:", req.body);
    //upadate the status of the image in the database

    const requestId = req.body.request_id;

    await prisma.outputImage.updateMany({
        where: {
            falaiRequestId: requestId
         },
        data: {
            status: "Generated",
            imageurl: req.body.image_url // Assuming the response URL contains the image URL
        }
    });
    
    res.json({
        message: "Webhook received successfully"
    })
});


app.listen(PORT, () => {
  console.log(`Backend server is running on ${PORT}`);
});