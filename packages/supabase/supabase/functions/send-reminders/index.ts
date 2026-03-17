// Supabase Edge Function - send timesheet reminders
// Deploy with: supabase functions deploy send-reminders
// Schedule with: cron job every Friday at 3pm

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

Deno.serve(async (_req) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Find employees who haven't submitted timesheets this week
    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay() + 1); // Monday

    const { data: employees } = await supabase
      .from('employees')
      .select('id, first_name, last_name, email')
      .eq('is_active', true);

    const { data: entries } = await supabase
      .from('time_entries')
      .select('employee_id')
      .gte('clock_in', weekStart.toISOString())
      .eq('status', 'pending');

    const employeesWithPending = new Set(
      (entries || []).map((e: { employee_id: string }) => e.employee_id)
    );

    // Also find employees with NO entries this week
    const { data: allEntries } = await supabase
      .from('time_entries')
      .select('employee_id')
      .gte('clock_in', weekStart.toISOString());

    const employeesWithEntries = new Set(
      (allEntries || []).map((e: { employee_id: string }) => e.employee_id)
    );

    const reminders: string[] = [];

    for (const emp of (employees || [])) {
      const needsReminder = !employeesWithEntries.has(emp.id) || employeesWithPending.has(emp.id);

      if (needsReminder && RESEND_API_KEY) {
        // Send email via Resend
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'ServiceCore <noreply@servicecore.app>',
            to: emp.email,
            subject: 'Timesheet Reminder - Please Submit Your Hours',
            html: `
              <h2>Hi ${emp.first_name},</h2>
              <p>This is a friendly reminder to submit your timesheet for this week.</p>
              <p>${!employeesWithEntries.has(emp.id)
                ? 'We notice you haven\'t logged any hours this week.'
                : 'You have pending timesheet entries that need to be submitted.'}
              </p>
              <p>Please log into ServiceCore to complete your timesheet.</p>
              <p>Thank you,<br/>ServiceCore Team</p>
            `,
          }),
        });
        reminders.push(`${emp.first_name} ${emp.last_name} (${emp.email})`);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        reminders_sent: reminders.length,
        recipients: reminders,
      }),
      { headers: { 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
});
