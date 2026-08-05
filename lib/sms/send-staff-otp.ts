export async function sendReceptionStaffOtpSms(input: {
  phone: string;
  code: string;
  eventDisplayName?: string;
}): Promise<{ sent: boolean; devCode?: string }> {
  const isDev = process.env.NODE_ENV !== "production";

  if (isDev || process.env.RECEPTION_OTP_DEV_MODE === "true") {
    console.info("[reception-otp]", input.phone, input.code);
    return { sent: true, devCode: input.code };
  }

  // Twilio / Supabase SMS can be wired here when credentials are available.
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_FROM_NUMBER;

  if (!accountSid || !authToken || !fromNumber) {
    console.warn("[reception-otp] SMS provider not configured.");
    return { sent: false };
  }

  const body = `Your Versai reception code is ${input.code}. Valid for 10 minutes.`;
  const credentials = Buffer.from(`${accountSid}:${authToken}`).toString("base64");

  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        To: input.phone,
        From: fromNumber,
        Body: body,
      }),
    }
  );

  return { sent: response.ok };
}
