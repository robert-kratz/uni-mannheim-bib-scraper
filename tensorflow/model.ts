'use server';
import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-layers';
import path from 'path';
import fs from 'fs/promises';

import prisma from '@/utils/db';

// Function to load the model
const filePath = path.join(process.cwd(), 'trend_prediction_model', 'tfjs_model', 'model.json');
let model: tf.LayersModel; // Keep track of the model instance

export async function getLibraryEncodings(): Promise<{ [key: string]: number[] }> {
    const libraries = await prisma.bibData.findMany({
        select: {},
        where: {
            day: 1,
            month: 1,
            year: 2021,
        },
    });

    throw new Error('Not implemented');
}

//check if a prediction is there for a given Date
export async function isPredictionThereForDate(date: Date): Promise<boolean> {
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();

    const bibs = await prisma.bibPredictionData.findMany({
        select: {
            id: true,
        },
        where: {
            day: day,
            month: month,
            year: year,
        },
    });

    if (bibs.length != 144) {
        //TODO: make prediction for day
    }

    throw new Error('Not implemented');
}

export async function setPredictionForDate(date: Date, prediction: number[]): Promise<void> {
    //check if the prediction is already there before setting it
    /**await prisma.bibPredictionData.create({
        data: {
            day: date.getDate(),
            month: date.getMonth() + 1,
            year: date.getFullYear(),
            chunk: 0,
            name,
        },
    });**/
}

export async function loadModel(): Promise<tf.LayersModel> {
    // Dispose of the old model before loading a new one
    if (model) {
        model.dispose();
        console.log('Previous model disposed.');
    }
    const data = await fs.readFile(filePath, 'utf-8');
    const modelJson = JSON.parse(data);
    console.log('Model JSON:', modelJson);
    model = await tf.loadLayersModel(tf.io.fromMemory(modelJson));
    return model;
}

// Example function to make predictions
export async function predict(
    model: tf.LayersModel,
    inputSequence: number[],
    inputLibrary: number[]
): Promise<Uint8Array<ArrayBufferLike> | Float32Array<ArrayBufferLike> | Int32Array<ArrayBufferLike>> {
    if (!model) {
        console.error('Model is not loaded yet.');
        throw new Error('Model is not loaded yet.');
    }

    // Convert input sequence (time-series) to tensor
    const sequenceTensor = tf.tensor2d(inputSequence, [inputSequence.length, 1]);

    // Convert library input to tensor
    const libraryTensor = tf.tensor2d(inputLibrary, [inputLibrary.length, 1]);

    // Ensure both tensors are passed as an array
    const outputTensor = model.predict([sequenceTensor, libraryTensor]) as tf.Tensor;

    // Extract data from tensor
    const predictions = await outputTensor.data();

    console.log('Predictions:', predictions);
    return predictions;
}
