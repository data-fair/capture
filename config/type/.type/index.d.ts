
export const schemaExports: string[]

// see https://github.com/bcherny/json-schema-to-typescript/issues/439 if some types are not exported
export type ApiConfig = {
  port: number;
  publicUrl?: string;
  privateDirectoryUrl?: string;
  helmet: {
    active: boolean;
  };
  secretKeys: {
    capture: string;
    inspect?: string;
  };
  observer: {
    active?: boolean;
    port?: number;
    [k: string]: unknown;
  };
  puppeteerLaunchOptions: {
    [k: string]: unknown;
  };
  concurrency: number;
  inspectConcurrency: number;
  defaultLang: string;
  defaultTimezone: string;
  onlySameHost?: boolean;
  useHostHeader?: boolean;
  screenshotTimeout: number;
  /**
   * How long a page that does not call window.triggerCapture is waited for
   */
  wait: {
    /**
     * milliseconds without any network request before the page is considered loaded
     */
    networkIdleTime: number;
    /**
     * then, milliseconds without DOM mutation, animation frame, finite animation or font loading before the capture
     */
    quietTime: number;
    /**
     * the longest wait for that quiet, after the network is idle
     */
    maxSettleTime: number;
  };
  /**
   * above this number of pixels, and for full page captures, PNG screenshots are encoded for speed rather than size
   */
  pngFastEncodingPixels: number;
  maxAnimationFrames: number;
  util?: unknown;
  get?: unknown;
  has?: unknown;
}


export declare function validate(data: any): data is ApiConfig
export declare function assertValid(data: any, options?: import('@data-fair/lib-validation').AssertValidOptions): asserts data is ApiConfig
export declare function returnValid(data: any, options?: import('@data-fair/lib-validation').AssertValidOptions): ApiConfig
      