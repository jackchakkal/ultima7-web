// calculate input matrix coordinates after rotation at compile time
template <RotationDegree rotDeg, size_t I, size_t J, size_t N>
struct MatrixRotation;

template <size_t I, size_t J, size_t N>
struct MatrixRotation<ROT_0, I, J, N> {
	enum {
		I_old = I,
		J_old = J
	};
};

template <
		RotationDegree rotDeg, size_t I, size_t J,
		size_t N>    //(i, j) = (row, col) indices, N = size of (square) matrix
struct MatrixRotation {
	enum {
		I_old = N - 1 - MatrixRotation < static_cast<RotationDegree>(rotDeg - 1),
		I,
		J,
		N > ::J_old,    // old coordinates before rotation!
		J_old = MatrixRotation < static_cast<RotationDegree>(rotDeg - 1),
		I,
		J,
		N > ::I_old
	};
};

template <class Dest_pixel, size_t N, RotationDegree rotDeg>
class OutputMatrix {
public:
	// access matrix area, top-left at position "out" for image with given width
	OutputMatrix(Dest_pixel* out, int outWidth) : out_(out), outWidth_(outWidth) {}

	template <size_t I, size_t J>
	Dest_pixel& get() const {
		static const size_t I_old = MatrixRotation<rotDeg, I, J, N>::I_old;
		static const size_t J_old = MatrixRotation<rotDeg, I, J, N>::J_old;
		return *(out_ + J_old + I_old * outWidth_);
	}

private:
	Dest_pixel* out_;
	const int   outWidth_;
};

struct Scaler2xBR {
	enum {
		scale = 2
	};

	template <class OutMatrix, class Buffer_Type>
	static void blendLineSteepAndShallow(OutMatrix& out, const Buffer_Type& col) {
		out.template get<1, 0>().template blend<1, 4>(col);
		out.template get<0, 1>().template blend<1, 4>(col);
		out.template get<1, 1>().template blend<5, 6>(col);    //[!] fixes 7/8 used in original
	}

	template <class OutMatrix, class Buffer_Type>
	static void blendLineShallow(OutMatrix& out, const Buffer_Type& col) {
		out.template get<1, 0>().template blend<1, 4>(col);
		out.template get<1, 1>().template blend<3, 4>(col);
	}

	template <class OutMatrix, class Buffer_Type>
	static void blendLineSteep(OutMatrix& out, const Buffer_Type& col) {
		out.template get<0, 1>().template blend<1, 4>(col);
		out.template get<1, 1>().template blend<3, 4>(col);
	}

	template <class OutMatrix, class Buffer_Type>
	static void blendLineDiagonal(OutMatrix& out, const Buffer_Type& col) {
		out.template get<1, 1>().template blend<1, 2>(col);
	}

	template <class OutMatrix, class Buffer_Type>
	static void blendCorner(OutMatrix& out, const Buffer_Type& col) {
#	if XBR_VARIANT == 4
		// model a round corner
		out.template get<1, 1>().template blend<21, 100>(col);    // exact: 1 - pi/4 = 0.2146018366
#	else
		out.template get<1, 1>().template blend<1, 2>(col);
#	endif
	}
};

struct Scaler3xBR {
	enum {
		scale = 3
	};

	template <class OutMatrix, class Buffer_Type>
	static void blendLineSteepAndShallow(OutMatrix& out, const Buffer_Type& col) {
		out.template get<2, 0>().template blend<1, 4>(col);
		out.template get<0, 2>().template blend<1, 4>(col);
		out.template get<2, 1>().template blend<3, 4>(col);
		out.template get<1, 2>().template blend<3, 4>(col);
		out.template get<2, 2>() = col;
	}

	template <class OutMatrix, class Buffer_Type>
	static void blendLineShallow(OutMatrix& out, const Buffer_Type& col) {
		out.template get<2, 1>().template blend<3, 4>(col);
		out.template get<1, 2>().template blend<1, 4>(col);
		out.template get<2, 0>().template blend<1, 4>(col);
		out.template get<2, 2>() = col;
	}

