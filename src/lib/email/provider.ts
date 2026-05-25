import { ResendEmailProvider } from "@/lib/email/resend";

export type RegistrationEmailPayload = {
  to: string;
  eventTitle: string;
  eventStartsAt: string;
  qrToken: string;
};

export type EventReminderEmailPayload = {
  to: string;
  eventTitle: string;
  eventStartsAt: string;
};

export interface RegistrationEmailProvider {
  sendRegistrationConfirmation(payload: RegistrationEmailPayload): Promise<void>;
  sendEventReminder(payload: EventReminderEmailPayload): Promise<void>;
}

const provider: RegistrationEmailProvider = new ResendEmailProvider();

export function getRegistrationEmailProvider() {
  return provider;
}
