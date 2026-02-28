export type RegistrationEmailPayload = {
  to: string;
  eventTitle: string;
  eventStartsAt: string;
  qrToken: string;
};

export interface RegistrationEmailProvider {
  sendRegistrationConfirmation(payload: RegistrationEmailPayload): Promise<void>;
}

class ConsoleRegistrationEmailProvider implements RegistrationEmailProvider {
  async sendRegistrationConfirmation(payload: RegistrationEmailPayload): Promise<void> {
    // Placeholder implementation for MVP. Replace with real provider integration in Phase 2.
    console.info("[registration-email] confirmation", payload);
  }
}

const provider: RegistrationEmailProvider = new ConsoleRegistrationEmailProvider();

export function getRegistrationEmailProvider() {
  return provider;
}
