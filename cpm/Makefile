.DEFAULT_GOAL := cpm

cpm:
	z80asm cpm22.z80 -o cpm.bin -Llabels.txt
	test -n "$$(find cpm.bin -size -7168c)"

clean:
	rm *.bin

