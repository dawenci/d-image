
declare module 'd-image' {
  export function getImageOrientation(file: any, callback: any): void
  export function imageToUrl(file: any, inputQuality: number|function, callback: function): void
}

