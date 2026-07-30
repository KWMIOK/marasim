import QRCode from "qrcode";

export async function generateGuestQrDataUrl(payload: string): Promise<string> {
  return QRCode.toDataURL(payload, {
    errorCorrectionLevel: "M",
    margin: 2,
    width: 280,
    color: {
      dark: "#E8D5A3",
      light: "#00000000",
    },
  });
}
