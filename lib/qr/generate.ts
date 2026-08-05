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

export async function generateVendorQrDataUrl(payload: string): Promise<string> {
  return QRCode.toDataURL(payload, {
    errorCorrectionLevel: "H",
    margin: 2,
    width: 320,
    color: {
      dark: "#000000",
      light: "#FFFFFF",
    },
  });
}
