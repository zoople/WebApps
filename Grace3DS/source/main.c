// Grace for Nintendo 3DS
// Top screen: the arena (landscape, 3D slider adds depth). Bottom screen: everything else.
#include <3ds.h>
#include <citro2d.h>
#include <math.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#define VERSION "v5 - 23 Oct 2026"
#ifdef HOSTTEST
#define LOG(...) fprintf(stderr, __VA_ARGS__)
#else
#define LOG(...) ((void)0)
#endif
#define TW 400
#define TH 240
#define BW 320
#define BH 240
#define WALLT 6.0f
#define DT (1.0f / 60.0f)
#define PI 3.14159265f

// ------------------------------------------------------------------ colours
#define RGBA(r, g, b, a) C2D_Color32(r, g, b, a)
static u32 cInk, cStone, cStone2, cLine, cBone, cMuted, cGilt, cGiltHi, cGilt2, cGilt3, cEmber, cEmberHi, cEmber2, cAcid, cGrace, cGraceHi, cGrace2;
static void initColours(void) {
	cInk = RGBA(11, 13, 20, 255);    cStone = RGBA(23, 26, 38, 255);  cStone2 = RGBA(34, 39, 56, 255);
	cLine = RGBA(52, 58, 82, 255);   cBone = RGBA(243, 236, 217, 255); cMuted = RGBA(154, 157, 178, 255);
	cGilt = RGBA(227, 178, 87, 255); cGiltHi = RGBA(255, 240, 194, 255); cGilt2 = RGBA(168, 121, 44, 255); cGilt3 = RGBA(94, 63, 18, 255);
	cEmber = RGBA(229, 83, 63, 255); cEmberHi = RGBA(255, 154, 122, 255); cEmber2 = RGBA(125, 34, 25, 255);
	cAcid = RGBA(162, 124, 240, 255);
	cGrace = RGBA(246, 196, 69, 255); cGraceHi = RGBA(255, 240, 166, 255); cGrace2 = RGBA(122, 88, 16, 255);
}
static u32 alpha(u32 c, float a) { u32 al = (u32)(fmaxf(0, fminf(1, a)) * 255); return (c & 0x00FFFFFF) | (al << 24); }

// ------------------------------------------------------------------ helpers
static float frand(float a, float b) { return a + (b - a) * (rand() / (float)RAND_MAX); }
static float clampf(float v, float a, float b) { return v < a ? a : v > b ? b : v; }
static float dist(float ax, float ay, float bx, float by) { return sqrtf((ax - bx) * (ax - bx) + (ay - by) * (ay - by)); }

// ------------------------------------------------------------------ text
static C2D_TextBuf tbuf;
static void text(const char *s, float x, float y, float sz, u32 col, int align) {
	C2D_Text t; C2D_TextParse(&t, tbuf, s); C2D_TextOptimize(&t);
	C2D_DrawText(&t, C2D_WithColor | align, x, y, 0, sz, sz, col);
}
static void textWrap(const char *s, float x, float y, float sz, u32 col, int align, float w) {
	C2D_Text t; C2D_TextParse(&t, tbuf, s); C2D_TextOptimize(&t);
	C2D_DrawText(&t, C2D_WithColor | C2D_WordWrap | align, x, y, 0, sz, sz, col, w);
}

// ------------------------------------------------------------------ sprites (romfs:/gfx/sprites.t3x: 11 blessing icons, then the grace star)
#define SPR_GRACE 11
static C2D_SpriteSheet sheet;
static void icon(int i, float cx, float cy, float size, float a) {
	if (!sheet) return;
	C2D_Image img = C2D_SpriteSheetGetImage(sheet, i);
	float sc = size / 32.0f;
	if (a >= 0.999f) C2D_DrawImageAt(img, cx - size / 2, cy - size / 2, 0, NULL, sc, sc);
	else { C2D_ImageTint t; C2D_AlphaImageTint(&t, a); C2D_DrawImageAt(img, cx - size / 2, cy - size / 2, 0, &t, sc, sc); }
}

// ------------------------------------------------------------------ data: blessings
enum { T_L, T_R, T_C };
typedef struct { const char *id, *name, *shortName, *sum, *has, *loss; int tier; } Buff;
#define NB 11
static const Buff BUFFS[NB] = {
	{"fire", "Ceaseless Fire", "Fire", "Fire only while standing still", "Shoots on the move", "Shoots only when still", T_L},
	{"aim", "True Aim", "Aim", "Aim where you face", "Auto-aims", "Aims where you face", T_L},
	{"float", "Featherstep", "Feather", "Hazards will hurt you", "Hazards ignore you", "Hazards hurt", T_L},
	{"homing", "Seeker Shots", "Seeker", "Your shots will fly straight", "Shots curve in", "Shots fly straight", T_R},
	{"aegis", "Aegis", "Aegis", "Every hit will land on you", "3-hit shield", "No shield", T_R},
	{"slow", "Stillwater", "Still", "Enemy shots will fly twice as fast", "Slow enemy shots", "Full-speed shots", T_R},
	{"ward", "Premonition", "Omen", "Attacks will come with less warning", "Long warnings", "Short warnings", T_R},
	{"twin", "Trident", "Trident", "Fire one shot at a time", "3 shots", "1 shot", T_C},
	{"might", "Might", "Might", "Your damage will be halved", "2x damage", "1x damage", T_C},
	{"haste", "Quickdraw", "Quick", "Fire more slowly", "Fast fire", "Normal fire", T_C},
	{"vigor", "Vigor", "Vigor", "Your max health will be halved", "200 HP + regen", "100 HP, no regen", T_C},
};
enum { B_FIRE, B_AIM, B_FLOAT, B_HOMING, B_AEGIS, B_SLOW, B_WARD, B_TWIN, B_MIGHT, B_HASTE, B_VIGOR };
static const char *TIER_NAME[3] = {"Legendary", "Rare", "Common"};
static const int TIER_GAIN[3] = {110, 60, 30};
static const float TIER_UP[3] = {1.0f, 0.35f, 0.12f};

// balance
#define G_START 120.0f
#define G_CAP 130.0f
#define G_BLEED 20.0f
#define G_BASE 0.6f
#define SPARK_V 8

// ------------------------------------------------------------------ data: words
typedef struct { const char *t, *a; } Quote;
static const Quote QUOTES[] = {
	{"It is not the man who has too little, but the man who craves more, that is poor.", "Seneca"},
	{"Very little is needed to make a happy life; it is all within yourself, in your way of thinking.", "Marcus Aurelius"},
	{"A man is rich in proportion to the number of things which he can afford to let alone.", "Henry David Thoreau"},
	{"Our life is frittered away by detail. Simplify, simplify.", "Henry David Thoreau"},
	{"In the pursuit of learning, every day something is acquired. In the pursuit of the Tao, every day something is dropped.", "Lao Tzu"},
	{"Mastering others is strength. Mastering yourself is true power.", "Lao Tzu"},
	{"Perfection is achieved, not when there is nothing more to add, but when there is nothing left to take away.", "Antoine de Saint-Exupery"},
	{"One must imagine Sisyphus happy.", "Albert Camus"},
	{"He who has a why to live can bear almost any how.", "Friedrich Nietzsche"},
	{"If you gaze long into an abyss, the abyss also gazes into you.", "Friedrich Nietzsche"},
	{"Man is condemned to be free.", "Jean-Paul Sartre"},
	{"Nothing is enough for the man to whom enough is too little.", "Epicurus"},
	{"No man is free who is not master of himself.", "Epictetus"},
	{"Make the best use of what is in your power, and take the rest as it happens.", "Epictetus"},
	{"He is a wise man who does not grieve for the things which he has not, but rejoices for those which he has.", "Epictetus"},
	{"Freedom is not procured by a full enjoyment of what is desired, but by controlling the desire.", "Epictetus"},
	{"We suffer more often in imagination than in reality.", "Seneca"},
	{"Waste no more time arguing about what a good man should be. Be one.", "Marcus Aurelius"},
	{"Let go, or be dragged.", "Zen proverb"},
	{"Have nothing in your houses that you do not know to be useful, or believe to be beautiful.", "William Morris"},
	{"Discipline is the bridge between goals and accomplishment.", "Jim Rohn"},
	{"Everything can be taken from a man but one thing: the last of the human freedoms, to choose one's attitude.", "Viktor Frankl"},
};
#define NQ (int)(sizeof(QUOTES) / sizeof(QUOTES[0]))
static const Quote DEATH_QUOTES[] = {
	{"Death is nothing to us, since when we are, death has not come, and when death has come, we are not.", "Epicurus"},
	{"To philosophize is to learn to die.", "Michel de Montaigne"},
	{"Cowards die many times before their deaths; the valiant never taste of death but once.", "William Shakespeare"},
	{"All that lives must die, passing through nature to eternity.", "William Shakespeare"},
	{"Because I could not stop for Death, he kindly stopped for me.", "Emily Dickinson"},
	{"Death, be not proud, though some have called thee mighty and dreadful, for thou art not so.", "John Donne"},
	{"No one knows whether death, which men fear as the greatest evil, may not be the greatest good.", "Socrates"},
	{"Do every act of your life as though it were the very last act of your life.", "Marcus Aurelius"},
	{"While I thought that I was learning how to live, I have been learning how to die.", "Leonardo da Vinci"},
	{"Teach me to live, that I may dread the grave as little as my bed.", "Thomas Ken"},
};
#define NDQ (int)(sizeof(DEATH_QUOTES) / sizeof(DEATH_QUOTES[0]))
static const char *DEATH_MUSINGS[] = {
	"So this is where the floor ends.",
	"I held on to too much, or too little. Hard to tell from down here.",
	"The light goes out the same way it came: without asking.",
	"Even falling, I'm still giving something up.",
	"Rest, then. The wardens will wait.",
	"Strange. Dying is the first thing here I didn't choose.",
	"The tower doesn't notice. It never did.",
};
#define NDM (int)(sizeof(DEATH_MUSINGS) / sizeof(DEATH_MUSINGS[0]))
static const char *STORY1[] = {"They gave me everything before I asked for it.", "Fire that never stops. Aim that never misses. A shield. A promise.", "And a price: each warden takes something back.", "Fine. I'll give it up one piece at a time, and see what's left of me.", NULL};
static const char *STORY2[] = {"I stood on the last floor with nothing, and I won.", "It felt like the truest thing I've ever done.", "Then the light came back. All of it. Every blessing, returned.", "The floors are darker now. The wardens remember me.", "I suppose I'll have to give it all up again.", NULL};
static const char *STORY3[] = {"Twice now. Everything given, everything returned.", "The enemies are the same. Only harder. Like the same day, repeating louder.", "I told myself the giving up was the point.", "But if it is always given back, what did I ever really give?", "Maybe I'm not climbing. Maybe I'm circling.", NULL};
static const char *STORY4[] = {"Three times purified. Three times restored.", "My hands move before I decide to move them.", "The wardens don't hate me. They're waiting, like I am.", "Every victory is only the door to the next floor.", "There is no top to this tower. There never was.", "One last time, then. Or so I keep saying.", NULL};
static const char *STORYEND[] = {"Pure again. And again the light begins to gather.", "I see it now. The game doesn't end when you win.", "It ends when you stop.", "Not in defeat. Not in triumph. Just setting it down.", NULL};
static const char **STORIES[5] = {NULL, STORY1, STORY2, STORY3, STORY4};
static const char *FINAL_QUOTE = "One day we say \"One more time.\" And we are right.";
static const char *ROMAN[5] = {"", "I", "II", "III", "IV"};

// shuffled decks so quotes don't repeat until all are seen
typedef struct { int idx[32], n, size; } Deck;
static int deckDraw(Deck *d, int size) {
	if (d->n <= 0 || d->size != size) {
		d->size = size; d->n = size;
		for (int i = 0; i < size; i++) d->idx[i] = i;
		for (int i = size - 1; i > 0; i--) { int j = rand() % (i + 1), t = d->idx[i]; d->idx[i] = d->idx[j]; d->idx[j] = t; }
	}
	return d->idx[--d->n];
}
static Deck dQuote, dDeath, dMusing;

// ------------------------------------------------------------------ data: waves (landscape layouts)
enum { E_GRUNT, E_ARCHER, E_MORTAR, E_CHARGER, E_BOSS };
typedef struct { float x, y, w, h, ax, ay, sp; } WallDef;
typedef struct { int en[10], nen; float spikes[4][2]; int nsp; WallDef walls[2]; int nwalls; int boss; } WaveDef;
#define SPIKE 34.0f
static const WaveDef WAVES[4] = {
	{{E_GRUNT, E_GRUNT, E_GRUNT, E_GRUNT, E_ARCHER, E_ARCHER}, 6, {{70, 96}, {296, 96}}, 2, {{165, 160, 70, 8, 95, 0, 0.55f}}, 1, 0},
	{{E_GRUNT, E_GRUNT, E_GRUNT, E_ARCHER, E_ARCHER, E_MORTAR, E_MORTAR}, 7, {{183, 46}, {64, 150}, {302, 150}}, 3, {{125, 80, 8, 46, 45, 0, 0.7f}, {267, 118, 8, 46, -45, 0, 0.7f}}, 2, 0},
	{{E_GRUNT, E_GRUNT, E_CHARGER, E_CHARGER, E_ARCHER, E_ARCHER, E_MORTAR}, 7, {{40, 70}, {326, 70}, {183, 172}}, 3, {{150, 96, 50, 8, 85, 0, 0.5f}, {200, 150, 50, 8, -85, 0, 0.5f}}, 2, 0},
	{{E_BOSS}, 1, {{26, 160}, {340, 160}, {26, 60}, {340, 60}}, 4, {{110, 128, 44, 8, 0, 34, 0.65f}, {246, 128, 44, 8, 0, -34, 0.65f}}, 2, 1},
};
static const float E_HP[5] = {30, 24, 38, 44, 900};
static const float E_R[5] = {7, 7, 8, 8, 20};
static const float E_TOUCH[5] = {12, 8, 8, 18, 20};

