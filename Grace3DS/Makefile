# Grace for 3DS: builds grace.3dsx (Homebrew Launcher) and Grace.cia (FBI install).
DEVKITPRO ?= /opt/devkitpro
DEVKITARM ?= $(DEVKITPRO)/devkitARM
CC        := $(DEVKITARM)/bin/arm-none-eabi-gcc
TOOLS     := $(DEVKITPRO)/tools/bin
ARCH      := -march=armv6k -mtune=mpcore -mfloat-abi=hard -mtp=soft
CFLAGS    := -g -Wall -O2 -mword-relocations -ffunction-sections -fdata-sections $(ARCH) -D__3DS__ \
             -I$(DEVKITPRO)/libctru/include -I$(DEVKITPRO)/portlibs/3ds/include
LDFLAGS   := -specs=3dsx.specs -g $(ARCH) -Wl,--gc-sections -L$(DEVKITPRO)/libctru/lib -L$(DEVKITPRO)/portlibs/3ds/lib
LIBS      := -lcitro2d -lcitro3d -lctru -lm
TITLE     := Grace
DESC      := Give up power. Keep your grace.
AUTHOR    := zoople
MAKEROM   ?= makerom
BANNERTOOL ?= bannertool

all: out/grace.3dsx

out/romfs/gfx/sprites.t3x: gfx/sprites.t3s $(wildcard gfx/*.png)
	mkdir -p out/romfs/gfx
	cd gfx && $(TOOLS)/tex3ds -i sprites.t3s -o ../out/romfs/gfx/sprites.t3x

out/grace.elf: source/main.c
	mkdir -p out
	$(CC) $(CFLAGS) $< -o $@ $(LDFLAGS) $(LIBS)

out/grace.smdh: assets/icon.png
	$(TOOLS)/smdhtool --create "$(TITLE)" "$(DESC)" "$(AUTHOR)" $< $@

out/grace.3dsx: out/grace.elf out/grace.smdh out/romfs/gfx/sprites.t3x
	$(TOOLS)/3dsxtool $< $@ --smdh=out/grace.smdh --romfs=out/romfs

cia:
	test -f out/grace.elf && test -f out/romfs/gfx/sprites.t3x
	$(BANNERTOOL) makebanner -i assets/banner.png -a assets/banner.wav -o out/banner.bnr
	$(BANNERTOOL) makesmdh -s "$(TITLE)" -l "$(DESC)" -p "$(AUTHOR)" -i assets/icon.png -o out/icon.smdh
	$(MAKEROM) -f cia -o out/Grace.cia -elf out/grace.elf -rsf grace.rsf -icon out/icon.smdh -banner out/banner.bnr -exefslogo -target t

clean:
	rm -rf out
.PHONY: all cia clean
