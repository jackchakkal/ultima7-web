// Exult's image scalers, run on the engine's 320 x 200 paletted frame.
//
// The scaler templates in engine/exult/ are copied unchanged from Exult
// (https://github.com/exult/exult, imagewin/, GPL-2.0-or-later); this file only
// supplies the colour "manipulator" they expect and a frame buffer with the
// guard band Exult keeps around the image.
#include <emscripten.h>
#include <cstdint>
#include <cstdlib>
#include <cstring>
#include <cmath>

using uint8 = std::uint8_t;
using uint16 = std::uint16_t;
using uint32 = std::uint32_t;

#define USE_XBR_SCALER 1
#define USE_HQ2X_SCALER 1
#define USE_HQ3X_SCALER 1
#define USE_HQ4X_SCALER 1
#include "exult/scale_point.h"
#include "exult/scale_interlace.h"
#include "exult/scale_bilinear.h"
#include "exult/scale_2x.h"
#include "exult/scale_2xSaI.h"
#include "exult/scale_hq2x.h"
#include "exult/scale_hq3x.h"
#include "exult/scale_hq4x.h"
#include "exult/scale_xbr.h"
#include "exult/scale_xbr_scalers.inc"

extern "C" uintptr_t web_frame_ptr(void);
extern "C" uintptr_t web_palette_ptr(void);

namespace {
// Canvas ImageData pixels: R, G, B, A bytes, i.e. 0xAABBGGRR little-endian.
uint32 colours[256];
uint8 red[256], green[256], blue[256];

struct WebManip {
	using uintS = unsigned char;
	using uintD = uint32;
	static uintD rgb(unsigned int r, unsigned int g, unsigned int b) {
		return 0xff000000u | (b << 16) | (g << 8) | r;
	}
	static uintD copy(uintS src) { return colours[src]; }
	static void copy(uintD& dest, uintS src) { dest = colours[src]; }
	static void split_source(uintS pix, unsigned int& r, unsigned int& g, unsigned int& b) {
		r = red[pix]; g = green[pix]; b = blue[pix];
	}
	static void split_source(uintS pix, uint8& r, uint8& g, uint8& b) {
		r = red[pix]; g = green[pix]; b = blue[pix];
	}
	static void split_dest(uintD pix, unsigned int& r, unsigned int& g, unsigned int& b) {
		r = pix & 0xff; g = (pix >> 8) & 0xff; b = (pix >> 16) & 0xff;
	}
};

constexpr int W = 320, H = 200, G = 4;          // frame and guard band
constexpr int SW = W + 2 * G, SH = H + 2 * G;   // padded source
uint8 source[SW * SH];
uint32* scaled = nullptr;   // padded destination (SW*f x SH*f)
uint32* output = nullptr;   // compact result (W*f x H*f)
int capacity = 0;
}

enum Method {
	POINT, INTERLACED, BILINEAR, BILINEAR_PLUS, SAI, SUPER_EAGLE, SUPER_SAI, SCALE2X,
	HQ2X, HQ3X, HQ4X, XBR2, XBR3, XBR4
};

static int factor_of(int method, int requested) {
	switch (method) {
	case POINT: case INTERLACED: return requested < 1 ? 1 : requested > 4 ? 4 : requested;
	case HQ3X: case XBR3: return 3;
	case HQ4X: case XBR4: return 4;
	default: return 2;
	}
}

