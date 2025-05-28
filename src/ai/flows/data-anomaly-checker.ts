// use server'
'use server';

/**
 * @fileOverview AI-powered tool to identify mismatches between student names and DNIs.
 *
 * - dataAnomalyChecker - A function that checks for inconsistencies between student names and DNIs.
 * - DataAnomalyCheckerInput - The input type for the dataAnomalyChecker function.
 * - DataAnomalyCheckerOutput - The return type for the dataAnomalyChecker function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DataAnomalyCheckerInputSchema = z.object({
  studentName: z.string().describe('The name of the student.'),
  dni: z.string().describe('The DNI (student ID) of the student.'),
});
export type DataAnomalyCheckerInput = z.infer<typeof DataAnomalyCheckerInputSchema>;

const DataAnomalyCheckerOutputSchema = z.object({
  isMatch: z
    .boolean()
    .describe(
      'Whether the student name and DNI are likely a match (true) or there is a potential anomaly (false).'
    ),
  confidence: z
    .number()
    .describe(
      'A confidence score (0-1) indicating the likelihood of a match. Higher values indicate greater certainty of a match.'
    ),
  reason: z
    .string()
    .describe(
      'Explanation for the isMatch determination, highlighting potential discrepancies or confirming the match.'
    ),
});
export type DataAnomalyCheckerOutput = z.infer<typeof DataAnomalyCheckerOutputSchema>;

export async function dataAnomalyChecker(input: DataAnomalyCheckerInput): Promise<DataAnomalyCheckerOutput> {
  return dataAnomalyCheckerFlow(input);
}

const dataAnomalyCheckerPrompt = ai.definePrompt({
  name: 'dataAnomalyCheckerPrompt',
  input: {schema: DataAnomalyCheckerInputSchema},
  output: {schema: DataAnomalyCheckerOutputSchema},
  prompt: `You are an AI assistant designed to detect potential mismatches between a student's name and their DNI (student ID).

  Given the following information, determine if there is a likely match or a potential anomaly.

  Student Name: {{{studentName}}}
DNI: {{{dni}}}

  Provide your response as a JSON object with the following keys:
  - isMatch (boolean): true if the name and DNI are likely a match, false if there is a potential anomaly.
  - confidence (number): A confidence score (0-1) indicating the likelihood of a match. Higher values indicate greater certainty of a match.
  - reason (string): An explanation for the isMatch determination, highlighting potential discrepancies or confirming the match.
  `,
});

const dataAnomalyCheckerFlow = ai.defineFlow(
  {
    name: 'dataAnomalyCheckerFlow',
    inputSchema: DataAnomalyCheckerInputSchema,
    outputSchema: DataAnomalyCheckerOutputSchema,
  },
  async input => {
    const {output} = await dataAnomalyCheckerPrompt(input);
    return output!;
  }
);
