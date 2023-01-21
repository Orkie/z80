uart:
	z80asm uart.z80 -o uart.bin
	truncate -s 16k uart.bin

io:
	z80asm io.z80 -o io.bin
	truncate -s 16k io.bin

all: uart io