// ------------------------------------------------------------------ state
typedef struct { float x, y, vx, vy, dmg, life; int on; } Bullet;
typedef struct { float x, y, vx, vy, dmg, r; int on; } EBullet;
typedef struct {
	int type, on, state, pat; float x, y, vx, vy, r, hp, max, touch, spawn, flash, seed, cd, st, dir, dx, dy, wind, spin;
} Enemy;
typedef struct { float x, y, life, max, v; int heart, on; } Pickup;
typedef struct { float fx, fy, tx, ty, t, T, r; int on; } Shell;
typedef struct { float x, y, r, life; int on; } Pool;
typedef struct { float x, y, vx, vy, life, max, s; u32 c; int on; } Part;
typedef struct { float x, y, w, h, bx, by, ax, ay, sp, ph; } Wall;
typedef struct { float x, y, off; } Spike;
typedef struct { float x, y, v, life; u32 c; int on; } Num;
typedef struct { int floor; float t, spent; int gave, gain; } Split;

#define MAXB 96
#define MAXEB 220
#define MAXE 40
#define MAXP 400
#define MAXPK 12
#define MAXSH 16
#define MAXPL 16
#define MAXN 24

enum { S_TITLE, S_PLAY, S_ALTAR, S_STORY, S_DEAD, S_PAUSE };
enum { PH_WAVE, PH_BETWEEN, PH_CLEARED, PH_DEAD };

static struct {
	int demo, tier, banked, floor, wave, phase, kills, defy;
	float time, nextT, grace, glory, ft, fspent, sparkT, heartT, hs, flash, shake, bannerT;
	u32 flashC; char banner[64], bannerSub[96];
	int held[NB];
	struct { float x, y, r, hp, vx, vy, fx, fy, cd, shield, shieldT, inv, ghost; int moving; } p;
	Bullet pb[MAXB]; EBullet eb[MAXEB]; Enemy en[MAXE]; Pickup pk[MAXPK]; Shell sh[MAXSH]; Pool pl[MAXPL]; Part fx[MAXP]; Num nums[MAXN];
	Wall walls[2]; int nwalls; Spike spikes[4]; int nspikes;
	int empty, graceOut;
	float featherT, featherCd;   // Featherstep saved you: show it
	Split splits[16]; int nsplits;
} G;
static int state = S_TITLE, prevState = S_PLAY;
// pickups fly from the arena down to their counter on the touch screen.
// One combined coordinate space: the touch screen sits below the top screen, 40 px in from its left edge.
typedef struct { float x0, y0, t, delay; int heart, on; } Fly;
#define MAXFLY 32
static Fly flies[MAXFLY];
static float gracePulse = 0, hpPulse = 0;
#define GRACE_TX (40 + 172.0f)
#define GRACE_TY (240 + 24.0f)
#define HP_TX (40 + 22.0f)
#define HP_TY (240 + 24.0f)
static void spawnFlies(float x, float y, int heart) {
	for (int k = 0, n = 0; k < MAXFLY && n < 5; k++) if (!flies[k].on) { flies[k] = (Fly){x + frand(-6, 6), y + frand(-6, 6), 0, n * 0.05f, heart, 1}; n++; }
}
static void flyPos(Fly *f, float *x, float *y) {
	float t = clampf(f->t, 0, 1), e = t * t * (3 - 2 * t);
	float tx = f->heart ? HP_TX : GRACE_TX, ty = f->heart ? HP_TY : GRACE_TY;
	float mx = (f->x0 + tx) / 2 + (f->heart ? -40 : 40), my = f->y0 - 30;
	float u = 1 - e; *x = u * u * f->x0 + 2 * u * e * mx + e * e * tx; *y = u * u * f->y0 + 2 * u * e * my + e * e * ty;
}
static void updateFlies(float dt) {
	for (int k = 0; k < MAXFLY; k++) { Fly *f = &flies[k]; if (!f->on) continue; if (f->delay > 0) { f->delay -= dt; continue; } f->t += dt / 0.6f;
		if (f->t >= 1) { f->on = 0; if (f->heart) hpPulse = 0.3f; else gracePulse = 0.3f; } }
	if (gracePulse > 0) gracePulse -= dt;
	if (hpPulse > 0) hpPulse -= dt;
}
static void heartShape(float x, float y, float r, u32 c);
static void drawFlies(int bottom) {
	for (int k = 0; k < MAXFLY; k++) {
		Fly *f = &flies[k]; if (!f->on || f->delay > 0) continue;
		float x, y; flyPos(f, &x, &y);
		float sz = 1 + 0.4f * sinf(clampf(f->t, 0, 1) * PI);
		if (!bottom && y < 240) { if (f->heart) { C2D_DrawCircleSolid(x, y, 0, 8 * sz, RGBA(229, 83, 63, 70)); heartShape(x, y, 6 * sz, RGBA(255, 120, 100, 255)); } else icon(SPR_GRACE, x, y, 16 * sz, 1); }
		if (bottom && y >= 240 - 8) { if (f->heart) { C2D_DrawCircleSolid(x - 40, y - 240, 0, 8 * sz, RGBA(229, 83, 63, 70)); heartShape(x - 40, y - 240, 6 * sz, RGBA(255, 120, 100, 255)); } else icon(SPR_GRACE, x - 40, y - 240, 16 * sz, 1); }
	}
}
static int best = 0;
static char statusMsg[160]; static float statusT = 0;

// ------------------------------------------------------------------ audio (pre-rendered, played as buffers)
#define SR 22050
typedef struct { s16 *data; u32 n; } Snd;
enum { SND_SHOOT, SND_HIT, SND_KILL, SND_HURT, SND_SHIELD, SND_CHIME, SND_HEAL, SND_GONG, SND_SHATTER, SND_TICK, SND_DEATH, SND_ASCEND, SND_EBOLT, SND_NAV, SND_PICK, NSND };
static Snd snds[NSND]; static Snd music;
// channel 0 is music; 1..NCH-1 play effects. A buffer is only ever re-queued once the DSP has finished with it.
#define NCH 16
static int audioOK = 0, sfxCh = 1;
static ndspWaveBuf wbMusic, wbSfx[NCH];
static float sfxLast[NSND];

static float midi(float m) { return 440.0f * powf(2.0f, (m - 69) / 12.0f); }
static float envAD(float t, float a, float d) { return t < a ? t / a : expf(-(t - a) / d); }
static void render(Snd *s, float secs, float (*fn)(float t, int i)) {
	s->n = (u32)(secs * SR); s->data = linearAlloc(s->n * 2);
	if (!s->data) { s->n = 0; return; }
	for (u32 i = 0; i < s->n; i++) {
		float t = i / (float)SR, v = fn(t, i);
		float fade = 1.0f; if (t > secs - 0.02f) fade = (secs - t) / 0.02f;
		v = clampf(v * fade, -1, 1); s->data[i] = (s16)(v * 32767);
	}
	DSP_FlushDataCache(s->data, s->n * 2);
}
static unsigned noiseState = 1234567;
static float noiz(void) { noiseState = noiseState * 1103515245u + 12345u; return ((noiseState >> 9) & 0xFFFF) / 32768.0f - 1.0f; }
static float lp1 = 0;
static float f_shoot(float t, int i) { (void)i; float f = 1250 - 6000 * t; return 0.12f * envAD(t, 0.008f, 0.02f) * sinf(2 * PI * f * t); }
static float f_hit(float t, int i) { (void)i; lp1 += (noiz() - lp1) * 0.5f; return 0.18f * envAD(t, 0.008f, 0.015f) * lp1; }
static float f_kill(float t, int i) { (void)i; float f = 380 * expf(-t * 12); lp1 += (noiz() - lp1) * 0.25f; return envAD(t, 0.008f, 0.06f) * (0.18f * sinf(2 * PI * f * t * 3) + 0.15f * lp1); }
static float f_hurt(float t, int i) { (void)i; float f = 220 * expf(-t * 5); lp1 += (noiz() - lp1) * 0.15f; return envAD(t, 0.008f, 0.12f) * (0.25f * sinf(2 * PI * f * t * 2) + 0.2f * lp1); }
static float f_shield(float t, int i) { (void)i; return envAD(t, 0.01f, 0.25f) * (0.18f * sinf(2 * PI * 1568 * t) + 0.08f * sinf(2 * PI * 2350 * t)); }
static float f_chime(float t, int i) { (void)i; float a = envAD(t, 0.01f, 0.2f) * 0.16f * sinf(2 * PI * midi(88) * t); float b = t > 0.06f ? envAD(t - 0.06f, 0.01f, 0.25f) * 0.14f * sinf(2 * PI * midi(95) * t) : 0; return a + b; }
static float f_heal(float t, int i) { (void)i; float v = 0; float ms[3] = {76, 81, 84}; for (int k = 0; k < 3; k++) { float tt = t - k * 0.05f; if (tt > 0) v += envAD(tt, 0.01f, 0.15f) * 0.1f * sinf(2 * PI * midi(ms[k]) * tt); } return v; }
static float f_gong(float t, int i) { (void)i; return envAD(t, 0.012f, 0.9f) * (0.3f * sinf(2 * PI * 55 * t) + 0.12f * sinf(2 * PI * 81.5f * t) + 0.06f * sinf(2 * PI * 138 * t)); }
static float f_shatter(float t, int i) { (void)i; lp1 += (noiz() - lp1) * 0.7f; float v = envAD(t, 0.008f, 0.25f) * 0.12f * (noiz() - lp1); for (int k = 0; k < 5; k++) v += envAD(t, 0.01f, 0.3f) * 0.03f * sinf(2 * PI * (2200 + k * 610) * t); v += envAD(t, 0.01f, 0.6f) * 0.12f * sinf(2 * PI * midi(74 - t * 20) * t); return v; }
static float f_tick(float t, int i) { (void)i; return envAD(t, 0.008f, 0.02f) * 0.12f * sinf(2 * PI * 1800 * t); }
static float f_death(float t, int i) { (void)i; float f = 300 * expf(-t * 1.8f); lp1 += (noiz() - lp1) * 0.08f; return envAD(t, 0.01f, 0.7f) * (0.2f * sinf(2 * PI * f * t) + 0.2f * lp1); }
static float f_ascend(float t, int i) { (void)i; float v = 0; float ms[5] = {62, 65, 69, 74, 77}; for (int k = 0; k < 5; k++) { float tt = t - k * 0.09f; if (tt > 0) v += envAD(tt, 0.02f, 0.8f) * 0.07f * sinf(2 * PI * midi(ms[k]) * tt); } return v + envAD(t, 0.01f, 0.6f) * 0.2f * sinf(2 * PI * 52 * t); }
static float f_nav(float t, int i) { (void)i; float f = 880 + 220 * t * 10; return 0.13f * envAD(t, 0.008f, 0.035f) * (sinf(2 * PI * f * t) + 0.3f * sinf(4 * PI * f * t)); }
static float f_pick(float t, int i) { (void)i; float a = envAD(t, 0.008f, 0.08f) * 0.12f * sinf(2 * PI * midi(83) * t); float b = t > 0.05f ? envAD(t - 0.05f, 0.008f, 0.12f) * 0.11f * sinf(2 * PI * midi(90) * t) : 0; return a + b; }
static float f_ebolt(float t, int i) { (void)i; float f = 720 - 3000 * t; return 0.06f * envAD(t, 0.008f, 0.03f) * sinf(2 * PI * f * t); }
// soft D-minor pad with a slow bell line, 16 s loop
static const float PROG[4][3] = {{50, 53, 57}, {46, 50, 53}, {43, 46, 50}, {45, 49, 52}};
static const float MEL[8] = {74, 72, 69, 70, 77, 76, 74, 73};
static float f_music(float t, int i) {
	(void)i; int bar = (int)(t / 4.0f) % 4; float tb = fmodf(t, 4.0f), v = 0;
	float pe = envAD(tb, 1.2f, 6.0f) * (tb > 3.6f ? (4.0f - tb) / 0.4f * 0.6f + 0.4f : 1.0f);
	for (int k = 0; k < 3; k++) { float f = midi(PROG[bar][k]); v += 0.035f * pe * (sinf(2 * PI * f * t) + 0.5f * sinf(2 * PI * f * 1.003f * t)); }
	v += 0.05f * envAD(tb, 0.05f, 1.5f) * sinf(2 * PI * midi(PROG[bar][0] - 12) * t);
	int step = (int)(t / 2.0f) % 8; float ts = fmodf(t, 2.0f);
	v += 0.05f * envAD(ts, 0.01f, 0.9f) * sinf(2 * PI * midi(MEL[step]) * t);
	return v;
}
static void chnSetup(int ch) {
	ndspChnReset(ch); ndspChnSetInterp(ch, NDSP_INTERP_LINEAR); ndspChnSetRate(ch, SR); ndspChnSetFormat(ch, NDSP_FORMAT_MONO_PCM16);
	float mix[12] = {0}; mix[0] = mix[1] = ch == 0 ? 0.55f : 0.8f; ndspChnSetMix(ch, mix);
}
static void audioInit(void) {
	if (R_FAILED(ndspInit())) return;
	audioOK = 1;
	ndspSetOutputMode(NDSP_OUTPUT_STEREO);
	for (int ch = 0; ch < NCH; ch++) chnSetup(ch);
	render(&snds[SND_SHOOT], 0.07f, f_shoot); render(&snds[SND_HIT], 0.06f, f_hit); render(&snds[SND_KILL], 0.25f, f_kill);
	render(&snds[SND_HURT], 0.4f, f_hurt); render(&snds[SND_SHIELD], 0.6f, f_shield); render(&snds[SND_CHIME], 0.6f, f_chime);
	render(&snds[SND_HEAL], 0.5f, f_heal); render(&snds[SND_GONG], 2.4f, f_gong); render(&snds[SND_SHATTER], 1.0f, f_shatter);
	render(&snds[SND_TICK], 0.06f, f_tick); render(&snds[SND_DEATH], 1.6f, f_death); render(&snds[SND_ASCEND], 2.2f, f_ascend);
	render(&snds[SND_EBOLT], 0.08f, f_ebolt); render(&snds[SND_NAV], 0.09f, f_nav); render(&snds[SND_PICK], 0.3f, f_pick);
	render(&music, 16.0f, f_music);
	if (music.n) {
		memset(&wbMusic, 0, sizeof(wbMusic)); wbMusic.data_vaddr = music.data; wbMusic.nsamples = music.n; wbMusic.looping = true;
		ndspChnWaveBufAdd(0, &wbMusic);
	}
}
static void sfx(int id) {
	int ui = id == SND_NAV || id == SND_PICK || id == SND_TICK;
	if (!audioOK || (G.demo && !ui) || !snds[id].n) return;
	float now = osGetTime() / 1000.0f;
	if (id <= SND_HIT || id == SND_EBOLT || id == SND_TICK) { if (now - sfxLast[id] < 0.06f && now >= sfxLast[id]) return; }
	sfxLast[id] = now;
	// find a channel whose last buffer the DSP has finished with
	int ch = -1;
	for (int k = 0; k < NCH - 1; k++) {
		int c = 1 + (sfxCh - 1 + k) % (NCH - 1);
		if (wbSfx[c].status == NDSP_WBUF_FREE || wbSfx[c].status == NDSP_WBUF_DONE) { ch = c; break; }
	}
	if (ch < 0) return;   // all 15 busy (never seen past 6): skip rather than clear a channel mid-play, which can jam it
	sfxCh = ch % (NCH - 1) + 1;
	memset(&wbSfx[ch], 0, sizeof(ndspWaveBuf)); wbSfx[ch].data_vaddr = snds[id].data; wbSfx[ch].nsamples = snds[id].n;
	ndspChnWaveBufAdd(ch, &wbSfx[ch]);
}
static void audioExit(void) {
	if (!audioOK) return;
	ndspExit();
	for (int i = 0; i < NSND; i++) if (snds[i].data) linearFree(snds[i].data);
	if (music.data) linearFree(music.data);
}

