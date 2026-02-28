"use client";

import { useMemo, useState } from "react";

type Fund = {
  id: string;
  name: string;
  description: string | null;
};

type GiveFormProps = {
  funds: Fund[];
  giftAidEnabled: boolean;
  status: string | null;
  defaults: {
    fullName: string;
    addressLine1: string;
    city: string;
    postcode: string;
  };
  missingAddress: boolean;
};

const PRESET_AMOUNTS = [500, 1000, 2000, 5000, 10000];

function formatMoneyFromPence(amountPence: number) {
  return `£${(amountPence / 100).toFixed(2)}`;
}

export function GiveForm({ funds, giftAidEnabled, status, defaults, missingAddress }: GiveFormProps) {
  const initialFundId = funds[0]?.id ?? "";

  const [fundId, setFundId] = useState(initialFundId);
  const [amountMode, setAmountMode] = useState<"preset" | "custom">("preset");
  const [presetAmount, setPresetAmount] = useState<number>(PRESET_AMOUNTS[2]);
  const [customAmount, setCustomAmount] = useState("25");
  const [giftAid, setGiftAid] = useState(false);
  const [declarationAccepted, setDeclarationAccepted] = useState(false);
  const [fullName, setFullName] = useState(defaults.fullName);
  const [addressLine1, setAddressLine1] = useState(defaults.addressLine1);
  const [city, setCity] = useState(defaults.city);
  const [postcode, setPostcode] = useState(defaults.postcode);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedFund = useMemo(() => funds.find((fund) => fund.id === fundId) ?? null, [fundId, funds]);

  async function handleCheckout() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fundId,
          amountMode,
          presetAmountPence: presetAmount,
          customAmountPounds: customAmount,
          giftAid,
          declarationAccepted,
          fullName,
          addressLine1,
          city,
          postcode,
        }),
      });

      const payload = (await response.json()) as {
        url?: string;
        error?: string;
      };

      if (!response.ok || !payload.url) {
        throw new Error(payload.error || "Unable to start checkout.");
      }

      window.location.href = payload.url;
    } catch (checkoutError) {
      setError(checkoutError instanceof Error ? checkoutError.message : "Unable to start checkout.");
      setLoading(false);
    }
  }

  if (!funds.length) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
        No active funds are configured yet.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {status === "success" ? (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          Thank you. Your donation was received.
        </div>
      ) : null}
      {status === "cancelled" ? (
        <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
          Checkout was cancelled.
        </div>
      ) : null}

      <div>
        <label className="block text-sm font-medium text-slate-700">Fund</label>
        <select
          value={fundId}
          onChange={(event) => setFundId(event.target.value)}
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        >
          {funds.map((fund) => (
            <option key={fund.id} value={fund.id}>
              {fund.name}
            </option>
          ))}
        </select>
        {selectedFund?.description ? <p className="mt-1 text-xs text-slate-500">{selectedFund.description}</p> : null}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">Amount (one-off)</label>
        <div className="mt-2 flex flex-wrap gap-2">
          {PRESET_AMOUNTS.map((amount) => (
            <button
              key={amount}
              type="button"
              onClick={() => {
                setAmountMode("preset");
                setPresetAmount(amount);
              }}
              className={`rounded-md px-3 py-2 text-sm ${
                amountMode === "preset" && presetAmount === amount
                  ? "bg-slate-900 text-white"
                  : "border border-slate-300 text-slate-700"
              }`}
            >
              {formatMoneyFromPence(amount)}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setAmountMode("custom")}
            className={`rounded-md px-3 py-2 text-sm ${
              amountMode === "custom" ? "bg-slate-900 text-white" : "border border-slate-300 text-slate-700"
            }`}
          >
            Custom
          </button>
        </div>

        {amountMode === "custom" ? (
          <input
            type="number"
            min={1}
            step="0.01"
            value={customAmount}
            onChange={(event) => setCustomAmount(event.target.value)}
            className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            placeholder="Enter amount in GBP"
          />
        ) : null}
      </div>

      {giftAidEnabled ? (
        <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
          <label className="flex items-start gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={giftAid}
              onChange={(event) => {
                setGiftAid(event.target.checked);
                if (!event.target.checked) {
                  setDeclarationAccepted(false);
                }
              }}
              className="mt-1"
            />
            Add Gift Aid to this donation
          </label>

          {giftAid ? (
            <div className="mt-3 space-y-3">
              <label className="flex items-start gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={declarationAccepted}
                  onChange={(event) => setDeclarationAccepted(event.target.checked)}
                  className="mt-1"
                />
                I confirm I am a UK taxpayer and want this donation treated as Gift Aid.
              </label>

              {missingAddress ? (
                <div className="grid gap-2">
                  <input
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                    placeholder="Full name"
                    className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                  />
                  <input
                    value={addressLine1}
                    onChange={(event) => setAddressLine1(event.target.value)}
                    placeholder="Address line 1"
                    className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                  />
                  <input
                    value={city}
                    onChange={(event) => setCity(event.target.value)}
                    placeholder="City"
                    className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                  />
                  <input
                    value={postcode}
                    onChange={(event) => setPostcode(event.target.value)}
                    placeholder="Postcode"
                    className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}

      <button
        type="button"
        disabled={loading}
        onClick={handleCheckout}
        className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-60"
      >
        {loading ? "Starting checkout..." : "Continue to Stripe"}
      </button>

      {error ? <p className="text-sm text-rose-700">{error}</p> : null}
    </div>
  );
}
