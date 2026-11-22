// Types for the vendored @ybouane/liquidglass v1.0.3 bundle (subset FTCPanel uses).

export interface GlassConfig {
	blurAmount: number;
	refraction: number;
	chromAberration: number;
	edgeHighlight: number;
	specular: number;
	fresnel: number;
	distortion: number;
	cornerRadius: number;
	zRadius: number;
	opacity: number;
	saturation: number;
	tintStrength: number;
	brightness: number;
	shadowOpacity: number;
	shadowSpread: number;
	shadowOffsetY: number;
	floating: boolean;
	button: boolean;
	bevelMode: number;
}

export interface LiquidGlassOptions {
	/** Container; glass elements must be its direct children. Never captured itself. */
	root: HTMLElement;
	glassElements?: NodeListOf<HTMLElement> | HTMLElement[];
	defaults?: Partial<GlassConfig>;
}

export declare class LiquidGlass {
	static init(options: LiquidGlassOptions): Promise<LiquidGlass>;
	readonly fps: number;
	/** DOM rasterizer for the root's non-glass children (html-to-image). */
	readonly capture: {
		/** Re-rasterize `element`; the previous raster stays in use until the new one lands. */
		captureElement(element: HTMLElement, force?: boolean): Promise<void>;
	};
	destroy(): void;
	/** Flag content the library can't observe (e.g. a CSS background that changed). */
	markChanged(element?: HTMLElement): void;
}

export declare const DEFAULTS: GlassConfig;
export declare function invalidateFontEmbedCache(): void;
/**
 * FTCPanel patch: background captures skip the subtree of any element for which `fn` returns
 * true (the element keeps its box). Lets a long page be re-captured near only what glass sees.
 */
export declare function setCapturePrune(fn: ((node: Node) => boolean) | null): void;
