'use server'
import * as tf from '@tensorflow/tfjs';
import "@tensorflow/tfjs-layers";
import path from 'path';
import fs from "fs/promises";

// Function to load the model
const filePath = path.join(process.cwd(), "trend_prediction_model", "tfjs_model", "model.json");
let model: tf.LayersModel; // Keep track of the model instance

export async function loadModel(): Promise<tf.LayersModel> {
    // Dispose of the old model before loading a new one
    if (model) {
      model.dispose();
      console.log("Previous model disposed.");
    }
    const data = await fs.readFile(filePath, "utf-8");
    const modelJson = JSON.parse(data);
    console.log("Model JSON:", modelJson);
    model = await tf.loadLayersModel(tf.io.fromMemory(modelJson));
    return model;
}

// Example function to make predictions
export async function predict(model: tf.LayersModel, inputSequence: number[], inputLibrary: number[]) {
    if (!model) {
        console.error("Model is not loaded yet.");
        return;
    }

    // Convert input sequence (time-series) to tensor
    const sequenceTensor = tf.tensor2d(inputSequence, [inputSequence.length, 1]);

    // Convert library input to tensor
    const libraryTensor = tf.tensor2d(inputLibrary, [inputLibrary.length, 1]);

    // Ensure both tensors are passed as an array
    const outputTensor = model.predict([sequenceTensor, libraryTensor]) as tf.Tensor;

    // Extract data from tensor
    const predictions = await outputTensor.data();

    console.log("Predictions:", predictions);
    return predictions;
}