// ------------------------------------------------------------------ save
#define SAVE_PATH "sdmc:/3ds/grace3ds.sav"
static void loadBest(void) { FILE *f = fopen(SAVE_PATH, "r"); if (f) { if (fscanf(f, "%d", &best) != 1) best = 0; fclose(f); } }
static void saveBest(void) { FILE *f = fopen(SAVE_PATH, "w"); if (f) { fprintf(f, "%d\n", best); fclose(f); } }

// ------------------------------------------------------------------ rules
static int heldCount(void) { int n = 0; for (int i = 0; i < NB; i++) n += G.held[i]; return n; }
static int has(int b) { return G.held[b]; }
static float tierK(void) { return (float)(G.tier - 1); }
static float mulTaken(void) { return 1 + 0.3f * tierK(); }
static float hpMul(void) { return 1 + 0.5f * tierK(); }
static float shotMul(void) { return (has(B_SLOW) ? 0.5f : 1) * (1 + 0.12f * tierK()); }
static float rateMul(void) { return 1 + 0.18f * tierK(); }
static float tele(void) { return has(B_WARD) ? 1.8f : 1; }
static float maxHp(void) { return has(B_VIGOR) ? 200 : 100; }
static float rateIf(int removed, int defy) {
	float up = 0; for (int i = 0; i < NB; i++) if (G.held[i] && i != removed) up += TIER_UP[BUFFS[i].tier];
	return (G_BASE + up) * powf(2, defy);
}
static float drainRate(void) { return rateIf(-1, G.defy); }

static void status(const char *m) { snprintf(statusMsg, sizeof statusMsg, "%s", m); statusT = 3.0f; }
static void burst(float x, float y, u32 c, int n, float sp) {
	for (int k = 0; k < n; k++) for (int i = 0; i < MAXP; i++) if (!G.fx[i].on) {
		float a = frand(0, 2 * PI), s = frand(sp * 0.3f, sp);
		G.fx[i] = (Part){x, y, cosf(a) * s, sinf(a) * s, frand(0.25f, 0.6f), 0.6f, frand(1.2f, 2.4f), c, 1}; break;
	}
}
static void num(float x, float y, float v, u32 c) { for (int i = 0; i < MAXN; i++) if (!G.nums[i].on) { G.nums[i] = (Num){x + frand(-4, 4), y, v, 0.6f, c, 1}; return; } }
static void addGrace(float v) { G.grace += v; if (G.grace > G_CAP) { G.glory += G.grace - G_CAP; G.grace = G_CAP; } }

static void moveWalls(void) {
	for (int i = 0; i < G.nwalls; i++) { Wall *w = &G.walls[i]; float k = sinf(G.time * w->sp + w->ph); w->x = w->bx + k * w->ax; w->y = w->by + k * w->ay; }
}
static int inWall(float x, float y, float pad) {
	for (int i = 0; i < G.nwalls; i++) { Wall *w = &G.walls[i]; if (x > w->x - pad && x < w->x + w->w + pad && y > w->y - pad && y < w->y + w->h + pad) return 1; }
	return 0;
}
static void pushOut(float *x, float *y, float r) {
	for (int i = 0; i < G.nwalls; i++) {
		Wall *w = &G.walls[i];
		float cx = clampf(*x, w->x, w->x + w->w), cy = clampf(*y, w->y, w->y + w->h), dx = *x - cx, dy = *y - cy, d = sqrtf(dx * dx + dy * dy);
		if (d >= r) continue;
		if (d < 0.01f) {
			float l = *x - w->x, rr = w->x + w->w - *x, t = *y - w->y, b = w->y + w->h - *y, m = fminf(fminf(l, rr), fminf(t, b));
			if (m == l) *x = w->x - r; else if (m == rr) *x = w->x + w->w + r; else if (m == t) *y = w->y - r; else *y = w->y + w->h + r;
		} else { *x = cx + dx / d * r; *y = cy + dy / d * r; }
	}
}
static int spikePhase(Spike *s) { float ph = fmodf(G.time + s->off, 3.2f); return ph >= 2.0f ? 2 : ph >= 1.4f ? 1 : 0; }
static int inSpike(float x, float y, Spike *s, float pad) { return x > s->x - pad && x < s->x + SPIKE + pad && y > s->y - pad && y < s->y + SPIKE + pad; }

static Enemy *nearest(float x, float y, float maxD) {
	Enemy *b = NULL; float bd = maxD;
	for (int i = 0; i < MAXE; i++) { Enemy *e = &G.en[i]; if (!e->on || e->spawn > 0) continue; float d = dist(e->x, e->y, x, y); if (d < bd) { bd = d; b = e; } }
	return b;
}
static void spawnEnemy(int type, int k, float ax, float ay, int at) {
	int slot = -1; for (int i = 0; i < MAXE; i++) if (!G.en[i].on) { slot = i; break; }
	if (slot < 0) return;
	float x = 0, y = 0;
	if (at) { x = ax; y = ay; }
	else if (type == E_BOSS) { x = TW / 2; y = 62; }
	else {
		int bottom = k % 3 == 1, tries = 0, bad;
		do {
			x = frand(28, TW - 28); y = bottom ? frand(TH * 0.74f, TH - 22) : frand(24, TH * 0.42f); tries++; bad = 0;
			for (int s = 0; s < G.nspikes; s++) if (inSpike(x, y, &G.spikes[s], 12)) bad = 1;
			for (int i = 0; i < MAXE; i++) if (G.en[i].on && dist(G.en[i].x, G.en[i].y, x, y) < 24) bad = 1;
			if (inWall(x, y, 14) || dist(G.p.x, G.p.y, x, y) < 95) bad = 1;
		} while (bad && tries < 40);
	}
	Enemy *e = &G.en[slot]; memset(e, 0, sizeof *e);
	e->on = 1; e->type = type; e->x = x; e->y = y; e->r = E_R[type]; e->hp = e->max = E_HP[type] * hpMul(); e->touch = E_TOUCH[type];
	e->spawn = 0.7f + k * 0.12f; e->seed = frand(0, 10); e->cd = frand(0.8f, 2.2f); e->dir = rand() % 2 ? 1 : -1;
}
static void startWave(int i) {
	G.wave = i; G.phase = PH_WAVE;
	const WaveDef *w = &WAVES[i];
	G.nspikes = w->nsp; for (int s = 0; s < w->nsp; s++) G.spikes[s] = (Spike){w->spikes[s][0], w->spikes[s][1], s * 0.8f};
	G.nwalls = w->nwalls; for (int k = 0; k < w->nwalls; k++) { const WallDef *d = &w->walls[k]; G.walls[k] = (Wall){d->x, d->y, d->w, d->h, d->x, d->y, d->ax, d->ay, d->sp, k * 1.3f}; }
	memset(G.pl, 0, sizeof G.pl); memset(G.sh, 0, sizeof G.sh); memset(G.eb, 0, sizeof G.eb); memset(G.pb, 0, sizeof G.pb);
	for (int k = 0; k < w->nen; k++) spawnEnemy(w->en[k], k, 0, 0, 0);
	int pure = heldCount() == 0 && i == 0;
	snprintf(G.banner, sizeof G.banner, "%s", w->boss ? "The Warden" : pure ? "The Pure Floor" : "");
	G.bannerSub[0] = 0; G.bannerT = G.banner[0] ? 1.8f : 0;
	sfx(w->boss ? SND_GONG : SND_TICK);
}
static void newRun(int demo, int tier, int banked, int kills) {
	memset(&G, 0, sizeof G); memset(flies, 0, sizeof flies);
	G.demo = demo; G.tier = tier; G.banked = banked; G.kills = kills; G.floor = 1; G.grace = G_START; G.sparkT = 1.5f; G.heartT = 14;
	for (int i = 0; i < NB; i++) G.held[i] = 1;
	G.p.x = TW / 2; G.p.y = TH - 40; G.p.r = 7; G.p.hp = 200; G.p.fy = -1; G.p.shield = 3; G.p.shieldT = 9;
}

static void featherSave(void) {
	if (G.featherCd > 0) { if (G.featherT < 0.6f) G.featherT = 0.6f; return; }
	G.featherT = 1.1f; G.featherCd = 0.9f;
	burst(G.p.x, G.p.y + 6, cBone, 8, 50); sfx(SND_NAV);
}
static void die(void);
static void hurt(float d) {
	if (G.p.inv > 0 || G.phase == PH_DEAD) return;
	if (has(B_AEGIS) && G.p.shield >= 1) { G.p.shield -= 1; G.p.shieldT = 0; G.p.inv = 0.35f; burst(G.p.x, G.p.y, cGilt, 12, 110); sfx(SND_SHIELD); return; }
	float dmg = d * mulTaken();
	G.p.hp -= dmg; G.p.inv = 0.7f; G.p.shieldT = 0; num(G.p.x, G.p.y - 12, dmg, cEmber);
	G.shake = 5; G.flash = 0.35f; G.flashC = cEmber; G.hs = 0.06f;
	burst(G.p.x, G.p.y, cEmber, 12, 90); sfx(SND_HURT);
	if (G.p.hp <= 0) { G.p.hp = 0; die(); }
}
static void eshot(float x, float y, float dx, float dy, float speed, float dmg, float r) {
	float l = sqrtf(dx * dx + dy * dy); if (l < 0.001f) l = 1;
	float s = speed * shotMul();
	for (int i = 0; i < MAXEB; i++) if (!G.eb[i].on) { G.eb[i] = (EBullet){x, y, dx / l * s, dy / l * s, dmg, r, 1}; return; }
}
static void lob(float fx, float fy, float tx, float ty) {
	for (int i = 0; i < MAXSH; i++) if (!G.sh[i].on) { G.sh[i] = (Shell){fx, fy, clampf(tx, 16, TW - 16), clampf(ty, 16, TH - 16), 0, 1.1f * tele(), 25, 1}; return; }
}

// demo autopilot: steers the attract-mode hero on the title screen
static void autopilot(float *ox, float *oy) {
	float ax = 0, ay = 0; Enemy *n = nearest(G.p.x, G.p.y, 1e9f);
	if (n) { float dx = n->x - G.p.x, dy = n->y - G.p.y, d = sqrtf(dx * dx + dy * dy) + 0.001f, want = n->type == E_BOSS ? 150 : 110, k = clampf((d - want) / 70, -1.5f, 0.8f); ax += dx / d * k; ay += dy / d * k; }
	for (int i = 0; i < MAXE; i++) { Enemy *e = &G.en[i]; if (!e->on || e->spawn > 0) continue; float dx = G.p.x - e->x, dy = G.p.y - e->y, d = sqrtf(dx * dx + dy * dy) + 0.001f, R = e->r + 55; if (d < R) { float f = (R - d) / R * 2.4f; ax += dx / d * f; ay += dy / d * f; } }
	for (int i = 0; i < MAXEB; i++) { EBullet *b = &G.eb[i]; if (!b->on) continue; float dx = G.p.x - b->x, dy = G.p.y - b->y, d = sqrtf(dx * dx + dy * dy); if (d > 70) continue; float sp = sqrtf(b->vx * b->vx + b->vy * b->vy) + 0.001f, vx = b->vx / sp, vy = b->vy / sp; if (dx * vx + dy * vy <= 0) continue; float s = (dx * vy - dy * vx) >= 0 ? 1 : -1, f = (70 - d) / 70 * 3; ax += vy * s * f; ay += -vx * s * f; }
	float m = 36;
	if (G.p.x < m) ax += (m - G.p.x) / m * 2;
	if (G.p.x > TW - m) ax -= (G.p.x - TW + m) / m * 2;
	if (G.p.y < m) ay += (m - G.p.y) / m * 2;
	if (G.p.y > TH - m) ay -= (G.p.y - TH + m) / m * 2;
	float l = sqrtf(ax * ax + ay * ay); if (l > 1) { ax /= l; ay /= l; } else if (l < 0.08f) ax = ay = 0;
	*ox = ax; *oy = ay;
}

