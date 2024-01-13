import { dft, type Fourier } from './fourier';

export function epicycles(
	x: number,
	y: number,
	scale: number,
	rotation: number,
	time: number,
	fourier: Fourier[]
): THREE.Vector2Tuple {
	for (let i = 0; i < fourier.length; i++) {
		let freq = fourier[i].freq;
		let radius = fourier[i].amp;
		let phase = fourier[i].phase;
		x += radius * Math.cos(freq * time + phase + rotation);
		y += radius * Math.sin(freq * time + phase + rotation);
	}

	return [x * scale, y * scale];
}

function dft2d(x: number[], y: number[]) {
	const fourierX = dft(x);
	const fourierY = dft(y);
	return {
		fourierX: fourierX.sort((a, b) => b.amp - a.amp),
		fourierY: fourierY.sort((a, b) => b.amp - a.amp)
	};
}

export function fourierF(
	x1: number,
	y1: number,
	x2: number,
	y2: number,
	scale: number,
	time: number
) {
	// I tried to make an 'F' shape. It does not work.
	const f = dft2d([-1, -1, 1, -1, -1, 1], [1, 0, 0, 0, -1, -1]);
	const ex = epicycles(x1, y1, scale, 0, time, f.fourierX);
	const ey = epicycles(x2, y2, scale, Math.PI / 2, time, f.fourierY);
	return [ex[0], ey[1]];
}
