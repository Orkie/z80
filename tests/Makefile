FLAGS := -I ../lib

uart:
	z80asm ${FLAGS} uart_test.z80 -o uart.bin
	truncate -s 16k uart.bin

io:
	z80asm io.z80 -o io.bin
	truncate -s 16k io.bin

rom_switch:
	z80asm rom_switch.z80 -o rom_switch.bin
	truncate -s 16k rom_switch.bin

clean:
	rm *.bin

all: uart io rom_switch