// ------------------------------------------------------------------ altar
typedef struct { int buff; int refuse; } Card;
static Card cards[3]; static int ncards = 0, sel = -1;
static float altarCost = 0, altarTime = 0;
static void openAltar(void) {
	LOG("altar tier %d floor %d grace %.0f held %d\n", G.tier, G.floor, G.grace, heldCount());
	state = S_ALTAR; G.phase = PH_CLEARED; sel = -1; ncards = 0;
	int pool[NB], np = 0;
	for (int t = 0; t < 3; t++) {
		np = 0; for (int i = 0; i < NB; i++) if (G.held[i] && BUFFS[i].tier == t) pool[np++] = i;
		if (np) cards[ncards++] = (Card){pool[rand() % np], 0};
	}
	while (ncards < 3) {
		np = 0; for (int i = 0; i < NB; i++) { if (!G.held[i]) continue; int used = 0; for (int c = 0; c < ncards; c++) if (cards[c].buff == i) used = 1; if (!used) pool[np++] = i; }
		if (!np) break; cards[ncards++] = (Card){pool[rand() % np], 0};
	}
	if (G.floor >= 2 && frand(0, 1) < 0.3f && ncards >= 1) { if (ncards < 3) ncards++; cards[ncards - 1] = (Card){-1, 1}; }
	Split *s = &G.splits[G.nsplits - 1]; altarCost = s->spent; altarTime = s->t;
	sfx(SND_ASCEND);
}

// ------------------------------------------------------------------ story
static const char *storyLines[12]; static char storyEye[12][96], storyBy[12][96]; static int storyFinal[12];
static int nStory = 0, storyAt = 0, storyNext = 0, storyIcon = -1;
static char quoteBuf[12][200];
enum { NEXT_PLAY, NEXT_STARTWAVE, NEXT_ASCEND, NEXT_FINAL, NEXT_TITLE };
static void storyReset(void) { nStory = 0; storyAt = 0; storyIcon = -1; }
static void storyAdd(const char *line, const char *eye, const char *by, int fin) {
	if (nStory >= 12) return;
	snprintf(quoteBuf[nStory], 200, "%s", line); storyLines[nStory] = quoteBuf[nStory];
	snprintf(storyEye[nStory], 96, "%s", eye ? eye : ""); snprintf(storyBy[nStory], 96, "%s", by ? by : ""); storyFinal[nStory] = fin; nStory++;
}
static void storyTier(int n, const char *by) {
	char eye[64];
	if (n == 1) snprintf(eye, sizeof eye, "Tier I"); else snprintf(eye, sizeof eye, "Ascension - Tier %s", ROMAN[n]);
	for (int i = 0; STORIES[n][i]; i++) storyAdd(STORIES[n][i], i ? NULL : eye, i ? NULL : by, 0);
}
static void storyPlay(int next) { prevState = state; state = S_STORY; storyAt = 0; storyNext = next; sfx(SND_TICK); }
static int nextTier = 0, nextBanked = 0, nextKills = 0;
static int endWon = 0, endFinal = 0; static int endMusing = 0, endQuote = 0;
static void endRun(int won, int fin);
static void storyEnd(void) {
	switch (storyNext) {
	case NEXT_PLAY: state = S_PLAY; break;
	case NEXT_STARTWAVE: state = S_PLAY; startWave(0); break;
	case NEXT_ASCEND:
		newRun(0, nextTier, nextBanked, nextKills); state = S_PLAY; startWave(0);
		snprintf(G.banner, sizeof G.banner, "Tier %s", ROMAN[nextTier]); snprintf(G.bannerSub, sizeof G.bannerSub, "Every blessing returned - the wardens are stronger"); G.bannerT = 2.6f;
		break;
	case NEXT_FINAL: endRun(1, 1); break;
	case NEXT_TITLE: state = S_TITLE; newRun(1, 1, 0, 0); startWave(0); break;
	}
}
static void storyAdvance(int skip) {
	if (!skip && storyAt < nStory - 1) { storyAt++; sfx(SND_TICK); return; }
	storyEnd();
}

static void ascend(void) {
	LOG("ASCEND from tier %d banked %d\n", G.tier, G.banked);
	int gained = (int)floorf(G.grace + G.glory);
	G.banked += gained; sfx(SND_ASCEND);
	storyReset();
	if (G.tier >= 4) {
		for (int i = 0; STORYEND[i]; i++) storyAdd(STORYEND[i], i ? NULL : "The fourth purification", NULL, 0);
		storyAdd(FINAL_QUOTE, NULL, NULL, 1);
		storyPlay(NEXT_FINAL); return;
	}
	char by[96]; snprintf(by, sizeof by, "+%d grace banked - %d total", gained, G.banked);
	nextTier = G.tier + 1; nextBanked = G.banked; nextKills = G.kills;
	storyTier(nextTier, by); storyPlay(NEXT_ASCEND);
}
static void endRun(int won, int fin) {
	LOG("END won %d final %d tier %d floor %d banked %d\n", won, fin, G.tier, G.floor, G.banked);
	state = S_DEAD; endWon = won; endFinal = fin;
	int score = G.banked;
	if (score > best) { best = score; saveBest(); }
	if (!won) { endMusing = deckDraw(&dMusing, NDM); endQuote = deckDraw(&dDeath, NDQ); }
}
static void die(void) {
	G.phase = PH_DEAD; G.nextT = G.demo ? 1.5f : 1.4f;
	burst(G.p.x, G.p.y, cBone, 40, 150); burst(G.p.x, G.p.y, cEmber, 24, 100);
	if (!G.demo) { sfx(SND_DEATH); G.hs = 0.6f; }
}
static void sacrifice(int c) {
	Card cd = cards[c];
	if (cd.refuse) {
		G.defy++; G.splits[G.nsplits - 1].gave = -2;
		G.floor++; G.phase = PH_BETWEEN; G.wave = -1; G.nextT = 2.0f; G.nspikes = 0; memset(G.pl, 0, sizeof G.pl);
		G.p.x = TW / 2; G.p.y = TH - 40; G.p.vx = G.p.vy = 0;
		snprintf(G.banner, sizeof G.banner, "Refused"); snprintf(G.bannerSub, sizeof G.bannerSub, "Grace now drains %.1f/s", drainRate()); G.bannerT = 2.0f;
		state = S_PLAY; sfx(SND_DEATH); return;
	}
	int b = cd.buff, gain = TIER_GAIN[BUFFS[b].tier];
	G.held[b] = 0; addGrace(gain);
	G.splits[G.nsplits - 1].gave = b; G.splits[G.nsplits - 1].gain = gain;
	if (b == B_AEGIS) G.p.shield = 0;
	G.p.hp = fminf(G.p.hp, maxHp());
	G.floor++; G.phase = PH_BETWEEN; G.wave = -1; G.nextT = 2.0f; G.nspikes = 0; G.nwalls = 0; memset(G.pl, 0, sizeof G.pl);
	G.p.x = TW / 2; G.p.y = TH - 40; G.p.vx = G.p.vy = 0;
	snprintf(G.banner, sizeof G.banner, "Given up"); snprintf(G.bannerSub, sizeof G.bannerSub, "%s gone - +%d grace", BUFFS[b].name, gain); G.bannerT = 2.0f;
	burst(G.p.x, G.p.y, cGilt, 40, 160); sfx(SND_SHATTER);
	const Quote *q = &QUOTES[deckDraw(&dQuote, NQ)];
	char eye[96], line[200], by[96];
	snprintf(eye, sizeof eye, "%s given up", BUFFS[b].name); snprintf(line, sizeof line, "\"%s\"", q->t); snprintf(by, sizeof by, "- %s", q->a);
	storyReset(); storyAdd(line, eye, by, 0); storyIcon = b; storyPlay(NEXT_PLAY);
}

// ------------------------------------------------------------------ simulation
static void updEnemy(Enemy *e, float dt) {
	if (e->flash > 0) e->flash -= dt;
	if (e->spawn > 0) { e->spawn -= dt; return; }
	float dx = G.p.x - e->x, dy = G.p.y - e->y, d = sqrtf(dx * dx + dy * dy) + 0.001f, ux = dx / d, uy = dy / d, rate = rateMul();
	switch (e->type) {
	case E_GRUNT: e->vx = ux * 45; e->vy = uy * 45; break;
	case E_ARCHER: { float s = d < 120 ? -1 : d > 170 ? 1 : 0; e->vx = ux * 33 * s - uy * 13 * e->dir; e->vy = uy * 33 * s + ux * 13 * e->dir;
		e->cd -= dt * rate; if (e->cd <= 0) { e->cd = 2.3f; eshot(e->x, e->y, ux, uy, 105, 10, 3.2f); sfx(SND_EBOLT); } break; }
	case E_MORTAR: e->vx = -uy * 11 * e->dir; e->vy = ux * 11 * e->dir + (e->y > TH * 0.5f ? -12 : 0);
		e->cd -= dt * rate; if (e->cd <= 0) { e->cd = 3.4f; lob(e->x, e->y, G.p.x + G.p.vx * 0.3f, G.p.y + G.p.vy * 0.3f); } break;
	case E_CHARGER:
		e->st -= dt;
		if (e->state == 0) { e->vx = ux * 21 - uy * 15 * e->dir; e->vy = uy * 21 + ux * 15 * e->dir; e->cd -= dt * rate; if (e->cd <= 0) { e->state = 1; e->st = 0.75f * tele(); e->dx = ux; e->dy = uy; e->vx = e->vy = 0; } }
		else if (e->state == 1) { e->vx = e->vy = 0; if (e->st <= 0) { e->state = 2; e->st = 0.45f; } }
		else if (e->state == 2) { e->vx = e->dx * 265; e->vy = e->dy * 265; if (e->st <= 0) { e->state = 3; e->st = 0.6f; } }
		else { e->vx *= 0.8f; e->vy *= 0.8f; if (e->st <= 0) { e->state = 0; e->cd = 2.6f; } }
		break;
	case E_BOSS: {
		float tx = TW / 2 + sinf(G.time * 0.5f) * 110, ty = 62 + sinf(G.time * 0.33f) * 22;
		e->vx = (tx - e->x) * 1.2f; e->vy = (ty - e->y) * 1.2f;
		if (e->wind > 0) {
			e->wind -= dt;
			if (e->wind <= 0) {
				int rage = e->hp < e->max * 0.5f, live = 0; for (int i = 0; i < MAXE; i++) if (G.en[i].on && G.en[i].type != E_BOSS) live++;
				int pat = e->pat++ % 4; if (pat == 3 && live >= 6) pat = 0;
				sfx(SND_GONG); G.shake = fmaxf(G.shake, 3);
				if (pat == 0) { int n = rage ? 22 : 14; e->spin += 0.13f; for (int i = 0; i < n; i++) { float a = e->spin + i / (float)n * 2 * PI; eshot(e->x, e->y, cosf(a), sinf(a), 78, 12, 3.8f); } }
				else if (pat == 1) { int n = rage ? 7 : 5; float base = atan2f(G.p.y - e->y, G.p.x - e->x); for (int i = 0; i < n; i++) { float a = base + (i - (n - 1) / 2.0f) * 0.18f; eshot(e->x, e->y, cosf(a), sinf(a), 115, 12, 3.8f); } }
				else if (pat == 2) { int n = rage ? 5 : 3; for (int i = 0; i < n; i++) lob(e->x, e->y, G.p.x + (i ? frand(-50, 50) : 0), G.p.y + (i ? frand(-40, 40) : 0)); }
				else { spawnEnemy(E_GRUNT, 0, e->x - 30, e->y + 18, 1); spawnEnemy(E_GRUNT, 0, e->x + 30, e->y + 18, 1); }
			}
		} else { e->cd -= dt * rate; if (e->cd <= 0) { e->cd = 2.0f; e->wind = 0.55f * tele(); } }
		break; }
	}
	e->x = clampf(e->x + e->vx * dt, e->r + WALLT, TW - e->r - WALLT); e->y = clampf(e->y + e->vy * dt, e->r + WALLT, TH - e->r - WALLT);
	if (e->type != E_BOSS) pushOut(&e->x, &e->y, e->r);
	if (d < e->r + G.p.r) hurt(e->touch);
}

static circlePosition cpad; static u32 kHeld;
static void readInput(float *mx, float *my) {
	float x = cpad.dx / 150.0f, y = -cpad.dy / 150.0f;
	if (kHeld & KEY_DLEFT) x = -1;
	if (kHeld & KEY_DRIGHT) x = 1;
	if (kHeld & KEY_DUP) y = -1;
	if (kHeld & KEY_DDOWN) y = 1;
	float l = sqrtf(x * x + y * y);
	if (l < 0.15f) { *mx = *my = 0; return; }
	if (l > 1) { x /= l; y /= l; }
	*mx = x; *my = y;
}

