import { EmailConfig } from "next-auth/providers";

import { OTP, User, UserRole } from "@/database";
import { connectToMongo } from "@/lib/server";

export function htmlAdmin({ otp }: { otp: string }) {
  const brandColor = "#346df1";
  const buttonText = "#fff";
  const color = {
    background: "#f9f9f9",
    text: "#444",
    mainBackground: "#fff",
    buttonBackground: brandColor,
    buttonBorder: brandColor,
    buttonText,
  };

  return `
    <body style="background: ${color.background};">
      <table width="100%" border="0" cellspacing="20" cellpadding="0"
        style="background: ${color.mainBackground}; max-width: 600px; margin: auto; border-radius: 10px;">
        <tr>
          <td align="center"
            style="padding: 10px 0px; font-size: 22px; font-family: Helvetica, Arial, sans-serif; color: ${color.text};">
            Ingresa a Normacolor
          </td>
        </tr>
        <tr>
          <td align="center" style="padding: 20px 0;">
            <p>Tu código ${otp}</p>
            <p>Expira en 5 minutos</p>
          </td>
        </tr>
        <tr>
          <td align="center"
            style="padding: 0px 0px 10px 0px; font-size: 16px; line-height: 22px; font-family: Helvetica, Arial, sans-serif; color: ${color.text};">
            If you did not request this email you can safely ignore it.
          </td>
        </tr>
      </table>
    </body>
    `;
}

export function htmlClient({ url }: { url: string; otp?: string }) {
  const brandColor = "#346df1";
  const buttonText = "#fff";
  const color = {
    background: "#f9f9f9",
    text: "#444",
    mainBackground: "#fff",
    buttonBackground: brandColor,
    buttonBorder: brandColor,
    buttonText,
  };

  return `
    <body style="background: ${color.background};">
      <table width="100%" border="0" cellspacing="20" cellpadding="0"
        style="background: ${color.mainBackground}; max-width: 600px; margin: auto; border-radius: 10px;">
        <tr>
          <td align="center"
            style="padding: 10px 0px; font-size: 22px; font-family: Helvetica, Arial, sans-serif; color: ${color.text};">
            Ingresa a Normacolor
          </td>
        </tr>
        <tr>
          <td align="center" style="padding: 20px 0;">
            <table border="0" cellspacing="0" cellpadding="0">
              <tr>
                <td align="center" style="border-radius: 5px;" bgcolor="${color.buttonBackground}"><a href="${url}"
                    target="_blank"
                    style="font-size: 18px; font-family: Helvetica, Arial, sans-serif; color: ${color.buttonText}; text-decoration: none; border-radius: 5px; padding: 10px 20px; border: 1px solid ${color.buttonBorder}; display: inline-block; font-weight: bold;">Sign
                    in</a></td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td align="center"
            style="padding: 0px 0px 10px 0px; font-size: 16px; line-height: 22px; font-family: Helvetica, Arial, sans-serif; color: ${color.text};">
            If you did not request this email you can safely ignore it.
          </td>
        </tr>
      </table>
    </body>
    `;
}

interface SendVerificationRequestData {
  identifier: string;
  provider: EmailConfig;
  url: string;
  expires: Date;
  token: string;
  request: Request;
}

export const sendVerificationRequest = async ({
  identifier: to,
  provider,
  url,
}: SendVerificationRequestData) => {
  await connectToMongo();

  const user = await User.findOne({
    email: to,
  });

  if (user?.role === UserRole.Admin) {
    const existingOtp = await OTP.findOne({
      requestedBy: to,
    });

    if (existingOtp && existingOtp.isExpired()) {
      await OTP.findByIdAndDelete(existingOtp.id);
    }

    if (existingOtp && !existingOtp.isExpired()) {
      throw new Error("There's a pending OTP.");
    }

    const { code, hash } = await OTP.generateRandomCode();

    await OTP.create({
      requestedBy: to,
      hash,
      isPasswordSetting: !user.password,
    });

    await sendAdminEmail({
      provider,
      identifier: to,
      otp: code,
    });
  } else {
    await sendClientEmail({
      provider,
      identifier: to,
      url,
    });
  }
};

async function sendClientEmail({
  provider,
  identifier,
  url,
}: Pick<SendVerificationRequestData, "provider" | "identifier" | "url">) {
  await sendEmail({
    provider,
    identifier,
    subject: "Ingresa a Normacolor.",
    html: htmlClient({ url }),
  });
}

async function sendAdminEmail({
  provider,
  identifier,
  otp,
}: Pick<SendVerificationRequestData, "provider" | "identifier"> & {
  otp: string;
}) {
  await sendEmail({
    provider,
    identifier,
    subject: "Ingreso de Administrador Normacolor",
    html: htmlAdmin({ otp }),
  });
}

async function sendEmail({
  provider,
  identifier: to,
  subject,
  html,
}: Pick<SendVerificationRequestData, "provider" | "identifier"> & {
  subject: string;
  html: string;
}) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${provider.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: provider.from,
      to,
      subject,
      html,
    }),
  });

  if (!res.ok) {
    throw new Error("Resend error: " + JSON.stringify(await res.json()));
  }
}
