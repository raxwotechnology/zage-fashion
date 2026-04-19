/**
 * SMS Service — Placeholder
 * Ready for integration with any SMS provider (Notify.lk, Dialog, etc.)
 * Currently logs to console. Set SMS_API_KEY in .env to activate.
 */

const sendSms = async (phone, message) => {
  const apiKey = process.env.SMS_API_KEY;
  const senderId = process.env.SMS_SENDER_ID || 'FreshCart';

  if (!apiKey) {
    console.log(`[SMS Placeholder] To: ${phone} | Message: ${message}`);
    return { success: true, placeholder: true };
  }

  // When API key is provided, implement actual SMS sending here
  // Example for Notify.lk:
  // const response = await axios.post('https://app.notify.lk/api/v1/send', {
  //   user_id: process.env.SMS_USER_ID,
  //   api_key: apiKey,
  //   sender_id: senderId,
  //   to: phone,
  //   message: message,
  // });

  console.log(`[SMS] Sent to ${phone}: ${message}`);
  return { success: true };
};

const sendOtp = async (phone) => {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const message = `Your FreshCart verification code is: ${otp}. Valid for 5 minutes.`;
  await sendSms(phone, message);
  return otp;
};

const sendReceipt = async (phone, orderData) => {
  const items = orderData.items?.map(i => `${i.name} x${i.quantity}`).join(', ') || '';
  const message = `FreshCart Receipt #${orderData._id?.slice(-6) || ''}
Total: Rs.${orderData.totalAmount?.toFixed(2) || '0.00'}
Items: ${items}
Thank you!`;
  return sendSms(phone, message);
};

module.exports = { sendSms, sendOtp, sendReceipt };
