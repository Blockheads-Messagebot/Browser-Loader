declare module '*.html' {
    const content: string
    export default content
}

declare module 'save-as' {
    function saveAs(data: Blob, filename: string, noAutoBOM?: boolean): void;
}