import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'Cegos Formación <onboarding@resend.dev>';

export async function sendEmail(to: string, subject: string, html: string) {
    try {
        const { data, error } = await resend.emails.send({
            from: FROM_EMAIL,
            to: [to],
            replyTo: 'jromero@cegos.es',
            subject: subject,
            html: html,
        });

        if (error) {
            const errorStr = JSON.stringify(error).toLowerCase();
            if (errorStr.includes('restriction') || errorStr.includes('onboarding')) {
                return { success: false, error: 'Error de Envío (Modo Prueba): Resend solo permite enviar correos a la cuenta con la que te registraste. Verifica tu dominio en Resend.' };
            }
            return { success: false, error: (error as any).message || 'Error en Resend.' };
        }
        return { success: true, data };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
