import { LegacyPrintService } from "../application/PrintService";
import { download_by_blob } from "../importExport/importExport";
import { SVGelement } from "../SVGelement";

/** Single React-facing print adapter over the authoritative legacy document.
 *  The imperative print page below and any future React print UI share it. */
export const printService = new LegacyPrintService(() => globalThis.structure);

globalThis.HLDisplayPage = () => {
    printService.setDisplayPageIndex(parseInt((document.getElementById("id_select_page") as HTMLInputElement).value) - 1);
    printsvg();
}

globalThis.dosvgdownload = () => {
    const prtContent = printService.getPreviewSvg();
    if (prtContent === "") return;

    const dosvgname = (document.getElementById("dosvgname") as HTMLInputElement);
    const filename = dosvgname == null ? "eendraadschema.svg" : dosvgname.value;

    download_by_blob(prtContent, filename, 'data:image/svg+xml;charset=utf-8'); //Was text/plain
}

export function getPrintSVGWithoutAddress(outSVG: SVGelement, page: number = globalThis.structure.print_table.displaypage) {
    return printService.getPreviewSvg(page, outSVG);
}

export function printsvg() {

    function generatePdf() {
        const state = printService.getPreviewState();

        const modeSelect = document.getElementById("print_page_mode") as HTMLSelectElement | null;
        const rangeInput = document.getElementById("print_page_range") as HTMLInputElement | null;
        if (!state.canPrint) {
            modeSelect.value = "all";
            rangeInput.value = "";
            rangeInput.style.display = "none";
            let rangeError = document.getElementById("print_range_error");
            if (rangeError) {
                rangeError.style.display = "none";
            }
        }

        let pagerange: string | undefined = undefined;
        if (modeSelect && modeSelect.value === "custom" && rangeInput && rangeInput.value.trim() !== "") {
            pagerange = rangeInput.value.trim();
        }

        printService.generatePdf({
            filename: (document.getElementById("dopdfname") as HTMLInputElement).value,
            pageRange: pagerange,
            statusElement: document.getElementById("progress_pdf"),
        });
    }

    function renderPreview(pageIndex: number, outSVG: SVGelement) {
        const printarea = document.getElementById("printarea");
        if (printarea == null) return;
        printarea.innerHTML = '<div id="printsvgarea">' + printService.getPreviewSvg(pageIndex, outSVG) + '</div>';
    }

    // First we generate an SVG image and feed its dimensions to the pagination
    // table. We keep the result because the preview at the end reuses it.

    const outSVG = printService.computeLayout();

    // Then we display all the print options

    let outstr: string = "";
    var strleft: string = "";

    const configsection = document.getElementById("configsection");
    if (configsection != null)
        configsection.innerHTML
            = '<div>'
            +   '<button id="button_pdfdownload">Genereer PDF</button>&nbsp;'
            +   '<span id="select_papersize"></span>&nbsp;'
            +   '<span id="select_dpi"></span>&nbsp;'
            +   '<input id="dopdfname" size="20" value="eendraadschema_print.pdf">&nbsp;'
            +   '<span id="progress_pdf"></span>' // Area where status of pdf generation can be displayed
            + '</div>'
            + '<div id="select_page_range"></div>';

    const button_pdfdownload = document.getElementById('button_pdfdownload');
    if (button_pdfdownload != null)
        button_pdfdownload.onclick = generatePdf;

    globalThis.structure.print_table.insertHTMLselectPaperSize(document.getElementById('select_papersize') as HTMLElement, printsvg);
    globalThis.structure.print_table.insertHTMLselectdpi(document.getElementById('select_dpi') as HTMLElement, printsvg);

    // Insert page range selector
    globalThis.structure.print_table.insertHTMLselectPageRange(document.getElementById('select_page_range') as HTMLElement, printsvg);

    outstr
        = '<div>'
        +   '<span style="margin-right: 2em" id="check_autopage"></span>' // Checkbox to choose if we want to auto paginate or not comes here
        +   '<span style="margin-right: 2em" id="id_verticals"></span>' // An optional area to choose what part of the y-space of the image is shown
        +   '<span id="id_suggest_xpos_button"></span>' // A button to force auto pagination comes here
        + '</div>';

    if (configsection != null)
        configsection.insertAdjacentHTML('beforeend', outstr);

    globalThis.structure.print_table.insertHTMLcheckAutopage(document.getElementById('check_autopage') as HTMLElement, printsvg);
    if (!globalThis.structure.print_table.enableAutopage) {
        globalThis.structure.print_table.insertHTMLchooseVerticals(document.getElementById('id_verticals') as HTMLElement, printsvg);
        globalThis.structure.print_table.insertHTMLsuggestXposButton(document.getElementById('id_suggest_xpos_button') as HTMLElement, printsvg);
    }

    if (!globalThis.structure.print_table.enableAutopage) {
        outstr
            = '<br>'
            + '<table border="0">'
                + '<tr>'
                    + '<td style="vertical-align:top;">'
                        + '<div id="id_print_table"></div>' // Table with all startx and stopx comes here
                    + '</td>'
                    + '<td style="vertical-align:top;padding:5px">'
                        + '<div>Klik op de groene pijl om het schema over meerdere pagina\'s te printen en kies voor elke pagina de start- en stop-positie in het schema (in pixels).</div>'
                        + '<div>Je kan eventueel ook de tekst (info) aanpassen die op elke pagina rechts onderaan komt te staan.</div>'
                        + '<div>Onderaan kan je bekijken welk deel van het schema op welke pagina belandt.</div>'
                    + '</td>'
                + '</tr>'
            + '</table>'
            + '<br>';

        if (configsection != null)
            configsection.insertAdjacentHTML('beforeend', outstr);

        globalThis.structure.print_table.insertHTMLposxTable(document.getElementById('id_print_table') as HTMLElement, printsvg)
    }

    strleft += '<hr>';

    const previewState = printService.getPreviewState();
    const numPages = previewState.totalPageCount;
    const displayPageIndex = previewState.displayPageIndex;

    strleft += '<b>Printvoorbeeld: </b>Pagina <select onchange="HLDisplayPage()" id="id_select_page">'
    for (let i = 0; i < numPages; i++) {
        if (i == displayPageIndex) {
            strleft += '<option value=' + (i+1) + ' selected>' + (i+1) + '</option>';
        } else {
            strleft += '<option value=' + (i+1) + '>' + (i+1) + '</option>';
        }
    }
    strleft += '</select>&nbsp;&nbsp;(Enkel tekening, kies "Genereer PDF" om ook de tekstuele gegevens te zien)';

    strleft += '<br><br>';

    strleft += '<table border="0"><tr><td style="vertical-align:top"><button onclick="dosvgdownload()">Zichtbare pagina als SVG opslaan</button></td><td>&nbsp;</td><td style="vertical-align:top"><input id="dosvgname" size="20" value="eendraadschema_print.svg"></td><td>&nbsp;&nbsp;</td><td>Sla tekening hieronder op als SVG en converteer met een ander programma naar PDF (bvb Inkscape).</td></tr></table><br>';

    strleft += globalThis.displayButtonPrintToPdf(); // This is only for the online version

    strleft += '<div id="printarea"></div>';

    if (configsection != null)
        configsection.insertAdjacentHTML('beforeend', strleft);

    // Finally we show the actual SVG

    renderPreview(displayPageIndex, outSVG);

    globalThis.toggleAppView('config');
}
