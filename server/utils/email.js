import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendOTPEmail(to, otp, type) {
  const subject =
    type === "PASSWORD_RESET"
      ? "Comic Store - Đặt lại mật khẩu"
      : "Comic Store - Xác nhận email";

  const html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 500px; margin: 0 auto; background: #f4f0e7; padding: 40px; border-radius: 8px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="font-size: 28px; color: #171717; margin: 0;">PANEL<span style="color: #e51c2a">.</span></h1>
        <p style="color: #666; margin-top: 5px;">Comic Store</p>
      </div>
      <div style="background: white; padding: 30px; border-radius: 8px; text-align: center;">
        <h2 style="color: #171717; margin-top: 0;">${type === "PASSWORD_RESET" ? "Đặt lại mật khẩu" : "Xác nhận email"}</h2>
        <p style="color: #555;">Mã OTP của bạn là:</p>
        <div style="font-size: 36px; font-weight: 900; letter-spacing: 8px; color: #e51c2a; margin: 20px 0; padding: 15px; background: #f8f8f8; border-radius: 8px;">${otp}</div>
        <p style="color: #999; font-size: 13px;">Mã có hiệu lực trong 10 phút. Không chia sẻ mã này với ai.</p>
      </div>
      <p style="text-align: center; color: #aaa; font-size: 11px; margin-top: 20px;">© 2026 PANEL. Comic Store - PTIT HCM</p>
    </div>
  `;

  await transporter.sendMail({
    from: `"Comic Store" <${process.env.SMTP_USER}>`,
    to,
    subject,
    html,
  });
}

export async function sendOrderConfirmation(to, order, items) {
  const itemRows = items
    .map(
      (item) =>
        `<tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.title}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${new Intl.NumberFormat("vi-VN").format(item.price)}đ</td>
        </tr>`
    )
    .join("");

  const html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f4f0e7; padding: 40px; border-radius: 8px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="font-size: 28px; color: #171717; margin: 0;">PANEL<span style="color: #e51c2a">.</span></h1>
      </div>
      <div style="background: white; padding: 30px; border-radius: 8px;">
        <h2 style="color: #171717; margin-top: 0;">🎉 Xác nhận đơn hàng #${order.id}</h2>
        <p>Cảm ơn bạn đã đặt hàng tại Comic Store!</p>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <thead>
            <tr style="background: #f8f8f8;">
              <th style="padding: 10px; text-align: left;">Truyện</th>
              <th style="padding: 10px; text-align: center;">SL</th>
              <th style="padding: 10px; text-align: right;">Giá</th>
            </tr>
          </thead>
          <tbody>${itemRows}</tbody>
        </table>
        <div style="text-align: right; font-size: 18px; font-weight: 700; color: #e51c2a; border-top: 2px solid #e51c2a; padding-top: 10px;">
          Tổng: ${new Intl.NumberFormat("vi-VN").format(order.total)}đ
        </div>
        <div style="margin-top: 20px; padding: 15px; background: #f8f8f8; border-radius: 6px;">
          <p style="margin: 3px 0;"><strong>Người nhận:</strong> ${order.shipping_name}</p>
          <p style="margin: 3px 0;"><strong>SĐT:</strong> ${order.shipping_phone}</p>
          <p style="margin: 3px 0;"><strong>Địa chỉ:</strong> ${order.shipping_address}</p>
          <p style="margin: 3px 0;"><strong>Thanh toán:</strong> ${order.payment_method === "VNPAY" ? "VNPay" : "COD"}</p>
        </div>
      </div>
      <p style="text-align: center; color: #aaa; font-size: 11px; margin-top: 20px;">© 2026 PANEL. Comic Store - PTIT HCM</p>
    </div>
  `;

  await transporter.sendMail({
    from: `"Comic Store" <${process.env.SMTP_USER}>`,
    to,
    subject: `Comic Store - Xác nhận đơn hàng #${order.id}`,
    html,
  });
}