// Scales the current frame. key is the palette index whose colour the page
// supplies (the inventory key, key_rgb as 0xRRGGBB); gamma values are x1000.
// Returns the address of the result; its size is 320*factor x 200*factor,
// with the factor written to *factor_out.
extern "C" EMSCRIPTEN_KEEPALIVE uint32* web_scale_frame(int method, int requested, int key, int key_rgb,
		int gamma_r, int gamma_g, int gamma_b, int* factor_out) {
	const uint8* frame = reinterpret_cast<const uint8*>(web_frame_ptr());
	const uint8* palette = reinterpret_cast<const uint8*>(web_palette_ptr());
	const int gammas[3] = {gamma_r, gamma_g, gamma_b};
	for (int i = 0; i < 256; i++) {
		uint8 c[3];
		for (int k = 0; k < 3; k++) {
			double v = palette[i * 3 + k] * 255.0 / 63.0;
			if (i == key) v = (key_rgb >> (16 - 8 * k)) & 0xff;
			if (gammas[k] != 1000) v = 255.0 * std::pow(v / 255.0, 1000.0 / gammas[k]);
			c[k] = static_cast<uint8>(v < 0 ? 0 : v > 255 ? 255 : v + 0.5);
		}
		red[i] = c[0]; green[i] = c[1]; blue[i] = c[2];
		colours[i] = WebManip::rgb(c[0], c[1], c[2]);
	}
	// padded copy, edges repeated into the guard band
	for (int y = 0; y < SH; y++) {
		int sy = y - G; sy = sy < 0 ? 0 : sy >= H ? H - 1 : sy;
		const uint8* row = frame + sy * W;
		uint8* out = source + y * SW;
		std::memset(out, row[0], G);
		std::memcpy(out + G, row, W);
		std::memset(out + G + W, row[W - 1], G);
	}
	const int f = factor_of(method, requested);
	const int need = SW * f * SH * f;
	if (need > capacity) {
		std::free(scaled); std::free(output);
		scaled = static_cast<uint32*>(std::malloc(need * sizeof(uint32)));
		output = static_cast<uint32*>(std::malloc(W * f * H * f * sizeof(uint32)));
		capacity = need;
	}
	const WebManip manip;
	const int dline = SW * f;
	unsigned char* src = source;
	switch (method) {
	case INTERLACED: Scale_interlace<unsigned char, uint32, WebManip>(src, G, G, W, H, SW, H + G, scaled, dline, manip, f); break;
	case BILINEAR: Scale_2xBilinear<unsigned char, uint32, WebManip>(src, G, G, W, H, SW, H + G, scaled, dline, manip); break;
	case BILINEAR_PLUS: Scale_2xBilinearPlus<unsigned char, uint32, WebManip>(src, G, G, W, H, SW, H + G, scaled, dline, manip); break;
	case SAI: Scale_2xSaI<unsigned char, uint32, WebManip>(src, G, G, W, H, SW, H + G, scaled, dline, manip); break;
	case SUPER_EAGLE: Scale_SuperEagle<unsigned char, uint32, WebManip>(src, G, G, W, H, SW, H + G, scaled, dline, manip); break;
	case SUPER_SAI: Scale_Super2xSaI<unsigned char, uint32, WebManip>(src, G, G, W, H, SW, H + G, scaled, dline, manip); break;
	case SCALE2X: Scale2x_noblur<unsigned char, uint32, WebManip>(src, G, G, W, H, SW, H + G, scaled, dline, manip); break;
	case HQ2X: Scale_Hq2x<uint32, WebManip>(src, G, G, W, H, SW, H + G, scaled, dline, manip); break;
	case HQ3X: Scale_Hq3x<uint32, WebManip>(src, G, G, W, H, SW, H + G, scaled, dline, manip); break;
	case HQ4X: Scale_Hq4x<uint32, WebManip>(src, G, G, W, H, SW, H + G, scaled, dline, manip); break;
	case XBR2: Scale_xBR<uint32, WebManip, Scaler2xBR>(src, G, G, W, H, SW, H + G, scaled, dline, manip); break;
	case XBR3: Scale_xBR<uint32, WebManip, Scaler3xBR>(src, G, G, W, H, SW, H + G, scaled, dline, manip); break;
	case XBR4: Scale_xBR<uint32, WebManip, Scaler4xBR>(src, G, G, W, H, SW, H + G, scaled, dline, manip); break;
	default: Scale_point<unsigned char, uint32, WebManip>(src, G, G, W, H, SW, H + G, scaled, dline, manip, f); break;
	}
	for (int y = 0; y < H * f; y++)
		std::memcpy(output + y * W * f, scaled + (G * f + y) * dline + G * f, W * f * sizeof(uint32));
	*factor_out = f;
	return output;
}