	template <class OutMatrix, class Buffer_Type>
	static void blendLineSteep(OutMatrix& out, const Buffer_Type& col) {
		out.template get<1, 2>().template blend<3, 4>(col);
		out.template get<2, 1>().template blend<1, 4>(col);
		out.template get<0, 2>().template blend<1, 4>(col);
		out.template get<2, 2>() = col;
	}

	template <class OutMatrix, class Buffer_Type>
	static void blendLineDiagonal(OutMatrix& out, const Buffer_Type& col) {
		out.template get<2, 2>().template blend<7, 8>(col);
		out.template get<1, 2>().template blend<1, 8>(col);
		out.template get<2, 1>().template blend<1, 8>(col);
	}

	template <class OutMatrix, class Buffer_Type>
	static void blendCorner(OutMatrix& out, const Buffer_Type& col) {
#	if XBR_VARIANT == 4
		// model a round corner
		out.template get<2, 2>().template blend<45, 100>(col);    // exact: 0.4545939598
																  // out.template get<2, 1>().template blend<14, 1000>(col);
																  // //0.01413008627 -> negligible out.template get<1, 2>().template
																  // blend<14, 1000>(col); //0.01413008627
#	else
		out.template get<2, 2>().template blend<1, 2>(col);
#	endif
	}
};

struct Scaler4xBR {
	enum {
		scale = 4
	};

	template <class OutMatrix, class Buffer_Type>
	static void blendLineSteepAndShallow(OutMatrix& out, const Buffer_Type& col) {
		out.template get<3, 1>().template blend<3, 4>(col);
		out.template get<1, 3>().template blend<3, 4>(col);
		out.template get<3, 0>().template blend<1, 4>(col);
		out.template get<0, 3>().template blend<1, 4>(col);
		out.template get<2, 2>().template blend<1, 3>(col);    //[!] fixes 1/4 used in original
		out.template get<3, 3>() = out.template get<3, 2>() = out.template get<2, 3>() = col;
	}

	template <class OutMatrix, class Buffer_Type>
	static void blendLineShallow(OutMatrix& out, const Buffer_Type& col) {
		out.template get<2, 3>().template blend<3, 4>(col);
		out.template get<3, 1>().template blend<3, 4>(col);
		out.template get<2, 2>().template blend<1, 4>(col);
		out.template get<3, 0>().template blend<1, 4>(col);
		out.template get<3, 2>() = out.template get<3, 3>() = col;
	}

	template <class OutMatrix, class Buffer_Type>
	static void blendLineSteep(OutMatrix& out, const Buffer_Type& col) {
		out.template get<3, 2>().template blend<3, 4>(col);
		out.template get<1, 3>().template blend<3, 4>(col);
		out.template get<2, 2>().template blend<1, 4>(col);
		out.template get<0, 3>().template blend<1, 4>(col);
		out.template get<2, 3>() = out.template get<3, 3>() = col;
	}

	template <class OutMatrix, class Buffer_Type>
	static void blendLineDiagonal(OutMatrix& out, const Buffer_Type& col) {
		out.template get<2, 3>().template blend<1, 2>(col);
		out.template get<3, 2>().template blend<1, 2>(col);
		out.template get<3, 3>() = col;
	}

	template <class OutMatrix, class Buffer_Type>
	static void blendCorner(OutMatrix& out, const Buffer_Type& col) {
#	if XBR_VARIANT == 4
		// model a round corner
		out.template get<3, 3>().template blend<68, 100>(col);    // exact: 0.6848532563
		out.template get<3, 2>().template blend<9, 100>(col);     // 0.08677704501
		out.template get<2, 3>().template blend<9, 100>(col);     // 0.08677704501
#	else
		out.template get<3, 3>().template blend<1, 2>(col);
#	endif
	}
};

