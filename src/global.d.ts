import { Session } from "./Session";
import { MultiLevelStorage } from "./storage/MultiLevelStorage";
import { importExportUsingFileAPI } from "./importExport/importExport";
import { Hierarchical_List } from "./Hierarchical_List";
import { TopMenu } from "./TopMenu";
import { AutoSaver } from "./importExport/AutoSaver";

declare global {
    
    interface GlobalThis {
        session: Session;
        appDocStorage: MultiLevelStorage<any>;
        undostruct: any;
        structure: Hierarchical_List;
        topMenu: TopMenu;
        autoSaver: AutoSaver;
        CONFIGPAGE_LEFT: string;
        CONFIGPAGE_RIGHT: string;
        SITPLANVIEW_SELECT_PADDING: number;
        SITPLANVIEW_ZOOMINTERVAL: {MIN: number, MAX: number};
        SITPLANVIEW_DEFAULT_SCALE: number;
        fileAPIobj: importExportUsingFileAPI;
        CONFIGPRINTPAGE: string;
        EXAMPLE0: string;
        EXAMPLE1: string;
        EXAMPLE_DEFAULT: string;
        loadFromText: () => void;
        HLRedrawTree: () => void;
        HLRedrawTreeSVG: () => void;
        HLDisplayPage: () => void;
        HLRedrawTreeHTML: () => void;
        HL_cancelFilename: () => void;
        HL_changeFilename: () => void;
        HL_enterSettings: () => void;
        HLRedrawTreeHTMLLight: () => void;
        toggleAppView: (type: '2col' | 'config' | 'draw') => void;
        load_example: (nr: number) => void;
        undoClicked: () => void;
        redoClicked: () => void;
        historyCanUndo: () => boolean;
        historyCanRedo: () => boolean;
        read_settings: () => void;
        dosvgdownload: () => void;
        displayButtonPrintToPdf: () => void;
        handleButtonPrintToPdf: () => void;
        propUpload: (text: string) => void;
        loadFileFromText: () => void;
    }
}

export{}
