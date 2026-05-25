import { ResendEmailProvider } from "@/lib/email/resend";

export type DonationReceiptPayload = {
  to: string;
  amountPence: number;
  currency: string;
  fundName: string;
  status: string;
  receiptedAt: string;
};

export interface DonationReceiptProvider {
  sendDonationReceipt(payload: DonationReceiptPayload): Promise<void>;
}

const provider: DonationReceiptProvider = new ResendEmailProvider();

export function getDonationReceiptProvider() {
  return provider;
}
