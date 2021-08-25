/// <reference types="node" />

import { Maybe } from "./types";

declare namespace NodeJS {
  interface ProcessEnv {
    readonly GYAZO_TOKEN: string | undefined;
  }
}