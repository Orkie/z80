// Set up a virtual serial terminal
const terminalName = "Z80 Serial Terminal";
const vscode = API.vscode;
const basePath = vscode.workspace.workspaceFolders[0].uri.fsPath;
vscode.window.terminals.filter(t => t.name === terminalName).forEach(t => t.dispose());

const writeEmitter = new vscode.EventEmitter();
var serialPrintChar = (hex) => writeEmitter.fire(String.fromCharCode(hex));
var onSerialInput = null;
const pty = {
  onDidWrite: writeEmitter.event,
  open: () => {},
  close: () => {},
  handleInput: data => {
    if(onSerialInput) {
        onSerialInput(data);
    }
  },
};

const terminal = vscode.window.createTerminal({ name: terminalName, pty, isTransient: true });
terminal.show();

// virtual CF card
const fs = API.fs;
const buffer = API.buffer;
const Buffer = buffer.Buffer;
var fd = -1;
const cfFilename = `${basePath}/nombr.bin`;
try {
    fd = fs.openSync(cfFilename, "r+");
} catch(e) {
    API.log(`Error while trying to open ${cfFilename}`, e);
    fd = -1;
}
API.log(`Opened ${cfFilename}: ${fd}`);

// Port definitions
const PORT_UART_THR = 0x00;
const PORT_UART_RHR = 0x00;
const PORT_UART_LCR = 0x03;
const PORT_UART_LSR = 0x05;
const PORT_UART_SPR = 0x07;

const PORT_CF_DATA = 0x08;
const PORT_CF_STATUS = 0x0F;
const PORT_CF_CMD = 0x0F;
const PORT_CF_LBA0 = 0x0B;
const PORT_CF_LBA1 = 0x0C;

const CF_CMD_READ_SECTOR = 0x20;
const CF_CMD_WRITE_SECTOR = 0x30;

var UART_LCR = 0x00;
var UART_LSR = 0x60;
var UART_SPR = 0x00;

var CF_LBA0 = 0x00;
var CF_LBA1 = 0x00;
const cfBuf = Buffer.alloc(512, 0x00);
var cfDataCount = 0;
var cfCurrentCommand = 0x0;
var cfCurrentSector = 0x0;

// serial input callback
const serialInputFIFO = [];
onSerialInput = (data) => {
    serialInputFIFO.push(data.charCodeAt(0));
}

// OUT callback
API.writePort = (port, value) => {
    const p = port & 0xFF;
    const v = value & 0xFF;
    switch(p) {
        case PORT_UART_LCR:
            UART_LCR = v;
            break;
        case PORT_UART_THR:
            // DLAB bit controls which registers are visible, but we don't really care about DLL
            // in a simulator
            if(!(UART_LCR & 0b10000000)) {
                serialPrintChar(v);
            }
            break;
        case PORT_UART_SPR:
            UART_SPR = v;
            break;
        case PORT_CF_LBA0:
            CF_LBA0 = v;
            break;
        case PORT_CF_LBA1:
            CF_LBA1 = v;
            break;
        case PORT_CF_CMD:
            if(fd !== -1) {
                cfCurrentCommand = v;
                cfCurrentSector = (CF_LBA1 << 8) | CF_LBA0;
                if(v == CF_CMD_READ_SECTOR) {
                    API.log(`Read sector ${cfCurrentSector}`);
                    try {
                        fs.readSync(fd, cfBuf, 0, 512, cfCurrentSector*512);
                        cfDataCount = 0;
                    } catch(e) {
                        API.log(`Error while reading CF image`, e)
                    }
                } else if(v == CF_CMD_WRITE_SECTOR) {
                    cfDataCount = 0;
                } else {
                    API.log(`Unknown CF command: ${v}`);
                }
            } else {
                API.log("No CF image open");
            }
            break;
        case PORT_CF_DATA:
            if(cfCurrentCommand == CF_CMD_WRITE_SECTOR) {
                cfBuf[cfDataCount++] = v;
                if(cfDataCount == 512) {
                    API.log(`Write sector ${cfCurrentSector}`);
                    cfCurrentCommand = 0x0;
                    fs.writeSync(fd, cfBuf, 0, 512, sector*512)
                }
            }
            break;
        default:
            API.log(`Writing to unimplemented port: ${p}`)
    }
}

// IN callback
API.readPort = (port) => {
    const p = port & 0xFF;
    switch(port & 0xFF) {
        case PORT_UART_LSR:
            return UART_LSR | (serialInputFIFO.length > 0 ? 1 : 0);
        case PORT_UART_LCR:
            return UART_LCR;
        case PORT_UART_RHR:
            const v = serialInputFIFO.pop();
            return v === undefined ? 0x00 : v;
        case PORT_UART_SPR:
            return UART_SPR;
        case PORT_CF_STATUS:
            return 0b00001000;
        case PORT_CF_DATA:
            if(cfCurrentCommand == CF_CMD_READ_SECTOR) {
                const out = cfBuf[cfDataCount++ % 512];
                if(cfDataCount == 512) {
                    cfCurrentCommand = 0x0;
                }
                return out;
            }
            break;
        default:
            API.log(`Reading from unimplemented port: ${p}`);
    }
    return undefined;
}