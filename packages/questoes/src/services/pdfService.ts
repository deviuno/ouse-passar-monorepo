import { ParsedQuestion } from '../types';

const MASTRA_URL = import.meta.env.VITE_MASTRA_URL || 'http://localhost:4000';

interface PDFGeneratorOptions {
  simuladoName: string;
  preparatorioName?: string;
  studentName: string;
  cargo?: string;
  questions: ParsedQuestion[];
  totalTime: number; // in minutes
  provaNumber: number;
}

/**
 * Generates a PDF for a simulado exam using the Mastra server with Puppeteer
 * The server renders HTML/CSS to PDF with proper typography, columns, and hyphenation
 */
export async function generateSimuladoPDF(options: PDFGeneratorOptions): Promise<void> {
  const {
    simuladoName,
    preparatorioName,
    studentName,
    cargo,
    questions,
    totalTime,
    provaNumber,
  } = options;

  try {
    const response = await fetch(`${MASTRA_URL}/api/pdf/simulado`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        simuladoName,
        preparatorioName,
        studentName,
        cargo,
        questions,
        totalTime,
        provaNumber,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || `Failed to generate PDF: ${response.status}`);
    }

    // Get the PDF blob
    const pdfBlob = await response.blob();

    // Create download link
    const url = window.URL.createObjectURL(pdfBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${simuladoName.replace(/[^a-zA-Z0-9]/g, '_')}_Prova_${provaNumber + 1}.pdf`;

    // Trigger download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Cleanup
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
}
