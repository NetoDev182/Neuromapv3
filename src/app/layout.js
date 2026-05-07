import { Inter, Lora } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const lora = Lora({ subsets: ['latin'], variable: '--font-lora' });

export const metadata = {
  title: 'NeuroMap — Diagnóstico Semiótico TRRS',
  description: 'Plataforma acadêmica de mapeamento cognitivo baseada na Teoria dos Registros de Representação Semiótica de Raymond Duval.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${lora.variable}`}>
      <body>
        <div id="toast-container" />
        {children}
      </body>
    </html>
  );
}