static void update(float dt) {
	if (G.hs > 0) { G.hs -= dt; dt *= 0.15f; }
#ifdef HOSTGOD
	if (!G.demo) { G.p.hp = maxHp(); if (G.grace < 40) G.grace = 100; if (rand() % 40 == 0) for (int i = 0; i < MAXE; i++) if (G.en[i].on && G.en[i].spawn <= 0) G.en[i].on = 0; }
#endif
	G.time += dt;
	moveWalls();
	if (!G.demo && G.phase == PH_WAVE) {
		float rate = drainRate(), use = fminf(G.grace, dt * rate); int before = (int)ceilf(G.grace);
		G.ft += dt; G.grace -= use; G.fspent += use;
		if (G.grace <= 30 && (int)ceilf(G.grace) < before && G.grace > 0) sfx(SND_TICK);
		if (G.grace <= 0.001f) {
			G.grace = 0;
			if (!G.empty) { G.empty = 1; snprintf(G.banner, sizeof G.banner, "Graceless"); snprintf(G.bannerSub, sizeof G.bannerSub, "Your life is draining"); G.bannerT = 2.2f; sfx(SND_DEATH); }
			G.p.hp -= G_BLEED * dt;
			if (G.p.hp <= 0 && G.phase != PH_DEAD) { G.p.hp = 0; G.graceOut = 1; die(); }
		} else G.empty = 0;
	}
	if (G.bannerT > 0) G.bannerT -= dt;
	if (G.flash > 0) G.flash = fmaxf(0, G.flash - dt * 1.6f);
	if (G.shake > 0) G.shake = fmaxf(0, G.shake - dt * 30);

	if (G.phase != PH_DEAD) {
		float mx, my;
		if (G.demo) autopilot(&mx, &my); else readInput(&mx, &my);
		G.p.vx += (mx * 115 - G.p.vx) * fminf(1, dt * 14); G.p.vy += (my * 115 - G.p.vy) * fminf(1, dt * 14);
		G.p.x = clampf(G.p.x + G.p.vx * dt, G.p.r + WALLT, TW - G.p.r - WALLT); G.p.y = clampf(G.p.y + G.p.vy * dt, G.p.r + WALLT, TH - G.p.r - WALLT);
		pushOut(&G.p.x, &G.p.y, G.p.r);
		G.p.x = clampf(G.p.x, G.p.r + WALLT, TW - G.p.r - WALLT); G.p.y = clampf(G.p.y, G.p.r + WALLT, TH - G.p.r - WALLT);
		G.p.moving = sqrtf(mx * mx + my * my) > 0.15f;
		if (G.p.moving) { float l = sqrtf(mx * mx + my * my); G.p.fx = mx / l; G.p.fy = my / l; }
		if (G.p.inv > 0) G.p.inv -= dt;
		G.p.shieldT += dt;
		if (has(B_AEGIS) && G.p.shieldT > 2.5f && G.p.shield < 3) { int b0 = (int)G.p.shield; G.p.shield = fminf(3, G.p.shield + dt / 3); if ((int)G.p.shield > b0) sfx(SND_TICK); }
		if (has(B_VIGOR) && !G.empty) G.p.hp = fminf(maxHp(), G.p.hp + 2 * dt);
		G.p.cd -= dt;
		int live = 0; for (int i = 0; i < MAXE; i++) if (G.en[i].on && G.en[i].spawn <= 0) live = 1;
		if (G.p.cd <= 0 && live && (has(B_FIRE) || !G.p.moving) && G.phase == PH_WAVE) {
			float ax = G.p.fx, ay = G.p.fy;
			if (has(B_AIM)) { Enemy *t = nearest(G.p.x, G.p.y, 1e9f); if (t) { float l = dist(t->x, t->y, G.p.x, G.p.y) + 0.001f; ax = (t->x - G.p.x) / l; ay = (t->y - G.p.y) / l; } }
			G.p.cd = 0.36f / (has(B_HASTE) ? 1.6f : 1);
			float dmg = 10 * (has(B_MIGHT) ? 2 : 1), a0 = atan2f(ay, ax), angs[3] = {a0, a0 - 0.24f, a0 + 0.24f};
			int n = has(B_TWIN) ? 3 : 1;
			for (int k = 0; k < n; k++) for (int i = 0; i < MAXB; i++) if (!G.pb[i].on) { G.pb[i] = (Bullet){G.p.x + cosf(angs[k]) * 8, G.p.y + sinf(angs[k]) * 8, cosf(angs[k]) * 310, sinf(angs[k]) * 310, dmg, 1.4f, 1}; break; }
			sfx(SND_SHOOT);
		}
	}

	for (int i = 0; i < MAXB; i++) {
		Bullet *b = &G.pb[i]; if (!b->on) continue;
		if (has(B_HOMING)) { Enemy *t = nearest(b->x, b->y, 160); if (t) { float cur = atan2f(b->vy, b->vx), want = atan2f(t->y - b->y, t->x - b->x), da = want - cur; while (da > PI) da -= 2 * PI; while (da < -PI) da += 2 * PI; float a = cur + clampf(da, -8 * dt, 8 * dt); b->vx = cosf(a) * 310; b->vy = sinf(a) * 310; } }
		b->x += b->vx * dt; b->y += b->vy * dt; b->life -= dt;
		if (b->x < WALLT || b->x > TW - WALLT || b->y < WALLT || b->y > TH - WALLT || inWall(b->x, b->y, 0)) { b->on = 0; burst(b->x, b->y, cGilt, 2, 40); continue; }
		if (b->life <= 0) { b->on = 0; continue; }
		for (int k = 0; k < MAXE; k++) {
			Enemy *e = &G.en[k]; if (!e->on || e->spawn > 0 || e->hp <= 0) continue;
			if (dist(e->x, e->y, b->x, b->y) < e->r + 3) {
				e->hp -= b->dmg; e->flash = 0.08f; b->on = 0;
				if (e->type != E_BOSS) { e->x += b->vx * 0.006f; e->y += b->vy * 0.006f; }
				num(e->x, e->y - e->r - 3, b->dmg, cBone); burst(b->x, b->y, cGiltHi, 3, 55); sfx(SND_HIT);
				if (e->hp <= 0) {
					G.kills++; e->on = 0;
					if (e->type == E_BOSS) { burst(e->x, e->y, cGilt, 80, 200); burst(e->x, e->y, cEmber, 40, 120); G.hs = 0.5f; G.shake = 9; G.flash = 0.6f; G.flashC = cGiltHi; sfx(SND_GONG); }
					else {
						burst(e->x, e->y, cEmber, 14, 100); burst(e->x, e->y, cEmber2, 6, 50); sfx(SND_KILL);
						if (!G.demo && frand(0, 1) < 0.03f) for (int q = 0; q < MAXPK; q++) if (!G.pk[q].on) { G.pk[q] = (Pickup){clampf(e->x, 20, TW - 20), clampf(e->y, 20, TH - 20), 5.5f, 5.5f, 8, 1, 1}; break; }
					}
				}
				break;
			}
		}
	}
	for (int i = 0; i < MAXE; i++) if (G.en[i].on) updEnemy(&G.en[i], dt);
	for (int i = 0; i < MAXE; i++) for (int j = i + 1; j < MAXE; j++) {
		Enemy *a = &G.en[i], *b = &G.en[j]; if (!a->on || !b->on) continue;
		float dx = b->x - a->x, dy = b->y - a->y, d = sqrtf(dx * dx + dy * dy) + 0.001f, o = a->r + b->r - d;
		if (o > 0) { float ka = a->type == E_BOSS ? 0 : b->type == E_BOSS ? 1 : 0.5f, kb = 1 - ka, k = o / d; a->x -= dx * k * ka; a->y -= dy * k * ka; b->x += dx * k * kb; b->y += dy * k * kb; }
	}
	for (int i = 0; i < MAXEB; i++) {
		EBullet *b = &G.eb[i]; if (!b->on) continue;
		b->x += b->vx * dt; b->y += b->vy * dt;
		if (G.phase != PH_DEAD && dist(b->x, b->y, G.p.x, G.p.y) < G.p.r + b->r - 1) { hurt(b->dmg); b->on = 0; continue; }
		if (b->x < WALLT || b->x > TW - WALLT || b->y < WALLT || b->y > TH - WALLT) b->on = 0;
		else if (inWall(b->x, b->y, b->r * 0.5f)) { b->on = 0; burst(b->x, b->y, cEmber, 3, 45); }
	}
	for (int i = 0; i < MAXSH; i++) {
		Shell *s = &G.sh[i]; if (!s->on) continue;
		s->t += dt;
		if (s->t >= s->T) {
			s->on = 0; burst(s->tx, s->ty, cAcid, 16, 90); sfx(SND_HIT);
			if (dist(G.p.x, G.p.y, s->tx, s->ty) < s->r) hurt(14);
			for (int k = 0; k < MAXPL; k++) if (!G.pl[k].on) { G.pl[k] = (Pool){s->tx, s->ty, s->r, 4, 1}; break; }
		}
	}
	for (int i = 0; i < MAXPL; i++) { Pool *p = &G.pl[i]; if (!p->on) continue; p->life -= dt; if (p->life <= 0) { p->on = 0; continue; } if (dist(G.p.x, G.p.y, p->x, p->y) < p->r - 3) { if (has(B_FLOAT)) featherSave(); else hurt(8); } }
	if (!G.demo && G.phase == PH_WAVE) {
		G.sparkT -= dt;
		if (G.sparkT <= 0) { G.sparkT = frand(3, 4.5f); for (int q = 0; q < MAXPK; q++) if (!G.pk[q].on) { G.pk[q] = (Pickup){frand(30, TW - 30), frand(30, TH - 30), 4.5f, 4.5f, SPARK_V, 0, 1}; break; } }
		G.heartT -= dt;
		if (G.heartT <= 0) { G.heartT = frand(18, 26); for (int q = 0; q < MAXPK; q++) if (!G.pk[q].on) { G.pk[q] = (Pickup){frand(30, TW - 30), frand(30, TH - 30), 5.5f, 5.5f, 8, 1, 1}; break; } }
	}
	for (int q = 0; q < MAXPK; q++) {
		Pickup *k = &G.pk[q]; if (!k->on) continue;
		k->life -= dt; if (k->life <= 0) { k->on = 0; continue; }
		if (!G.demo && G.phase != PH_DEAD && dist(k->x, k->y, G.p.x, G.p.y) < G.p.r + 10) {
			k->on = 0;
			if (k->heart) { float b0 = G.p.hp; G.p.hp = fminf(maxHp(), G.p.hp + k->v); num(k->x, k->y - 8, G.p.hp - b0, cEmberHi); burst(k->x, k->y, cEmberHi, 14, 90); sfx(SND_HEAL); spawnFlies(k->x, k->y, 1); }
			else { addGrace(k->v); num(k->x, k->y - 8, k->v, cGrace); burst(k->x, k->y, cGraceHi, 14, 90); sfx(SND_CHIME); spawnFlies(k->x, k->y, 0); }
		}
	}
	for (int s = 0; s < G.nspikes; s++) if (spikePhase(&G.spikes[s]) == 2 && inSpike(G.p.x, G.p.y, &G.spikes[s], -3)) { if (has(B_FLOAT)) featherSave(); else hurt(14); }
	if (G.featherT > 0) G.featherT -= dt;
	if (G.featherCd > 0) G.featherCd -= dt;
	for (int i = 0; i < MAXP; i++) { Part *f = &G.fx[i]; if (!f->on) continue; f->x += f->vx * dt; f->y += f->vy * dt; f->vx *= 0.92f; f->vy *= 0.92f; f->life -= dt; if (f->life <= 0) f->on = 0; }
	for (int i = 0; i < MAXN; i++) { Num *n = &G.nums[i]; if (!n->on) continue; n->y -= 18 * dt; n->life -= dt; if (n->life <= 0) n->on = 0; }
	if (!G.demo) updateFlies(dt);

	int anyEnemy = 0; for (int i = 0; i < MAXE; i++) if (G.en[i].on) anyEnemy = 1;
	if (G.phase == PH_WAVE && !anyEnemy) {
		memset(G.eb, 0, sizeof G.eb); memset(G.sh, 0, sizeof G.sh);
		if (WAVES[G.wave].boss) {
			if (!G.demo && G.nsplits < 16) G.splits[G.nsplits++] = (Split){G.floor, G.ft, G.fspent, -1, 0};
			G.ft = 0; G.fspent = 0;
			G.phase = PH_CLEARED; G.nextT = 1.8f; snprintf(G.banner, sizeof G.banner, "Warden felled");
			snprintf(G.bannerSub, sizeof G.bannerSub, "%s", heldCount() ? "" : "You are pure"); G.bannerT = 1.8f;
		} else { G.phase = PH_BETWEEN; G.nextT = 1.1f; }
	} else if (G.phase == PH_BETWEEN) { G.nextT -= dt; if (G.nextT <= 0) startWave(G.wave + 1); }
	else if (G.phase == PH_CLEARED) {
		G.nextT -= dt;
		if (G.nextT <= 0) {
			if (G.demo) { G.floor++; startWave(0); }
			else if (!heldCount()) { if (state == S_PLAY) ascend(); }
			else if (state == S_PLAY) openAltar();
		}
	} else if (G.phase == PH_DEAD) {
		G.nextT -= dt;
		if (G.nextT <= 0) { if (G.demo) { newRun(1, 1, 0, 0); startWave(0); } else if (state == S_PLAY) endRun(0, 0); }
	}
}

