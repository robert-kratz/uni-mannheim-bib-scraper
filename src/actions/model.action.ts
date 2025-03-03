'use server'
import * as tf from '@tensorflow/tfjs';

// Function to load the model
async function loadModel(): Promise<tf.LayersModel> {
    const modelUrl = '/trend_prediction_model/tfjs_model/model.json';
    return await tf.loadLayersModel(modelUrl);
}

// Function to make predictions
export async function predict(inputData: number[]): Promise<number> {
    const model = await loadModel();

    // Convert input data into a tensor
    const inputTensor = tf.tensor2d([inputData]);

    // Perform prediction
    const outputTensor = model.predict(inputTensor) as tf.Tensor;

    // Extract data from tensor
    const predictions = await outputTensor.data();

    // Return the first prediction as a single number
    return predictions[0];
}