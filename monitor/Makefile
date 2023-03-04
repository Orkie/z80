FLAGS := -I ../lib
ROM_SIZE := 32k

.DEFAULT_GOAL := monitor

monitor:
	make -C ../cpm
	z80asm ${FLAGS} *.z80 -o monitor_raw.bin
	cp -f monitor_raw.bin monitor.bin
	truncate -s ${ROM_SIZE} monitor.bin

write:
	minipro -p"AT28C256" -E && minipro -p"AT28C256" -vb && minipro -p"AT28C256" -w "monitor.bin"

clean:
	rm *.bin

