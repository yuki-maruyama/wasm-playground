use wasm_bindgen::prelude::*;
use js_sys::JsString;
use num_complex::Complex;

const ITERATIONS: u32 = 1000;
const ESCAPE_RADIUS: f64 = 2.0;

#[wasm_bindgen]
pub fn generate_mandelbrot(width: usize, height: usize) -> JsString {
    const XMIN: f64 = -2.0;
    const YMIN: f64 = -1.5;
    const XMAX: f64 = 1.0;
    const YMAX: f64 = 1.5;

    let mut art = String::new();

    for py in 0..height {
        let y = YMIN + (py as f64 / height as f64) * (YMAX - YMIN);
        for px in 0..width {
            let x = XMIN + (px as f64 / width as f64) * (XMAX - XMIN);
            let c = Complex::new(x, y);
            let m = mandelbrot(c);
            let ch = match m {
                m if m < 10 => ' ',
                m if m >= 10 && m < 20 => '.',
                m if m >= 20 && m < 40 => '*',
                m if m >= 40 && m < 100 => 'o',
                m if m >= 100 && m < 200 => 'O',
                _ => '@',
            };
            art.push(ch);
        }
        art.push('\n');
    }

    art.into()
}

fn mandelbrot(c: Complex<f64>) -> u32 {
    let mut z = Complex::new(0.0, 0.0);
    for n in 0..ITERATIONS {
        z = z * z + c;
        if z.norm() > ESCAPE_RADIUS {
            return n;
        }
    }
    ITERATIONS
}