// ------------------------------------------------------------------ drawing: top screen
static void star(float x, float y, float r, float ri, float rot, u32 c) {
	for (int i = 0; i < 8; i++) {
		float a0 = rot + i / 8.0f * 2 * PI, a1 = rot + (i + 1) / 8.0f * 2 * PI, r0 = i % 2 ? ri : r, r1 = i % 2 ? r : ri;
		C2D_DrawTriangle(x, y, c, x + cosf(a0) * r0, y + sinf(a0) * r0, c, x + cosf(a1) * r1, y + sinf(a1) * r1, c, 0);
	}
}
static void heartShape(float x, float y, float r, u32 c) {
	C2D_DrawCircleSolid(x - r * 0.45f, y - r * 0.2f, 0, r * 0.52f, c); C2D_DrawCircleSolid(x + r * 0.45f, y - r * 0.2f, 0, r * 0.52f, c);
	C2D_DrawTriangle(x - r * 0.95f, y - r * 0.05f, c, x + r * 0.95f, y - r * 0.05f, c, x, y + r * 0.95f, c, 0);
}
static void bar(float x, float y, float w, float h, float k, u32 bg, u32 fg) {
	C2D_DrawRectSolid(x - 1, y - 1, 0, w + 2, h + 2, cInk); C2D_DrawRectSolid(x, y, 0, w, h, bg); C2D_DrawRectSolid(x, y, 0, w * clampf(k, 0, 1), h, fg);
}
static void drawFloor(float off) {
	C2D_DrawRectSolid(0, 0, 0, TW, TH, cStone);
	for (int row = 0, y = (int)WALLT; y < TH - WALLT; row++, y += 30) {
		int o = row % 2 ? -18 : 0;
		for (int x = (int)WALLT + o; x < TW - WALLT; x += 36) {
			int v = ((x * 7 + y * 13) / 11) % 5;
			u32 c = v == 0 ? RGBA(19, 22, 32, 255) : v == 1 ? RGBA(28, 32, 46, 255) : cStone;
			C2D_DrawRectSolid(x + 1 + off, y + 1, 0, 34, 28, c);
		}
	}
	C2D_DrawRectSolid(0, 0, 0, TW, WALLT, cInk); C2D_DrawRectSolid(0, TH - WALLT, 0, TW, WALLT, cInk);
	C2D_DrawRectSolid(0, 0, 0, WALLT, TH, cInk); C2D_DrawRectSolid(TW - WALLT, 0, 0, WALLT, TH, cInk);
	// torches
	float fl = 0.8f + 0.2f * sinf(G.time * 9);
	float tx[3] = {90, 200, 310};
	for (int i = 0; i < 3; i++) { C2D_DrawCircleSolid(tx[i] + off, 3, 0, 9 * fl, RGBA(243, 236, 217, 40)); C2D_DrawCircleSolid(tx[i] + off, 3, 0, 2.5f, cBone); }
}
static void drawTop(float eye) {
	float sh = G.shake > 0 ? frand(-G.shake, G.shake) : 0, sv = G.shake > 0 ? frand(-G.shake, G.shake) : 0;
	float dFloor = -2.0f * eye, dEnt = 1.5f * eye;
	C2D_ViewReset(); C2D_ViewTranslate(sh, sv);
	drawFloor(dFloor);
	float t = G.time;
	// walls
	for (int i = 0; i < G.nwalls; i++) { Wall *w = &G.walls[i]; float x = w->x + dEnt * 0.5f; C2D_DrawRectSolid(x + 2, w->y + 3, 0, w->w, w->h, RGBA(0, 0, 0, 110)); C2D_DrawRectSolid(x, w->y, 0, w->w, w->h, cLine); C2D_DrawRectSolid(x, w->y, 0, w->w, 2, cGilt2); }
	// spikes
	for (int s = 0; s < G.nspikes; s++) {
		Spike *sp = &G.spikes[s]; int ph = spikePhase(sp); float x = sp->x + dFloor;
		C2D_DrawRectSolid(x + 1, sp->y + 1, 0, SPIKE - 2, SPIKE - 2, cInk);
		u32 edge = ph == 0 ? cLine : (ph == 1 && sinf(t * 28) > 0 ? cEmber2 : cEmber);
		C2D_DrawRectSolid(x + 1, sp->y + 1, 0, SPIKE - 2, 1.5f, edge); C2D_DrawRectSolid(x + 1, sp->y + SPIKE - 2.5f, 0, SPIKE - 2, 1.5f, edge);
		C2D_DrawRectSolid(x + 1, sp->y + 1, 0, 1.5f, SPIKE - 2, edge); C2D_DrawRectSolid(x + SPIKE - 2.5f, sp->y + 1, 0, 1.5f, SPIKE - 2, edge);
		for (int a = 0; a < 3; a++) for (int b = 0; b < 3; b++) {
			float cx = x + 6 + a * 11, cy = sp->y + 7 + b * 10.5f;
			if (ph == 2) C2D_DrawTriangle(cx, cy - 6, cEmberHi, cx + 4, cy + 3, cEmber2, cx - 4, cy + 3, cEmber2, 0);
			else C2D_DrawCircleSolid(cx, cy, 0, 1.6f, ph == 1 ? cEmber : cStone2);
		}
	}
	// pools and shells
	for (int i = 0; i < MAXPL; i++) { Pool *p = &G.pl[i]; if (!p->on) continue; float a = fminf(1, p->life); C2D_DrawCircleSolid(p->x + dFloor, p->y, 0, p->r, alpha(cAcid, 0.4f * a)); }
	for (int i = 0; i < MAXSH; i++) {
		Shell *s = &G.sh[i]; if (!s->on) continue; float k = s->t / s->T;
		C2D_DrawCircleSolid(s->tx + dFloor, s->ty, 0, s->r * k, alpha(cAcid, 0.25f));
		for (int j = 0; j < 16; j++) { float a = j / 16.0f * 2 * PI + t; C2D_DrawCircleSolid(s->tx + dFloor + cosf(a) * s->r, s->ty + sinf(a) * s->r, 0, 1, cAcid); }
		float x = s->fx + (s->tx - s->fx) * k, y = s->fy + (s->ty - s->fy) * k - sinf(k * PI) * 80;
		C2D_DrawCircleSolid(x + dEnt * 2, y, 0, 3, cBone);
	}
	// pickups
	for (int q = 0; q < MAXPK; q++) {
		Pickup *k = &G.pk[q]; if (!k->on) continue;
		float blink = k->life < 1.5f ? (sinf(t * 22) > 0 ? 1 : 0.35f) : 1, x = k->x + dEnt;
		C2D_DrawCircleSolid(x, k->y, 0, 13, alpha(k->heart ? cEmber : cGrace, 0.18f * blink));
		if (k->heart) heartShape(x, k->y, 6, alpha(cEmber, blink)); else icon(SPR_GRACE, x, k->y + sinf(t * 4 + k->x) * 1.5f, 18, blink);
	}
	// charger telegraphs
	for (int i = 0; i < MAXE; i++) { Enemy *e = &G.en[i]; if (!e->on || e->type != E_CHARGER || e->state != 1) continue; float k = 1 - e->st / (0.75f * tele()); C2D_DrawLine(e->x + dEnt, e->y, alpha(cEmber, 0.15f + 0.35f * k), e->x + dEnt + e->dx * 120, e->y + e->dy * 120, alpha(cEmber, 0.05f), e->r * 2, 0); }
	// enemies
	for (int i = 0; i < MAXE; i++) {
		Enemy *e = &G.en[i]; if (!e->on) continue; float x = e->x + dEnt, y = e->y + sinf(t * 8 + e->seed);
		if (e->spawn > 0) { for (int j = 0; j < 12; j++) { float a = j / 12.0f * 2 * PI; float rr = e->r + e->spawn * 20; C2D_DrawCircleSolid(x + cosf(a) * rr, e->y + sinf(a) * rr, 0, 1, alpha(cEmber, 0.7f)); } continue; }
		C2D_DrawEllipseSolid(e->x + dFloor - e->r, e->y + e->r * 0.5f, 0, e->r * 2, e->r * 0.8f, RGBA(0, 0, 0, 100));
		u32 main = e->flash > 0 ? cBone : cEmber, dark = e->flash > 0 ? cBone : cEmber2;
		float ang = atan2f(G.p.y - e->y, G.p.x - e->x), r = e->r;
		switch (e->type) {
		case E_GRUNT: C2D_DrawCircleSolid(x, y, 0, r, dark); C2D_DrawCircleSolid(x - 0.5f, y - 0.5f, 0, r * 0.8f, main); break;
		case E_ARCHER: { float c = cosf(ang), s = sinf(ang); C2D_DrawTriangle(x + c * (r + 2), y + s * (r + 2), main, x + (-c * r - s * r), y + (-s * r + c * r), dark, x + (-c * r + s * r), y + (-s * r - c * r), dark, 0); break; }
		case E_MORTAR: C2D_DrawRectSolid(x - r, y - r * 0.8f, 0, r * 2, r * 1.7f, dark); C2D_DrawRectSolid(x - r + 2, y - r * 0.8f + 2, 0, r * 2 - 4, r * 0.5f, main); C2D_DrawEllipseSolid(x - r * 0.8f, y - r, 0, r * 1.6f, r * 0.6f, cAcid); break;
		case E_CHARGER: { float a = e->state == 0 ? ang : atan2f(e->dy, e->dx), c = cosf(a), s = sinf(a); float jx = e->state == 1 ? frand(-1, 1) : 0;
			C2D_DrawTriangle(x + jx + c * (r + 3), y + s * (r + 3), main, x + jx - s * r, y + c * r, dark, x + jx + s * r, y - c * r, dark, 0);
			C2D_DrawTriangle(x + jx - c * r, y - s * r, dark, x + jx - s * r, y + c * r, dark, x + jx + s * r, y - c * r, dark, 0); break; }
		case E_BOSS: {
			int rage = e->hp < e->max * 0.5f;
			C2D_DrawCircleSolid(x, y, 0, r * 2, alpha(cEmber, rage ? 0.22f : 0.12f));
			for (int k = 0; k < 6; k++) { float a0 = t * 0.4f + k / 6.0f * 2 * PI, a1 = t * 0.4f + (k + 1) / 6.0f * 2 * PI; C2D_DrawTriangle(x, y, dark, x + cosf(a0) * r, y + sinf(a0) * r, dark, x + cosf(a1) * r, y + sinf(a1) * r, dark, 0); }
			for (int k = 0; k < 6; k++) { float a0 = 0.52f + t * 0.4f + k / 6.0f * 2 * PI, a1 = 0.52f + t * 0.4f + (k + 1) / 6.0f * 2 * PI; C2D_DrawTriangle(x, y, main, x + cosf(a0) * r * 0.8f, y + sinf(a0) * r * 0.8f, main, x + cosf(a1) * r * 0.8f, y + sinf(a1) * r * 0.8f, main, 0); }
			C2D_DrawCircleSolid(x, y, 0, r * 0.45f, cInk); C2D_DrawCircleSolid(x, y, 0, r * 0.32f, cBone); C2D_DrawCircleSolid(x + cosf(ang) * 3, y + sinf(ang) * 3, 0, r * 0.15f, rage ? cEmber : cInk);
			for (int k = 0; k < 4; k++) { float a = t * (rage ? 2.2f : 1.2f) + k / 4.0f * 2 * PI; C2D_DrawCircleSolid(x + cosf(a) * (r + 9), y + sinf(a) * (r + 9), 0, 2.5f, main); }
			if (e->wind > 0 && sinf(t * 30) > 0) for (int j = 0; j < 24; j++) { float a = j / 24.0f * 2 * PI; C2D_DrawCircleSolid(x + cosf(a) * (r + 5), y + sinf(a) * (r + 5), 0, 1.2f, cGiltHi); }
			break; }
		}
		if (e->type != E_GRUNT && e->type != E_ARCHER && e->type != E_CHARGER) {}
		if (e->type == E_GRUNT || e->type == E_CHARGER) { float px = -sinf(ang) * 2.5f, py = cosf(ang) * 2.5f; C2D_DrawCircleSolid(x + px + cosf(ang) * 2, y + py + sinf(ang) * 2, 0, 1.2f, cGiltHi); C2D_DrawCircleSolid(x - px + cosf(ang) * 2, y - py + sinf(ang) * 2, 0, 1.2f, cGiltHi); }
		if (e->type != E_BOSS && e->hp < e->max) bar(x - 8, e->y - e->r - 6, 16, 2, e->hp / e->max, cInk, cEmberHi);
	}
	// player
	if (G.phase != PH_DEAD) {
		float x = G.p.x + dEnt * 1.6f, y = G.p.y;
		C2D_DrawEllipseSolid(G.p.x + dFloor - 7, G.p.y + 4, 0, 14, 5, RGBA(0, 0, 0, 110));
		int nh = heldCount();
		C2D_DrawCircleSolid(x, y, 0, 28, alpha(nh ? cGilt : cBone, 0.08f + 0.012f * nh));
		for (int i = 0, k = 0; i < NB; i++) if (G.held[i]) { float a = t * 1.1f + k / (float)nh * 2 * PI; icon(i, x + cosf(a) * 19, y + sinf(a) * 15, 8, 0.9f); k++; }
		if (has(B_AEGIS)) for (int i = 0; i < 3; i++) if (i < (int)G.p.shield) { for (int j = 0; j < 6; j++) { float a = -PI / 2 + i * 2.094f + 0.15f + t * 0.5f + j * 0.3f; C2D_DrawCircleSolid(x + cosf(a) * 11, y + sinf(a) * 11, 0, 1.1f, cGilt); } }
		if (!has(B_AIM)) for (int j = 1; j < 6; j++) C2D_DrawCircleSolid(x + G.p.fx * (12 + j * 9), y + G.p.fy * (12 + j * 9), 0, 0.9f, alpha(cBone, 0.35f));
		if (!(G.p.inv > 0 && ((int)(G.p.inv * 20)) % 2)) {
			float a = atan2f(G.p.fy, G.p.fx), c = cosf(a), s = sinf(a), r = G.p.r;
			float px[4] = {c * (r + 3), -s * r * 0.8f, -c * r, s * r * 0.8f}, py[4] = {s * (r + 3), c * r * 0.8f, -s * r, -c * r * 0.8f};
			C2D_DrawTriangle(x + px[0], y + py[0], cBone, x + px[1], y + py[1], cBone, x + px[2], y + py[2], cBone, 0);
			C2D_DrawTriangle(x + px[0], y + py[0], cBone, x + px[3], y + py[3], cBone, x + px[2], y + py[2], cBone, 0);
			C2D_DrawCircleSolid(x, y, 0, 2.2f, nh ? cGilt : RGBA(190, 214, 255, 255));
		}
		if (!G.demo) {
			float mh = maxHp(), k = clampf(G.p.hp / mh, 0, 1);
			bar(x - 13, y - 31, 26, 3, k, cEmber2, (G.empty && sinf(t * 12) > 0) ? cEmberHi : cEmber);
			bar(x - 13, y - 26, 26, 2, G.grace / 100.0f, cGrace2, cGrace);
		}
	}
	// bullets
	for (int i = 0; i < MAXEB; i++) { EBullet *b = &G.eb[i]; if (!b->on) continue; C2D_DrawCircleSolid(b->x + dEnt, b->y, 0, b->r * 2, alpha(cEmber, 0.25f)); C2D_DrawCircleSolid(b->x + dEnt, b->y, 0, b->r, cEmberHi); C2D_DrawCircleSolid(b->x + dEnt, b->y, 0, b->r * 0.45f, cEmber2); }
	for (int i = 0; i < MAXB; i++) { Bullet *b = &G.pb[i]; if (!b->on) continue; C2D_DrawLine(b->x + dEnt, b->y, cGiltHi, b->x + dEnt - b->vx * 0.018f, b->y - b->vy * 0.018f, alpha(cGilt, 0.2f), 2.4f, 0); }
	for (int i = 0; i < MAXP; i++) { Part *f = &G.fx[i]; if (!f->on) continue; C2D_DrawRectSolid(f->x + dEnt - f->s / 2, f->y - f->s / 2, 0, f->s, f->s, alpha(f->c, f->life / f->max * 1.4f)); }
	if (G.featherT > 0 && G.phase != PH_DEAD && !G.demo) {
		float k = G.featherT / 1.1f, a = fminf(1, G.featherT * 2.5f), x = G.p.x + dEnt * 1.6f, y = G.p.y - 56 - (1 - k) * 10;
		C2D_DrawCircleSolid(x, y, 0, 13, alpha(cBone, 0.12f * a));
		icon(B_FLOAT, x, y + sinf(G.time * 10) * 1.5f, 20, a);
		text("Featherstep", x, y + 10, 0.34f, alpha(cBone, a), C2D_AlignCenter);
	}
	drawFlies(0);
	char nb[16];
	for (int i = 0; i < MAXN; i++) { Num *n = &G.nums[i]; if (!n->on) continue; snprintf(nb, sizeof nb, "%d", (int)roundf(n->v)); text(nb, n->x + dEnt, n->y, 0.42f, alpha(n->c, n->life * 3), C2D_AlignCenter); }
	C2D_ViewReset();
	// vignette edges + flashes
	C2D_DrawRectangle(0, 0, 0, TW, 30, RGBA(0, 0, 0, 90), RGBA(0, 0, 0, 90), RGBA(0, 0, 0, 0), RGBA(0, 0, 0, 0));
	C2D_DrawRectangle(0, TH - 30, 0, TW, 30, RGBA(0, 0, 0, 0), RGBA(0, 0, 0, 0), RGBA(0, 0, 0, 90), RGBA(0, 0, 0, 90));
	if (G.flash > 0) C2D_DrawRectSolid(0, 0, 0, TW, TH, alpha(G.flashC, G.flash * 0.45f));
	if (G.empty && !G.demo && G.phase != PH_DEAD) { float a = 0.18f + 0.12f * sinf(G.time * 6); C2D_DrawRectSolid(0, 0, 0, TW, 10, alpha(cEmber, a)); C2D_DrawRectSolid(0, TH - 10, 0, TW, 10, alpha(cEmber, a)); C2D_DrawRectSolid(0, 0, 0, 10, TH, alpha(cEmber, a)); C2D_DrawRectSolid(TW - 10, 0, 0, 10, TH, alpha(cEmber, a)); }
	// boss bar
	for (int i = 0; i < MAXE; i++) if (G.en[i].on && G.en[i].type == E_BOSS && G.en[i].spawn <= 0 && !G.demo) { bar(60, 10, TW - 120, 4, G.en[i].hp / G.en[i].max, cInk, cEmber); text("THE WARDEN", TW / 2, 16, 0.42f, cGilt, C2D_AlignCenter); }
	// banner
	if (G.bannerT > 0 && !G.demo && G.banner[0] && state == S_PLAY) {
		float a = fminf(1, fminf(G.bannerT * 2.5f, (2.2f - G.bannerT) * 4)); if (a < 0) a = 0;
		C2D_DrawRectSolid(0, TH * 0.4f - 22, 0, TW, 48, alpha(cInk, 0.7f * a));
		C2D_DrawRectSolid(0, TH * 0.4f - 22, 0, TW, 1, alpha(cGilt, a)); C2D_DrawRectSolid(0, TH * 0.4f + 26, 0, TW, 1, alpha(cGilt, a));
		text(G.banner, TW / 2, TH * 0.4f - 18, 0.85f, alpha(cGiltHi, a), C2D_AlignCenter);
		if (G.bannerSub[0]) text(G.bannerSub, TW / 2, TH * 0.4f + 10, 0.42f, alpha(cBone, a), C2D_AlignCenter);
	}
}
static void drawTopOverlay(void) {
	if (state == S_TITLE) {
		C2D_DrawRectSolid(0, 0, 0, TW, TH, RGBA(11, 13, 20, 150));
		float t = G.time;
		C2D_DrawCircleSolid(TW / 2, 82, 0, 46 + sinf(t * 2) * 2, alpha(cGrace, 0.18f));
		star(TW / 2, 82, 40 + sinf(t * 2), 9, -PI / 2, cGrace); star(TW / 2, 82, 18, 4, -PI / 2, cBone);
		for (int i = 0; i < 28; i++) { float a = i / 28.0f * 2 * PI + t * 0.15f; if (i % 7 == 6) continue; C2D_DrawCircleSolid(TW / 2 + cosf(a) * 52, 82 + sinf(a) * 52, 0, 1.3f, cGrace); }
		text("GRACE", TW / 2, 132, 1.3f, cGraceHi, C2D_AlignCenter);
		text("Give up power. Keep your grace.", TW / 2, 176, 0.5f, cBone, C2D_AlignCenter);
		char v[64]; snprintf(v, sizeof v, "Version %s", VERSION); text(v, TW / 2, 218, 0.38f, cMuted, C2D_AlignCenter);
	} else if (state == S_STORY) {
		C2D_DrawRectSolid(0, 0, 0, TW, TH, RGBA(11, 13, 20, 235));
		if (storyIcon >= 0) icon(storyIcon, TW / 2, 24, 26, 0.85f);
		if (storyEye[storyAt][0]) text(storyEye[storyAt], TW / 2, 44, 0.42f, cGrace, C2D_AlignCenter);
		textWrap(storyLines[storyAt], 30, 78, storyFinal[storyAt] ? 0.72f : 0.62f, storyFinal[storyAt] ? cGraceHi : cBone, C2D_AlignLeft, TW - 60);
		if (storyBy[storyAt][0]) text(storyBy[storyAt], TW / 2, 196, 0.42f, cGilt, C2D_AlignCenter);
	} else if (state == S_ALTAR) {
		C2D_DrawRectSolid(0, 0, 0, TW, TH, RGBA(11, 13, 20, 170));
		char l[96]; snprintf(l, sizeof l, "Floor %d clear  -  %ds  -  %d grace lost", G.splits[G.nsplits - 1].floor, (int)altarTime, (int)roundf(altarCost));
		text(l, TW / 2, 70, 0.45f, cMuted, C2D_AlignCenter);
		text("An offering is owed", TW / 2, 100, 0.9f, cGiltHi, C2D_AlignCenter);
		text("Choose on the touch screen", TW / 2, 150, 0.42f, cMuted, C2D_AlignCenter);
	} else if (state == S_DEAD) {
		C2D_DrawRectSolid(0, 0, 0, TW, TH, RGBA(11, 13, 20, 215));
		if (endWon) {
			text("AT REST", TW / 2, 60, 1.2f, cGraceHi, C2D_AlignCenter);
			text("Four times purified", TW / 2, 112, 0.55f, cBone, C2D_AlignCenter);
			char l[64]; snprintf(l, sizeof l, "%d grace, banked across four tiers", G.banked); text(l, TW / 2, 150, 0.45f, cGrace, C2D_AlignCenter);
		} else {
			text(G.graceOut ? "GRACELESS" : "FALLEN", TW / 2, 22, 1.1f, cEmber, C2D_AlignCenter);
			textWrap(DEATH_MUSINGS[endMusing], 30, 74, 0.5f, cBone, C2D_AlignLeft, TW - 60);
			char q[220]; snprintf(q, sizeof q, "\"%s\"", DEATH_QUOTES[endQuote].t);
			textWrap(q, 30, 116, 0.47f, cGiltHi, C2D_AlignLeft, TW - 60);
			char a[96]; snprintf(a, sizeof a, "- %s", DEATH_QUOTES[endQuote].a); text(a, TW - 30, 200, 0.42f, cMuted, C2D_AlignRight);
		}
	} else if (state == S_PAUSE) {
		C2D_DrawRectSolid(0, 0, 0, TW, TH, RGBA(11, 13, 20, 170));
		text("Paused", TW / 2, 100, 1.0f, cGiltHi, C2D_AlignCenter);
	}
}

