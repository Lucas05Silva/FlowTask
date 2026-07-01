import {
  dailySummaryEmail,
  deadlineAlertEmail,
  achievementEmail,
  type DailySummaryData,
  type DeadlineAlertData,
  type AchievementEmailData,
} from "@/lib/email-templates";

/**
 * Email notification service.
 *
 * ⚠️ STUB: on the local (mock) build this only logs to the console. When the app
 * migrates to Supabase, replace the body of `sendEmailNotification` with a call to
 * a Supabase Edge Function that uses Resend (https://resend.com) to actually send
 * the rendered HTML. The signatures below are the intended final contract.
 */

export type EmailTemplate = "daily_summary" | "deadline_alert" | "achievement";

interface TemplateDataMap {
  daily_summary: DailySummaryData;
  deadline_alert: DeadlineAlertData;
  achievement: AchievementEmailData;
}

function render<T extends EmailTemplate>(
  template: T,
  data: TemplateDataMap[T],
): { subject: string; html: string } {
  switch (template) {
    case "daily_summary":
      return dailySummaryEmail(data as DailySummaryData);
    case "deadline_alert":
      return deadlineAlertEmail(data as DeadlineAlertData);
    case "achievement":
      return achievementEmail(data as AchievementEmailData);
    default:
      throw new Error(`Unknown email template: ${template}`);
  }
}

/**
 * Send an email notification to a user.
 * @returns whether the send was accepted (always true in the stub).
 */
export async function sendEmailNotification<T extends EmailTemplate>(
  userId: string,
  template: T,
  data: TemplateDataMap[T],
): Promise<boolean> {
  const { subject, html } = render(template, data);

  // TODO(Supabase): replace with an Edge Function invocation + Resend send.
  //   await supabase.functions.invoke("send-email", { body: { userId, subject, html } });
  if (process.env.NODE_ENV !== "production") {
    console.log(`[email:stub] → user=${userId} template=${template} subject="${subject}" (${html.length} bytes)`);
  }
  return true;
}
