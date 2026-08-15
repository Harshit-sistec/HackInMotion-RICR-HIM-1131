import mammoth from 'mammoth';

// pdf-parse's package entry runs a debug self-test on import when required directly at
// top-level in some bundlers; importing the lib file directly avoids that.
import pdfParse from 'pdf-parse/lib/pdf-parse.js';

export type ExtractedDocument = { kind: 'text'; text: string } | { kind: 'image'; base64: string; mimeType: string };

export class ExtractionError extends Error {}

const IMAGE_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

export async function extractDocument(file: {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
}): Promise<ExtractedDocument> {
  const { buffer, mimetype, originalname } = file;
  const lowerName = originalname.toLowerCase();

  if (mimetype === 'application/pdf' || lowerName.endsWith('.pdf')) {
    let text = '';
    try {
      const parsed = await pdfParse(buffer);
      text = parsed.text?.trim() ?? '';
    } catch {
      throw new ExtractionError('Could not read this PDF. It may be corrupted or scanned as images only.');
    }
    if (text.length < 30) {
      throw new ExtractionError(
        'This PDF has little or no extractable text (it may be a scanned image). Try uploading a text-based PDF, or upload it as an image instead.',
      );
    }
    return { kind: 'text', text };
  }

  if (
    mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    lowerName.endsWith('.docx')
  ) {
    let text = '';
    try {
      const result = await mammoth.extractRawText({ buffer });
      text = result.value?.trim() ?? '';
    } catch {
      throw new ExtractionError('Could not read this Word document. It may be corrupted or an unsupported format.');
    }
    if (text.length < 30) {
      throw new ExtractionError('This document has little or no readable text.');
    }
    return { kind: 'text', text };
  }

  if (IMAGE_MIME_TYPES.has(mimetype)) {
    return { kind: 'image', base64: buffer.toString('base64'), mimeType: mimetype };
  }

  throw new ExtractionError('Unsupported file type. Please upload a PDF, DOCX, or an image (JPG/PNG/WEBP).');
}