// ------------------------------------------------------------------ drawing: bottom screen (all UI)
typedef struct { float x, y, w, h; } Rect;
static int inRect(Rect r, int x, int y) { return x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h; }
static Rect tileRect(int i) { int row = i < 6 ? 0 : 1, col = i < 6 ? i : i - 6, n = row == 0 ? 6 : 5; float w = 48, h = 34, gap = 3; float x0 = (BW - (n * w + (n - 1) * gap)) / 2; return (Rect){x0 + col * (w + gap), 78 + row * (h + gap), w, h}; }
static int tipBuff = -1; static float tipT = 0;
static void panel(Rect r, u32 fill, u32 edge) { C2D_DrawRectSolid(r.x, r.y, 0, r.w, r.h, edge); C2D_DrawRectSolid(r.x + 1, r.y + 1, 0, r.w - 2, r.h - 2, fill); }
static u32 tierCol(int t) { return t == T_L ? cGilt : t == T_R ? cAcid : cMuted; }
static void button(Rect r, const char *label, int primary) {
	panel(r, primary ? cGilt : cStone2, primary ? cGilt3 : cLine);
	text(label, r.x + r.w / 2, r.y + r.h / 2 - 8, 0.5f, primary ? cGilt3 : cBone, C2D_AlignCenter);
}
static Rect bStart = {40, 150, 240, 40}, bHow = {90, 200, 140, 28};
static Rect bAgain = {30, 168, 260, 36}, bStop = {90, 208, 140, 26};
static Rect bResume = {60, 100, 200, 38}, bQuit = {60, 150, 200, 34};
static Rect cardRect(int i) { return (Rect){6, 30 + i * 62, BW - 12, 58}; }
static Rect bConfirm = {6, 216, BW - 12, 22};
static int howOpen = 0;

