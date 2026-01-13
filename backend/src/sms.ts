import twilio from "twilio";

// Initialize Twilio Client
const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// Track the last time we sent a text to prevent spamming
let lastSentTime = 0;

// Set cooldown to 5 minutes
const COOLDOWN_MINUTES = 5; 

export async function sendQuotaAlertSMS(serviceName: string, errorDetails: string) {
  const now = Date.now();
  
  // Check if 5 minutes have passed since the last alert
  if (now - lastSentTime < COOLDOWN_MINUTES * 60 * 1000) {
    console.log(`⚠️ SMS Alert suppressed (Cooldown active: waiting ${COOLDOWN_MINUTES} mins)`);
    return;
  }

  const message = `🚨 API ALERT: ${serviceName} is out of credits!\n\nDetails: ${errorDetails}`;

  try {
    await client.messages.create({
      body: message,
      from: process.env.TWILIO_FROM_PHONE,
      to: process.env.ADMIN_PHONE as string,
    });
    
    console.log("✅ Admin SMS Alert sent successfully.");
    
    // Update the last sent time to NOW
    lastSentTime = now; 
  } catch (error) {
    console.error("❌ Failed to send SMS:", error);
  }
}