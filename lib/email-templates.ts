/**
 * Email templates (HTML, inline styles for max client compatibility).
 *
 * These are prepared for the Supabase migration: a Supabase Edge Function + Resend
 * will render these and send the emails. For now they are pure string builders,
 * used only by the stub in `notifications-service.ts`.
 */

const BRAND = "#ad88ed";
const DEEP = "#312199";

function shell(title: string, body: string): string {
  return `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width"/></head>
<body style="margin:0;background:#f7f5f0;font-family:Montserrat,Arial,sans-serif;color:#1a1a2e;">
  <div style="max-width:560px;margin:0 auto;padding:24px;">
    <div style="text-align:center;padding:16px 0;">
      <span style="font-family:Poppins,Arial,sans-serif;font-weight:700;font-size:22px;color:${DEEP};">Flow<span style="color:${BRAND};">Task</span></span>
    </div>
    <div style="background:#ffffff;border:1px solid #e0ded8;border-radius:12px;padding:24px;">
      <h1 style="font-family:Poppins,Arial,sans-serif;font-size:20px;margin:0 0 12px;">${title}</h1>
      ${body}
    </div>
    <p style="text-align:center;color:#6b6b80;font-size:12px;margin-top:16px;">
      FlowTask · FlowSys LT · Você recebe este email por ter ativado notificações.
    </p>
  </div>
</body></html>`;
}

export interface DailySummaryData {
  userName: string;
  tasks: { title: string; priority: string }[];
  events: { title: string; time: string }[];
  streakCount: number;
}

export function dailySummaryEmail(data: DailySummaryData): { subject: string; html: string } {
  const tasks = data.tasks.length
    ? `<ul style="padding-left:18px;margin:8px 0;">${data.tasks
        .map((t) => `<li style="margin:4px 0;">${t.title} <span style="color:#6b6b80;">(${t.priority})</span></li>`)
        .join("")}</ul>`
    : `<p style="color:#6b6b80;">Nenhuma tarefa para hoje. 🎉</p>`;
  const events = data.events.length
    ? `<ul style="padding-left:18px;margin:8px 0;">${data.events
        .map((e) => `<li style="margin:4px 0;">${e.time} — ${e.title}</li>`)
        .join("")}</ul>`
    : `<p style="color:#6b6b80;">Nenhum compromisso agendado.</p>`;

  return {
    subject: `☀️ Seu dia na FlowTask, ${data.userName}`,
    html: shell(
      `Bom dia, ${data.userName}!`,
      `<p>Você está com um streak de <strong>${data.streakCount} dias</strong> 🔥. Bora manter!</p>
       <h2 style="font-size:15px;margin:16px 0 4px;">📋 Tarefas de hoje</h2>${tasks}
       <h2 style="font-size:15px;margin:16px 0 4px;">📅 Compromissos</h2>${events}`,
    ),
  };
}

export interface DeadlineAlertData {
  userName: string;
  itemTitle: string;
  kind: string; // "tarefa" | "projeto" | "dívida"
  dueLabel: string; // "vence amanhã", "vence em 3 dias"
}

export function deadlineAlertEmail(data: DeadlineAlertData): { subject: string; html: string } {
  return {
    subject: `⏰ ${data.itemTitle} ${data.dueLabel}`,
    html: shell(
      "Prazo se aproximando",
      `<p>Olá, ${data.userName}!</p>
       <p>Sua ${data.kind} <strong>"${data.itemTitle}"</strong> ${data.dueLabel}.</p>
       <p style="margin-top:16px;"><a href="#" style="background:${BRAND};color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px;display:inline-block;">Abrir na FlowTask</a></p>`,
    ),
  };
}

export interface AchievementEmailData {
  userName: string;
  achievementTitle: string;
  achievementDescription: string;
}

export function achievementEmail(data: AchievementEmailData): { subject: string; html: string } {
  return {
    subject: `🏆 Conquista desbloqueada: ${data.achievementTitle}`,
    html: shell(
      "Nova conquista! 🏆",
      `<p>Mandou muito bem, ${data.userName}!</p>
       <p>Você desbloqueou <strong>${data.achievementTitle}</strong> — ${data.achievementDescription}.</p>`,
    ),
  };
}
