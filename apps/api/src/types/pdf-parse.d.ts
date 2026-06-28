// pdf-parse ships types for its package entry only. We import the library
// module directly (src/lib/text-extract.ts) to skip its debug harness, so we
// declare the same minimal surface for that path.
declare module "pdf-parse/lib/pdf-parse.js" {
  interface PdfParseResult {
    text: string;
    numpages: number;
    info: unknown;
  }
  function pdfParse(dataBuffer: Buffer): Promise<PdfParseResult>;
  export default pdfParse;
}
