/**
 * onDevicePredictor.ts
 *
 * Runs inference in the browser using onnxruntime-web.
 * Falls back gracefully if ONNX not available.
 *
 * Usage:
 *   const ready = await initOnDevice()
 *   if (ready) {
 *     const { score, role } = await predictOnDevice(detectedSkills, numericFeatures)
 *   }
 */

let ort: any = null
let scoreSession: any = null
let roleSession: any = null
let vocabulary: string[] = []

export const ON_DEVICE_AVAILABLE = typeof window !== 'undefined' && 'WebAssembly' in window

/** Load models + vocab once (call at app start or lazily). */
export async function initOnDevice(): Promise<boolean> {
    if (!ON_DEVICE_AVAILABLE) return false
    try {
        // Dynamic import so it doesn't break SSR / non-ONNX builds
        ort = await import('onnxruntime-web')
        // Force single thread to avoid worker resolution issues in dev
        ort.env.wasm.numThreads = 1
        // Use full URL to avoid Vite resolution issues
        const base = window.location.origin + '/ort/'
        ort.env.wasm.wasmPaths = {
            'ort-wasm-simd-threaded.jsep.mjs': base + 'ort-wasm-simd-threaded.jsep.js',
            'ort-wasm-simd-threaded.jsep.wasm': base + 'ort-wasm-simd-threaded.jsep.wasm',
            'ort-wasm-simd-threaded.wasm': base + 'ort-wasm-simd-threaded.wasm',
            'ort-wasm-simd-threaded.mjs': base + 'ort-wasm-simd-threaded.js',
            'ort-wasm-simd-threaded.asyncify.mjs': base + 'ort-wasm-simd-threaded.asyncify.js',
            'ort-wasm-simd-threaded.asyncify.wasm': base + 'ort-wasm-simd-threaded.asyncify.wasm',
            'ort-wasm-simd-threaded.jspi.mjs': base + 'ort-wasm-simd-threaded.jspi.js',
            'ort-wasm-simd-threaded.jspi.wasm': base + 'ort-wasm-simd-threaded.jspi.wasm',
            'ort-wasm.wasm': base + 'ort-wasm.wasm', // in case it falls back
            'ort-wasm-simd.wasm': base + 'ort-wasm-simd.wasm',
        }

        // Load vocabulary
        const vocabRes = await fetch('/models/vocabulary_v2_list.json')
        if (!vocabRes.ok) throw new Error('vocab not found')
        vocabulary = await vocabRes.json()

        // Load score model
        scoreSession = await ort.InferenceSession.create('/models/score_model_v2.onnx', {
            executionProviders: ['wasm'],
        })

        // Load role model (optional)
        try {
            roleSession = await ort.InferenceSession.create('/models/role_model_v2.onnx', {
                executionProviders: ['wasm'],
            })
        } catch { /* role model optional */ }

        console.log('[OnDevice] Models loaded — on-device inference ready ✅')
        return true
    } catch (e) {
        console.warn('[OnDevice] Models not found — server-side inference used', e)
        return false
    }
}

/** Build feature vector matching training pipeline. */
function buildFeatureVector(
    skills: string[],
    projectScore: number,
    atsScore: number,
    structScore: number,
    coreCov: number,
    optCov: number,
): Float32Array {
    const skillsLower = skills.map(s => s.toLowerCase())
    const vec = new Float32Array(vocabulary.length + 5)

    // Binary skill encoding
    vocabulary.forEach((v, i) => {
        vec[i] = skillsLower.includes(v.toLowerCase()) ? 1 : 0
    })

    // Numeric features (normalised to 0-1)
    const base = vocabulary.length
    vec[base + 0] = projectScore / 100
    vec[base + 1] = atsScore / 100
    vec[base + 2] = structScore / 100
    vec[base + 3] = coreCov / 100
    vec[base + 4] = optCov / 100

    return vec
}

export interface OnDeviceResult {
    score: number
    predictedRole?: string
    inferenceMs: number
    onDevice: true
}

/** Run on-device prediction. Throws if models not loaded. */
export async function predictOnDevice(
    skills: string[],
    projectScore: number,
    atsScore: number,
    structScore: number,
    coreCov: number,
    optCov: number,
): Promise<OnDeviceResult> {
    if (!scoreSession) throw new Error('Score model not loaded')

    const t0 = performance.now()
    const vec = buildFeatureVector(skills, projectScore, atsScore, structScore, coreCov, optCov)

    // Score prediction
    const scoreTensor = new ort.Tensor('float32', vec, [1, vec.length])
    const scoreOutput = await scoreSession.run({ float_input: scoreTensor })
    const rawScore = scoreOutput['variable']?.data?.[0]
        ?? scoreOutput[Object.keys(scoreOutput)[0]]?.data?.[0]
        ?? 50
    const score = Math.min(100, Math.max(0, Math.round(Number(rawScore))))

    // Role prediction (optional)
    let predictedRole: string | undefined
    if (roleSession) {
        const roleOutput = await roleSession.run({ float_input: new ort.Tensor('float32', vec, [1, vec.length]) })
        const labelData = roleOutput['label']?.data?.[0]
            ?? roleOutput[Object.keys(roleOutput)[0]]?.data?.[0]
        predictedRole = String(labelData ?? '')
    }

    return {
        score,
        predictedRole: predictedRole || undefined,
        inferenceMs: Math.round(performance.now() - t0),
        onDevice: true,
    }
}

/** Check if models are currently loaded. */
export function isOnDeviceReady(): boolean {
    return !!scoreSession
}