static void drawHud(void) {
	char s[96];
	// health and grace
	panel((Rect){4, 4, BW - 8, 40}, cInk, G.empty ? cEmber : cGrace2);
	heartShape(22, 24, 8 + hpPulse * 10, cEmber);
	snprintf(s, sizeof s, "%d", (int)ceilf(fmaxf(0, G.p.hp))); text(s, 36, 12 - hpPulse * 8, 0.75f + hpPulse, hpPulse > 0 ? cBone : cEmberHi, C2D_AlignLeft);
	if (G.empty) text("x", 172, 12, 0.75f, cEmber, C2D_AlignCenter); else icon(SPR_GRACE, 172, 24, 22 + gracePulse * 24, 1);
	snprintf(s, sizeof s, "%d", (int)ceilf(G.grace)); text(s, 186, 12 - gracePulse * 8, 0.75f + gracePulse, gracePulse > 0 ? cBone : (G.grace <= 40 && sinf(G.time * 8) > 0 ? cEmberHi : cGraceHi), C2D_AlignLeft);
	snprintf(s, sizeof s, "-%.1f/s", drainRate()); text(s, BW - 10, 20, 0.4f, cGrace, C2D_AlignRight);
	// where
	const WaveDef *w = &WAVES[G.wave < 0 ? 0 : G.wave];
	if (heldCount()) snprintf(s, sizeof s, "Floor %d", G.floor); else snprintf(s, sizeof s, "Pure Floor");
	text(s, 8, 50, 0.5f, cGilt, C2D_AlignLeft);
	if (G.wave < 0) snprintf(s, sizeof s, "Next floor"); else if (w->boss) snprintf(s, sizeof s, "Warden"); else snprintf(s, sizeof s, "Wave %d/3", G.wave + 1);
	text(s, 110, 52, 0.42f, cMuted, C2D_AlignLeft);
	if (G.tier > 1) { snprintf(s, sizeof s, "Tier %s", ROMAN[G.tier]); text(s, BW - 8, 52, 0.42f, cGrace, C2D_AlignRight); }
	else if (G.defy) { snprintf(s, sizeof s, "Refused x%d", G.defy); text(s, BW - 8, 52, 0.42f, cEmber, C2D_AlignRight); }
	// blessings
	for (int i = 0; i < NB; i++) {
		Rect r = tileRect(i); int h = G.held[i];
		panel(r, h ? cStone2 : cInk, h ? tierCol(BUFFS[i].tier) : cLine);
		icon(i, r.x + r.w / 2, r.y + 12, 20, h ? 1 : 0.25f);
		text(BUFFS[i].shortName, r.x + r.w / 2, r.y + 22, 0.32f, h ? cBone : alpha(cMuted, 0.5f), C2D_AlignCenter);
		if (!h) C2D_DrawLine(r.x + 6, r.y + r.h - 6, alpha(cMuted, 0.6f), r.x + r.w - 6, r.y + 5, alpha(cMuted, 0.6f), 1, 0);
	}
	// tip or status
	Rect tr = {4, 158, BW - 8, 52}; panel(tr, cInk, cLine);
	if (tipBuff >= 0 && tipT > 0) {
		const Buff *b = &BUFFS[tipBuff];
		icon(tipBuff, 26, 184, 30, G.held[tipBuff] ? 1 : 0.4f);
		snprintf(s, sizeof s, "%s  (%s)", b->name, TIER_NAME[b->tier]); text(s, 48, 162, 0.45f, cBone, C2D_AlignLeft);
		if (G.held[tipBuff]) { snprintf(s, sizeof s, "%s  -  upkeep -%.2g/s", b->has, TIER_UP[b->tier]); text(s, 48, 182, 0.4f, cGiltHi, C2D_AlignLeft); icon(SPR_GRACE, BW - 16, 189, 18, 1); }
		else { snprintf(s, sizeof s, "Given up: %s", b->loss); text(s, 48, 182, 0.4f, cMuted, C2D_AlignLeft); }
	} else if (statusT > 0) textWrap(statusMsg, 12, 164, 0.42f, cBone, C2D_AlignLeft, BW - 24);
	else {
		text("Tap a blessing to see what it does", 12, 164, 0.4f, cMuted, C2D_AlignLeft);
		text("Circle Pad: move   START: pause", 12, 184, 0.4f, cMuted, C2D_AlignLeft);
	}
	snprintf(s, sizeof s, "Banked %d  -  Slain %d", G.banked, G.kills); text(s, BW / 2, 218, 0.4f, cMuted, C2D_AlignCenter);
}
static void drawAltar(void) {
	text("An offering is owed", BW / 2, 4, 0.55f, cGiltHi, C2D_AlignCenter);
	char s[128];
	for (int i = 0; i < ncards; i++) {
		Rect r = cardRect(i); Card c = cards[i];
		u32 edge = c.refuse ? cEmber2 : tierCol(BUFFS[c.buff].tier);
		panel(r, sel == i ? RGBA(48, 44, 40, 255) : cStone2, sel == i ? cGiltHi : edge);
		if (c.refuse) {
			text("Refuse", r.x + 8, r.y + 4, 0.55f, cBone, C2D_AlignLeft);
			text("Keep every blessing, but drain will double", r.x + 8, r.y + 24, 0.4f, cBone, C2D_AlignLeft);
			snprintf(s, sizeof s, "Grace drain -%.1f/s -> -%.1f/s", drainRate(), rateIf(-1, G.defy + 1)); text(s, r.x + 8, r.y + 40, 0.4f, cEmberHi, C2D_AlignLeft);
		} else {
			const Buff *b = &BUFFS[c.buff];
			icon(c.buff, r.x + 22, r.y + r.h / 2, 30, 1);
			snprintf(s, sizeof s, "Lose %s", b->name); text(s, r.x + 42, r.y + 3, 0.55f, cBone, C2D_AlignLeft);
			snprintf(s, sizeof s, "+%d", TIER_GAIN[b->tier]); text(s, r.x + r.w - 24, r.y + 4, 0.45f, cGrace, C2D_AlignRight); icon(SPR_GRACE, r.x + r.w - 12, r.y + 11, 20, 1);
			text(b->sum, r.x + 42, r.y + 23, 0.42f, cGiltHi, C2D_AlignLeft);
			snprintf(s, sizeof s, "%s -> %s", b->has, b->loss); text(s, r.x + 42, r.y + 40, 0.34f, cMuted, C2D_AlignLeft);
			snprintf(s, sizeof s, "-%.1f > -%.1f/s", drainRate(), rateIf(c.buff, G.defy)); text(s, r.x + r.w - 6, r.y + 40, 0.34f, cGrace, C2D_AlignRight);
		}
	}
	if (sel >= 0) { button(bConfirm, cards[sel].refuse ? "Refuse the altar (A)" : "Give it up (A)", 1); }
	else text("Tap a card, or use the D-Pad", BW / 2, 220, 0.4f, cMuted, C2D_AlignCenter);
}
static void drawBottom(void) {
	C2D_DrawRectSolid(0, 0, 0, BW, BH, cStone);
	if (state == S_TITLE) {
		text("GRACE", BW / 2, 14, 0.9f, cGraceHi, C2D_AlignCenter);
		if (!howOpen) {
			char s[64];
			if (best > 0) { snprintf(s, sizeof s, "Best score: %d grace", best); text(s, BW / 2, 70, 0.45f, cMuted, C2D_AlignCenter); }
			text("Give up power. Keep your grace.", BW / 2, 100, 0.45f, cBone, C2D_AlignCenter);
			button(bStart, "Start (A)", 1); button(bHow, "How it works", 0);
		} else {
			const char *how[] = {"- Circle Pad moves. You fire on your own.", "- Grace drains while you fight. Blessings cost upkeep.", "- After each Warden, give one blessing up for grace.", "- Walk over sparks for grace and hearts for health.", "- At zero grace your health drains fast.", "- Slabs block every shot. Use them as cover.", "- Clear the last floor bare to ascend. Four tiers.", "- 3D slider adds depth. START pauses."};
			for (int i = 0; i < 8; i++) text(how[i], 10, 50 + i * 18, 0.4f, cBone, C2D_AlignLeft);
			button(bHow, "Close", 0);
		}
	} else if (state == S_PLAY) { drawHud(); drawFlies(1); }
	else if (state == S_ALTAR) drawAltar();
	else if (state == S_STORY) {
		text(storyAt < nStory - 1 ? "Tap or A to continue" : "Tap or A to go on", BW / 2, 100, 0.5f, cBone, C2D_AlignCenter);
		if (nStory > 1 && storyAt < nStory - 1) text("B to skip", BW / 2, 130, 0.42f, cMuted, C2D_AlignCenter);
	} else if (state == S_DEAD) {
		char s[96];
		text(endWon ? "At Rest" : (G.graceOut ? "Graceless" : "Fallen"), BW / 2, 10, 0.7f, endWon ? cGraceHi : cEmber, C2D_AlignCenter);
		snprintf(s, sizeof s, "Score: %d grace", G.banked); text(s, BW / 2, 46, 0.55f, cGraceHi, C2D_AlignCenter);
		if (G.banked >= best && G.banked > 0) text("New best", BW / 2, 70, 0.42f, cGrace, C2D_AlignCenter);
		else { snprintf(s, sizeof s, "Best: %d", best); text(s, BW / 2, 70, 0.42f, cMuted, C2D_AlignCenter); }
		if (G.tier > 1 && !endWon) { snprintf(s, sizeof s, "Tier %s - Floor %d", ROMAN[G.tier], G.floor); } else snprintf(s, sizeof s, "Floor %d", G.floor);
		text(s, BW / 2, 96, 0.45f, cBone, C2D_AlignCenter);
		snprintf(s, sizeof s, "Slain %d", G.kills); text(s, BW / 2, 118, 0.42f, cMuted, C2D_AlignCenter);
		button(bAgain, endWon ? "One more time (A)" : "Begin again (A)", 1);
		if (endWon) button(bStop, "Stop playing (B)", 0);
		else text("B: title", BW / 2, 214, 0.4f, cMuted, C2D_AlignCenter);
	} else if (state == S_PAUSE) {
		text("Paused", BW / 2, 40, 0.8f, cGiltHi, C2D_AlignCenter);
		button(bResume, "Resume (START)", 1); button(bQuit, "Quit to title (SELECT)", 0);
	}
	char v[48]; snprintf(v, sizeof v, "%s", VERSION); if (state == S_TITLE || state == S_PAUSE) text(v, BW - 4, BH - 14, 0.35f, cMuted, C2D_AlignRight);
}

// ------------------------------------------------------------------ flow
static void begin(void) {
	newRun(0, 1, 0, 0); storyReset(); storyTier(1, NULL); storyPlay(NEXT_STARTWAVE);
	status("Walk over sparks for grace and hearts for health");
}
static void stopPlaying(void) { storyReset(); storyAdd("You set it down.", NULL, NULL, 1); storyPlay(NEXT_TITLE); }

int main(int argc, char **argv) {
	(void)argc; (void)argv;
	gfxInitDefault(); gfxSet3D(true);
	C3D_Init(C3D_DEFAULT_CMDBUF_SIZE); C2D_Init(C2D_DEFAULT_MAX_OBJECTS * 4); C2D_Prepare();
	C3D_DepthTest(false, GPU_ALWAYS, GPU_WRITE_COLOR);   // pure painter's order
	C3D_RenderTarget *topL = C2D_CreateScreenTarget(GFX_TOP, GFX_LEFT), *topR = C2D_CreateScreenTarget(GFX_TOP, GFX_RIGHT), *bot = C2D_CreateScreenTarget(GFX_BOTTOM, GFX_LEFT);
	tbuf = C2D_TextBufNew(8192);
	romfsInit(); sheet = C2D_SpriteSheetLoad("romfs:/gfx/sprites.t3x");
	initColours(); srand((unsigned)osGetTime()); loadBest(); audioInit();
	newRun(1, 1, 0, 0); startWave(0);
	int quit = 0;
	while (aptMainLoop() && !quit) {
		hidScanInput(); u32 kDown = hidKeysDown(); kHeld = hidKeysHeld(); hidCircleRead(&cpad);
		touchPosition tp; hidTouchRead(&tp); int tap = (kDown & KEY_TOUCH) != 0;
		if (statusT > 0) statusT -= DT;
		if (tipT > 0) tipT -= DT;

		switch (state) {
		case S_TITLE:
			update(DT);
			if (kDown & KEY_START) { quit = 1; break; }
			if (tap && inRect(bHow, tp.px, tp.py)) { howOpen = !howOpen; sfx(SND_NAV); }
			else if (kDown & KEY_Y) { howOpen = !howOpen; sfx(SND_NAV); }
			else if ((kDown & KEY_A) || (tap && !howOpen && inRect(bStart, tp.px, tp.py))) { howOpen = 0; sfx(SND_PICK); begin(); }
			break;
		case S_PLAY:
			update(DT);
			if (kDown & KEY_START) { state = S_PAUSE; sfx(SND_NAV); break; }
			if (tap) for (int i = 0; i < NB; i++) if (inRect(tileRect(i), tp.px, tp.py)) { tipBuff = i; tipT = 3.0f; sfx(SND_NAV); }
			break;
		case S_PAUSE:
			if ((kDown & KEY_START) || (tap && inRect(bResume, tp.px, tp.py))) { state = S_PLAY; sfx(SND_PICK); }
			else if ((kDown & KEY_SELECT) || (tap && inRect(bQuit, tp.px, tp.py))) { state = S_TITLE; newRun(1, 1, 0, 0); startWave(0); }
			break;
		case S_ALTAR:
			if (kDown & KEY_DUP) { sel = sel <= 0 ? ncards - 1 : sel - 1; sfx(SND_NAV); }
			if (kDown & KEY_DDOWN) { sel = sel < 0 || sel >= ncards - 1 ? 0 : sel + 1; sfx(SND_NAV); }
			if (tap) {
				for (int i = 0; i < ncards; i++) if (inRect(cardRect(i), tp.px, tp.py)) { if (sel == i) { sacrifice(i); goto altarDone; } sel = i; sfx(SND_NAV); }
				if (sel >= 0 && inRect(bConfirm, tp.px, tp.py)) { sacrifice(sel); goto altarDone; }
			}
			if ((kDown & KEY_A) && sel >= 0) sacrifice(sel);
			else if ((kDown & KEY_A) && sel < 0) { sel = 0; sfx(SND_NAV); }
		altarDone:
			break;
		case S_STORY:
			if ((kDown & KEY_A) || tap) storyAdvance(0);
			else if (kDown & KEY_B) storyAdvance(1);
			break;
		case S_DEAD:
			if ((kDown & KEY_A) || (tap && inRect(bAgain, tp.px, tp.py))) { sfx(SND_PICK); begin(); }
			else if (endWon && ((kDown & KEY_B) || (tap && inRect(bStop, tp.px, tp.py)))) stopPlaying();
			else if (!endWon && (kDown & KEY_B)) { state = S_TITLE; newRun(1, 1, 0, 0); startWave(0); }
			break;
		}
		if (quit) break;

		float slider = osGet3DSliderState();
		C2D_TextBufClear(tbuf);
		C3D_FrameBegin(C3D_FRAME_SYNCDRAW);
		C2D_TargetClear(topL, cInk); C2D_SceneBegin(topL); drawTop(-slider * 2.5f); drawTopOverlay();
		if (slider > 0.0f) { C2D_TargetClear(topR, cInk); C2D_SceneBegin(topR); drawTop(slider * 2.5f); drawTopOverlay(); }
		C2D_TargetClear(bot, cStone); C2D_SceneBegin(bot); drawBottom();
		C3D_FrameEnd(0);
	}
	audioExit();
	C2D_TextBufDelete(tbuf);
	if (sheet) C2D_SpriteSheetFree(sheet);
	romfsExit();
	C2D_Fini(); C3D_Fini(); gfxExit();
	return 0;
}
