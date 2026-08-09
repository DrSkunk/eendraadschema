import { flattenSVGfromString } from "../general";
import type { Hierarchical_List } from "../Hierarchical_List";
import { printPDF } from "../print/printToJsPDF";
import { SVGelement } from "../SVGelement";

export interface PrintPreviewState {
  readonly edsPageCount: number;
  readonly sitplanPageCount: number;
  readonly totalPageCount: number;
  readonly displayPageIndex: number;
  readonly canPrint: boolean;
  readonly enableAutopage: boolean;
  readonly paperSize: string;
  readonly dpi: number;
}

export interface GeneratePdfOptions {
  readonly filename: string;
  readonly pageRange?: string;
  readonly statusElement: { innerHTML: string };
}

/** React-facing adapter over the legacy print pipeline. It owns no state of
 *  its own: pagination, paper size and dpi stay on the authoritative legacy
 *  document, and SVG/PDF generation is delegated unchanged. */
export class LegacyPrintService {
  constructor(private readonly getDocument: () => Hierarchical_List) {}

  /** Regenerate the one-line SVG and feed its dimensions to the pagination
   *  table. Mirrors the sizing step the legacy print page performs first. */
  computeLayout(): SVGelement {
    const document = this.getDocument();
    const outSVG = document.toSVG(0, "horizontal");
    document.print_table.setHeight(outSVG.yup + outSVG.ydown);
    document.print_table.setMaxWidth(outSVG.xleft + outSVG.xright + 10);
    this.clampDisplayPage();
    return outSVG;
  }

  getPreviewState(): PrintPreviewState {
    const document = this.getDocument();
    const edsPageCount = document.print_table.pages.length;
    const sitplanPageCount = document.sitplan ? document.sitplan.getNumPages() : 0;
    return {
      edsPageCount,
      sitplanPageCount,
      totalPageCount: edsPageCount + sitplanPageCount,
      displayPageIndex: document.print_table.displaypage,
      canPrint: document.print_table.canPrint(),
      enableAutopage: document.print_table.enableAutopage,
      paperSize: document.print_table.getPaperSize(),
      dpi: this.getDpi(),
    };
  }

  setDisplayPageIndex(pageIndex: number): void {
    this.getDocument().print_table.displaypage = pageIndex;
    this.clampDisplayPage();
  }

  /** SVG markup of one preview page: an EDS page cut from the full one-line
   *  drawing, or a situation-plan page beyond the EDS page count. */
  getPreviewSvg(
    pageIndex: number = this.getDocument().print_table.displaypage,
    precomputedSvg?: SVGelement,
  ): string {
    const document = this.getDocument();
    const edsPageCount = document.print_table.pages.length;
    if (pageIndex < edsPageCount) {
      return this.getEdsPageSvg(precomputedSvg ?? document.toSVG(0, "horizontal"), pageIndex);
    }
    const sitplanPage = pageIndex - edsPageCount;
    return document.sitplan?.toSitPlanPrint().pages[sitplanPage]?.svg ?? "";
  }

  generatePdf(options: GeneratePdfOptions): void {
    const document = this.getDocument();
    if (typeof document.properties.dpi === "undefined") document.properties.dpi = 300;

    const svg = flattenSVGfromString(document.toSVG(0, "horizontal").data);
    const state = this.getPreviewState();
    const pageRange = options.pageRange?.trim() !== "" && options.pageRange !== undefined
      ? options.pageRange.trim()
      : `1-${state.totalPageCount}`;

    // With automatic pagination every page carries the document info text.
    if (document.print_table.enableAutopage) {
      for (const page of document.print_table.pages) page.info = document.properties.info;
    }

    printPDF(
      svg,
      document.print_table,
      document.properties,
      pageRange,
      options.filename,
      options.statusElement,
      document.sitplan.toSitPlanPrint(),
    );
  }

  private getEdsPageSvg(outSVG: SVGelement, pageIndex: number): string {
    const printTable = this.getDocument().print_table;
    const startx = printTable.pages[pageIndex].start;
    const width = printTable.pages[pageIndex].stop - startx;
    const starty = printTable.getstarty();
    const height = printTable.getstopy() - starty;
    const viewbox = `${startx} ${starty} ${width} ${height}`;

    return '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"'
      + ' transform="scale(1,1)" style="border:1px solid white"'
      + ` height="${height}" width="${width}" viewBox="${viewbox}">`
      + flattenSVGfromString(outSVG.data)
      + "</svg>";
  }

  private getDpi(): number {
    return this.getDocument().properties.dpi ?? 300;
  }

  private clampDisplayPage(): void {
    const document = this.getDocument();
    const state = this.getPreviewState();
    if (document.print_table.displaypage >= state.totalPageCount) {
      document.print_table.displaypage = Math.max(0, state.totalPageCount - 1);
    }
    if (document.print_table.displaypage < 0) document.print_table.displaypage = 0;
  }
}
