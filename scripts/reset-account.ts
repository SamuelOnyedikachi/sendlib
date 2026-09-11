import { connectDB } from "../lib/db";
import User from "../models/User";

async function resetUserSubscription(email: string) {
  try {
    await connectDB();
    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user) {
      console.error(`User with email "${email}" not found.`);
      process.exit(1);
    }

    user.plan = "free";
    user.subscriptionStatus = "none";
    user.subscriptionId = undefined;
    user.subscriptionCode = undefined;
    user.subscriptionToken = undefined;
    user.lastPaymentAt = undefined;
    user.currentPeriodEnd = undefined;

    await user.save();
    console.log(`Successfully reset subscription status for user: ${email}`);
    process.exit(0);
  } catch (error) {
    console.error("Error resetting user subscription:", error);
    process.exit(1);
  }
}

resetUserSubscription("samueltuoyo9082@gmail.com");
