'use server';
/**
 * @fileOverview AI-powered tool to simulate sending notifications to student guardians.
 *
 * - sendGuardianNotification - A function that simulates sending a notification.
 * - SendGuardianNotificationInput - The input type for the function.
 * - SendGuardianNotificationOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SendGuardianNotificationInputSchema = z.object({
  studentId: z.string().describe('The ID of the student.'),
  studentName: z.string().describe('The full name of the student.'),
  guardianPhoneNumber: z
    .string()
    .describe("The guardian's phone number to which the notification should be sent."),
  messageContent: z.string().min(5).describe('The content of the message to be sent.'),
});
export type SendGuardianNotificationInput = z.infer<typeof SendGuardianNotificationInputSchema>;

const SendGuardianNotificationOutputSchema = z.object({
  success: z.boolean().describe('Whether the notification was successfully "sent" (logged).'),
  confirmationMessage: z
    .string()
    .describe('A confirmation message detailing the action taken, or error if unsuccessful.'),
  details: z.object({
    studentName: z.string(),
    guardianPhoneNumber: z.string(),
    messageContent: z.string(),
    timestamp: z.string().describe('Timestamp of when the notification was processed.'),
  }).optional().describe('Details of the sent notification if successful.'),
});
export type SendGuardianNotificationOutput = z.infer<typeof SendGuardianNotificationOutputSchema>;

export async function sendGuardianNotification(
  input: SendGuardianNotificationInput
): Promise<SendGuardianNotificationOutput> {
  return sendGuardianNotificationFlow(input);
}

const notificationPrompt = ai.definePrompt({
  name: 'sendGuardianNotificationPrompt',
  input: {schema: SendGuardianNotificationInputSchema},
  output: {schema: SendGuardianNotificationOutputSchema},
  prompt: `
    You are an AI assistant responsible for logging notification attempts to student guardians.
    You DO NOT actually send messages. You only log the attempt and confirm what would be sent.

    Task:
    A request has been made to send a notification to the guardian of student: {{{studentName}}} (ID: {{{studentId}}}).
    The guardian's phone number is: {{{guardianPhoneNumber}}}.
    The message content is: "{{{messageContent}}}"

    Your job is to:
    1. Acknowledge the request.
    2. Confirm that the notification has been "logged" for sending.
    3. Generate a timestamp for when this log occurred.
    4. Return the 'success' field as true.
    5. Construct a 'confirmationMessage' indicating the message for '{{{studentName}}}'s guardian ({{{guardianPhoneNumber}}}) has been logged: "{{{messageContent}}}".
    6. Populate the 'details' object with studentName, guardianPhoneNumber, messageContent, and the generated timestamp.

    If the message content is too short (e.g., less than 5 characters), consider it an error. In that case:
    1. Return 'success' as false.
    2. Set 'confirmationMessage' to an error message like "Error: Message content is too short to send."
    3. Do not populate the 'details' object.
  `,
});

const sendGuardianNotificationFlow = ai.defineFlow(
  {
    name: 'sendGuardianNotificationFlow',
    inputSchema: SendGuardianNotificationInputSchema,
    outputSchema: SendGuardianNotificationOutputSchema,
  },
  async (input: SendGuardianNotificationInput) => {
    if (input.messageContent.length < 5) {
      return {
        success: false,
        confirmationMessage: "Error: El contenido del mensaje es demasiado corto para ser enviado.",
      };
    }
    
    // Simulate some processing delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // In a real scenario, this is where you would integrate with an SMS/Email API
    // For now, we just log it and confirm success based on the prompt's simulation
    
    const {output} = await notificationPrompt(input);
    if (!output) {
        return {
            success: false,
            confirmationMessage: "Error: La IA no pudo procesar la solicitud de notificación."
        }
    }

    // The prompt itself should construct most of the output based on instructions
    // but we ensure the timestamp is set if the prompt doesn't handle it robustly.
    if (output.success && output.details) {
      output.details.timestamp = output.details.timestamp || new Date().toISOString();
    } else if (output.success && !output.details) {
      // Fallback if prompt fails to create details but marks success
       output.details = {
        studentName: input.studentName,
        guardianPhoneNumber: input.guardianPhoneNumber,
        messageContent: input.messageContent,
        timestamp: new Date().toISOString(),
      };
      output.confirmationMessage = output.confirmationMessage || `Notificación para ${input.studentName} registrada.`;
    }


    return output;
  }
);
