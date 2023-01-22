FLAGS := -I ../lib
ROM_SIZE := 16k

.DEFAULT_GOAL := monitor

monitor:
	z80asm ${FLAGS} *.z80 -o monitor_raw.bin
# TODO - strip trailing 0x00s from monitor_raw.bin
	cp -f monitor_raw.bin monitor.bin
	truncate -s ${ROM_SIZE} monitor.bin

clean:
	rm *.bin

