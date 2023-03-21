#!/bin/sh
head -c "$1" /dev/zero | sed 's/\x00/\xe5/g'
