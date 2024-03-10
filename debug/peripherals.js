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

// Port definitions
const PORT_UART_THR = 0x00;
const PORT_UART_LCR = 0x03;
const PORT_UART_LSR = 0x05;

var UART_LCR = 0x00;

// OUT callback
API.writePort = (port, value) => {
    const p = port & 0xFF;
    const v = value & 0xFF;
    switch(p) {
        case PORT_UART_LCR:
            UART_LCR = v;
            break;
        case PORT_UART_THR:
            // DLAB bit controls which registers are visible
            if(!(UART_LCR & 0b10000000)) {
                serialPrintChar(v);
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
            return 0b00100001; // we're always ready for data
        case PORT_UART_LCR: break;
        default:
            API.log(`Reading from unimplemented port: ${p}`);
    }
    return undefined;
}