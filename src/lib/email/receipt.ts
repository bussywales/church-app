export type DonationReceiptPayload = {
  to: string;
  amountPence: number;
  currency: string;
  fundName: string;
  status: string;
};

export interface DonationReceiptProvider {
  sendDonationReceipt(payload: DonationReceiptPayload): Promise<void>;
}

class ConsoleDonationReceiptProvider implements DonationReceiptProvider {
  async sendDonationReceipt(payload: DonationReceiptPayload): Promise<void> {
    // Placeholder implementation for MVP. Replace with real provider integration later.
    console.info("[donation-receipt]", payload);
  }
}

const provider: DonationReceiptProvider = new ConsoleDonationReceiptProvider();

export function getDonationReceiptProvider() {
  return provider;
}
