// services/exerciseService.ts
import { Exercise } from '../types';
import { mockExercises } from '../data/mockData';

let exercises: Exercise[] = [...mockExercises];

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export const getExercises = async (): Promise<Exercise[]> => {
    await delay(500);
    return [...exercises].sort((a, b) => a.name.localeCompare(b.name));
};

export const addExercise = async (exerciseData: Omit<Exercise, 'id'>): Promise<Exercise> => {
    await delay(400);
    const newExercise: Exercise = {
        id: `ex_${Date.now()}`,
        ...exerciseData,
    };
    exercises.unshift(newExercise);
    return newExercise;
};

export const updateExercise = async (updatedExercise: Exercise): Promise<Exercise> => {
    await delay(400);
    exercises = exercises.map(ex => ex.id === updatedExercise.id ? updatedExercise : ex);
    return updatedExercise;
};

export const deleteExercise = async (id: string): Promise<void> => {
    await delay(400);
    exercises = exercises.filter(ex => ex.id !== id);
};
